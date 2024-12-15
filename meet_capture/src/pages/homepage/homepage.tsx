import { useState, useRef } from "react";
import "../../App.css";

interface AudioState {
  isRecording: boolean;
  audioBlob: Blob | null;
  error: string | null;
}

interface FileSystemDirectoryHandle {
  getFileHandle(
    name: string,
    options?: { create?: boolean }
  ): Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream extends WritableStream {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  write(data: any): Promise<void>;
  close(): Promise<void>;
}

declare global {
  interface Window {
    showDirectoryPicker(): Promise<FileSystemDirectoryHandle>;
  }
}

export default function Homepage() {
  const [state, setState] = useState<AudioState>({
    isRecording: false,
    audioBlob: null,
    error: null,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamsRef = useRef<MediaStream[]>([]);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      // Cleanup any existing recordings
      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }
      streamsRef.current.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });
      streamsRef.current = [];
      chunksRef.current = [];

      audioContextRef.current = new AudioContext({
        sampleRate: 48000,
        latencyHint: "interactive",
      });

      // Get tab audio and video
      const tabStream = await new Promise<MediaStream>((resolve, reject) => {
        chrome.tabCapture.capture(
          {
            audio: true,
            video: true,
            videoConstraints: {
              mandatory: {
                minWidth: 1280,
                minHeight: 720,
                maxWidth: 1920,
                maxHeight: 1080,
                maxFrameRate: 30,
              },
            },
            audioConstraints: {
              mandatory: {
                echoCancellation: false,
                noiseSuppression: false,
                autoGainControl: false,
              },
            },
          },
          (stream) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else if (stream) {
              resolve(stream);
            } else {
              reject(new Error("Failed to capture tab media"));
            }
          }
        );
      });
      streamsRef.current.push(tabStream);

      // Get microphone audio
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: true,
        },
      });
      streamsRef.current.push(micStream);

      // Set up audio mixing
      const ctx = audioContextRef.current;
      const tabSource = ctx.createMediaStreamSource(tabStream);
      const micSource = ctx.createMediaStreamSource(micStream);
      const destination = ctx.createMediaStreamDestination();

      // Create gain nodes for volume control
      const tabGain = ctx.createGain();
      const micGain = ctx.createGain();

      tabGain.gain.value = 1;
      micGain.gain.value = 1.4;

      // Connect audio sources to recording destination
      tabSource.connect(tabGain).connect(destination);
      micSource.connect(micGain).connect(destination);

      // Add passthrough to speakers for tab audio
      const speakerDestination = ctx.destination;
      tabSource.connect(speakerDestination);

      // Create a new MediaStream that includes both video and mixed audio
      const combinedStream = new MediaStream();

      // Add video track from tab capture
      const videoTrack = tabStream.getVideoTracks()[0];
      if (videoTrack) {
        combinedStream.addTrack(videoTrack);
      }

      // Add mixed audio track
      destination.stream.getAudioTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });

      // MediaRecorder
      const options = {
        mimeType: "video/webm;codecs=h264,opus",
        videoBitsPerSecond: 5000000, // 2.5 Mbps
        audioBitsPerSecond: 256000, // 256 kbps
      };

      const mediaRecorder = new MediaRecorder(combinedStream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(chunksRef.current, {
          type: "video/webm",
        });

        setState((prev) => ({ ...prev, mediaBlob: webmBlob }));

        const url = URL.createObjectURL(webmBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `recording-${new Date().toISOString()}.webm`;
        a.click();

        URL.revokeObjectURL(url);
      };

      // Start recording in 0.1-second chunks
      mediaRecorder.start(100);
      setState((prev) => ({ ...prev, isRecording: true, error: null }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `Failed to start recording: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }));
    }
  };

  const stopRecording = async () => {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }

      // Stop all tracks
      streamsRef.current.forEach((stream) => {
        stream.getTracks().forEach((track) => track.stop());
      });

      // Close audio context
      if (audioContextRef.current) {
        await audioContextRef.current.close();
      }

      setState((prev) => ({ ...prev, isRecording: false }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: `Failed to stop recording: ${
          error instanceof Error ? error.message : String(error)
        }`,
      }));
    }
  };

  return (
    <div className="mainMenu">
      <h2>Meet Capture</h2>
      <div>
        <button onClick={state.isRecording ? stopRecording : startRecording}>
          {state.isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
    </div>
  );
}

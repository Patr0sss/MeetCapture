declare global {
  interface MediaTrackConstraintSet {
    chromeMediaSource?: string;
    chromeMediaSourceId?: string;
  }
}

// add listeners for messages
chrome.runtime.onMessage.addListener((request, sender) => {
  console.log("OFFSCREEN message received", sender);
  switch (request.type) {
    case "startRecording":
      console.log("offscreen start recording tab");
      startRecording(request.data);

      break;
    case "stopRecording":
      console.log("offscreen stop recording tab");
      stopRecording();

      break;
    default:
      console.error("Unknown message type: " + request.type);
  }
});

let recorder: MediaRecorder | undefined;
let data: Blob[] = [];

async function stopRecording() {
  if (recorder?.state === "recording") {
    recorder.stop();
    recorder.stream.getTracks().forEach((track) => track.stop());
  }
}

async function startRecording(streamId: string) {
  try {
    // Clear previous recording data
    data.length = 0;

    console.log("start recording tab", streamId);

    const tabStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      video: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: streamId,
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const microphone = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    //combine streams
    const mixedContext = new AudioContext();
    const mixedDest = mixedContext.createMediaStreamDestination();
    mixedContext.createMediaStreamSource(microphone).connect(mixedDest);

    const tabAudioSource = mixedContext.createMediaStreamSource(tabStream);
    tabAudioSource.connect(mixedContext.destination);
    tabAudioSource.connect(mixedDest);

    const combinedStream = new MediaStream([
      ...tabStream.getVideoTracks(),
      ...mixedDest.stream.getAudioTracks(),
    ]);

    recorder = new MediaRecorder(combinedStream, {
      mimeType: "video/webm;codecs=h264,opus",
      videoBitsPerSecond: 5000000,
    });

    //listen for data
    recorder.ondataavailable = (event) => {
      data.push(event.data);
    };

    //listen for when revording stops
    recorder.onstop = async () => {
      const blob = new Blob(data, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      console.log("recording stopped", url);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording.webm`;
      a.click();
      URL.revokeObjectURL(url);
      data = [];
    };

    // start recording
    recorder.start();
  } catch (err) {
    console.log("Error in startRecording", err);
  }
}

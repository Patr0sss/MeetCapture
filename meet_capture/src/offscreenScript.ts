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

// Reset timestamps via messaging
const resetTimer = async () => {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: "resetTimestamps" }, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        console.log("Timestamps reset");
        resolve(response);
      }
    });
  });
};

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
      mimeType: "video/mp4; codecs=avc1,mp4a.40.2",
      videoBitsPerSecond: 5000000,
    });

    //listen for data
    recorder.ondataavailable = (event) => {
      console.log("Data available to read: ", event.data);
      data.push(event.data);
    };

    // sen
    const fetchReadyTimestamps = async () => {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { action: "fetchTimestamps" },
          (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response.timestamps || []);
            }
          }
        );
      });
    };

    //listen for when revording stops
    recorder.onstop = async () => {
      console.log("Recording stopped.");
      const blob = new Blob(data, { type: "video/mp4" });

      const formData = new FormData();
      formData.append("video", blob, "recording.mp4");
      console.log("Blob type:", blob.type);

      try {
        const state = (await fetchReadyTimestamps()) as {
          timestamps: string[];
        };
        formData.append("timestamps", JSON.stringify(state));
      } catch (err) {
        console.error("Error fetching timestamps:", err);
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:5000/process-video", {
          method: "POST",
          body: formData,
        });
        const result = await response.json();
        console.log("Server response:", result);
      } catch (err) {
        console.error("Error uploading video:", err);
      }

      // Save locally and cleanup
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `recording.mp4`;
      a.click();
      URL.revokeObjectURL(url);
      data = [];

      if (combinedStream) {
        combinedStream.getTracks().forEach((track) => track.stop());
      }
      if (tabStream) {
        tabStream.getTracks().forEach((track) => track.stop());
      }
      if (microphone) {
        microphone.getTracks().forEach((track) => track.stop());
      }
    };

    // start recording
    await resetTimer();
    recorder.start();
  } catch (err) {
    console.log("Error in startRecording", err);
  }
}

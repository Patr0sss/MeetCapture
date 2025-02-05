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

    // const fetchEventData = async () => {
    //   return new Promise<{ eventId: string | undefined, creatorEmail: string | undefined, googleAuthToken: string | undefined }>((resolve, reject) => {
    //     chrome.runtime.sendMessage({ action: "fetchEventData" }, (response) => {
    //       if (chrome.runtime.lastError) {
    //         reject(chrome.runtime.lastError);
    //       } else {
    //         resolve({
    //           eventId: response.eventId,
    //           creatorEmail: response.creatorEmail,
    //           googleAuthToken: response.googleAuthToken
    //         });
    //      }
    //    });
    //  });
    //};

    

    //listen for when revording stops
    recorder.onstop = async () => {
      console.log("Recording stopped.");
      const blob = new Blob(data, { type: "video/mp4" });

      const formData = new FormData();
      formData.append("video", blob, "recording.mp4");
      console.log("Blob type:", blob.type);

      try {
        // Fetch timestamps
        const state = (await fetchReadyTimestamps()) as { timestamps: string[] };
        formData.append("timestamps", JSON.stringify(state));
      } catch (err) {
        console.error("Error fetching timestamps:", err);
        return;
      }

      // try {
        // Fetch eventId and creatorEmail from the background script
        //const { eventId, creatorEmail, googleAuthToken } = await fetchEventData();
      
        // if (!eventId || !creatorEmail || !googleAuthToken) {
        //console.error("Event ID or creator email not found.");
        //return;
        //}
      

        // Append eventId and creatorEmail to the formData
        // formData.append("eventId", eventId);
        // formData.append("creatorEmail", creatorEmail);
        // formData.append("googleAuthToken", googleAuthToken);
        
      //}catch (err) {
        //console.error("Error fetching eventData:", err);
        //return;
      //}

      try {

          chrome.runtime.sendMessage({ action: 'setProcessing', isProcessing: true });
          console.log("isProcessing set to true");

          fetch("http://127.0.0.1:5000/process-video", {
            method: "POST",
            body: formData,
          })
            .then((response) => response.json())
            .then((result) => {
              console.log("Server response:", result);
              chrome.runtime.sendMessage({ action: 'setProcessing', isProcessing: false });
            })
            .catch((err) => {
              chrome.runtime.sendMessage({ action: 'setProcessing', isProcessing: false });
              console.error("Error uploading video:", err);
            });
      } catch (err) {
        chrome.runtime.sendMessage({ action: 'setProcessing', isProcessing: false });
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

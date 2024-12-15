// check
const fetchRecordingState = async () => {
  const isRecording = await chrome.storage.local.get("isRecording");
  const isRecordingStatus = isRecording.isRecording || false;
  const recordingType = isRecording.type || "";
  return [isRecordingStatus, recordingType];
};

// update recording state
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const updateRecording = async (state: boolean, type: any) => {
  chrome.storage.local.set({ isRecording: state, type });
};

const startRecording = async (type: string) => {
  console.log("start recording", type);
  const currentState = await fetchRecordingState();
  console.log("current state", currentState);
  updateRecording(true, type);
  recordTabState(true);
  await chrome.storage.local.set({ isRecording: true });
};

const stopRecording = async () => {
  console.log("stop recording");
  updateRecording(false, "");
  recordTabState(false);
  await chrome.storage.local.set({ isRecording: false });
};

const recordTabState = async (start = true) => {
  const existingContexts = await chrome.runtime.getContexts({});
  const offscreenDocument = existingContexts.find(
    (context) => context.contextType === "OFFSCREEN_DOCUMENT"
  );

  if (!offscreenDocument) {
    await chrome.offscreen.createDocument({
      url: "./offscreen.html",
      reasons: ["DISPLAY_MEDIA", "USER_MEDIA"] as chrome.offscreen.Reason[],
      justification: "Recording from chrome.tabCaputre API",
    });
  }
  if (start) {
    const tab = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab) {
      console.log("NO TAB");
      return;
    }

    const tabId = tab[0].id;
    console.log("tab Id :", tabId);

    //Get stream ID using Promise
    const streamId = await new Promise((resolve) => {
      chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) =>
        resolve(streamId)
      );
    });
    console.log("stream Id :", streamId);

    chrome.runtime.sendMessage({
      type: "startRecording",
      target: "offsreen",
      data: streamId,
    });
  } else {
    //stop
    chrome.runtime.sendMessage({
      type: "stopRecording",
      target: "offsreen",
    });
  }
};

// add listeners for messages
chrome.runtime.onMessage.addListener((request, sender) => {
  console.log("message received", sender);
  switch (request.type) {
    case "startRecording":
      startRecording(request.recordingType);
      break;
    case "stopRecording":
      stopRecording();
      break;
    default:
      console.error("Unknown message type: " + request.type);
  }
});

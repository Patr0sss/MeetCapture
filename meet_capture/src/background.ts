// import axios from 'axios';

// generate current time 
const operation = {
  now: () => Math.floor(Date.now() / 1000)
};

// startTimer used only once to initialize timer in chrome storage
const startTimer = async () => {
  console.log("Start timer");
  // Initialize timer in chrome storage
  await chrome.storage.local.set({
    timestamps: [],
  });

};
startTimer();

/**
 * @param seconds 
 * @returns string
 */
// convert seconds to HH:MM:SS
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600); 
  const minutes = Math.floor((seconds % 3600) / 60); 
  const remainingSeconds = Math.floor(seconds % 60); 

  // format as HH:MM:SS
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

// const resetTimer = async () => { 
//   console.log("Reset timer");
//   await chrome.storage.local.set({
//     timestamps: [],
//   });
// }

const addTimestamp = async () => {
  console.log("Add timestamp");

  const state = await chrome.storage.local.get(["time", "timestamps", "firstTimestamp"]);
  const newTimeInMilliseconds = operation.now() - state.firstTimestamp;
  const formattedTime = formatTime(newTimeInMilliseconds);
  await chrome.storage.local.set({
    timestamps: [...state.timestamps, formattedTime], 
  });

  console.log("Timestamp added:", formattedTime);
};

// debugging function
const showCurrentTimestamps = async () => {
  const state = await chrome.storage.local.get(["timestamps"]);
  console.log("Timestamps: ", state.timestamps);  
}


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
  // when recording starts, set first timestamp as current time and isSendingTimestampAllowed declared to false
  await chrome.storage.local.set({ isRecording: true,isSendingTimestampAllowed: false, firstTimestamp: operation.now() });
};

const stopRecording = async () => {
  console.log("stop recording"); 
  updateRecording(false, "");
  recordTabState(false);
  // when recording stops, set isSendingTimestampAllowed declared to true
  await chrome.storage.local.set({ isRecording: false, isSendingTimestampAllowed: true });
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

// listening for keyboard shortcut usage
chrome.commands.onCommand.addListener((command) => {
  console.log("Test command", command);
  if (command === "takeScreenshot") {
    console.log("take screenshot");
    addTimestamp();
    showCurrentTimestamps();
  }
  
});

// detecting if state in chrome.storage.local changes

interface StorageChange {
  [key: string]: chrome.storage.StorageChange;
}
const handleStorageChange = (changes: StorageChange, areaName: string) => {
  console.log("Storage change detected:", changes, "Area:", areaName);

  if (areaName === "local" && changes.isSendingTimestampAllowed) {
    const newValue = changes.isSendingTimestampAllowed.newValue;
    console.log("New value for isSendingTimestampAllowed:", newValue);
  }
};

chrome.storage.onChanged.addListener(handleStorageChange);

// listeners to work with offscreen script
// not able to use storage from offscreen
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === "fetchTimestamps") {
    chrome.storage.local.get(["timestamps"], (result) => {
      sendResponse({ timestamps: result.timestamps || [] });
    });
    return true; 
  }

  if (message.action === "resetTimestamps") {
    chrome.storage.local.set({ timestamps: [] }, () => {
      sendResponse({ success: true });
    });
    return true; 
  }
  
  if (message.action === 'setProcessing') {
    chrome.storage.local.set({ isProcessing: message.isProcessing }, () => {
      console.log('isProcessing ustawiony na:', message.isProcessing);
    });
  }

  if (message.action === "fetchEventData") {
    chrome.storage.local.get(["selectedEventId", "creatorEmail","googleAuthToken"], (result) => {
      sendResponse({ 
        eventId: result.selectedEventId,
        creatorEmail: result.creatorEmail,
        googleAuthToken: result.googleAuthToken
      });
    });
    return true; 
  }


});

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

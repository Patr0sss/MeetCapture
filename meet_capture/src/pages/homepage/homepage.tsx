import { useEffect, useState } from "react";
import "../../App.css";

interface AudioState {
  isRecording: boolean;
  audioBlob: Blob | null;
  error: string | null;
}

export default function Homepage() {
  const [state, setState] = useState<AudioState>({
    isRecording: false,
    audioBlob: null,
    error: null,
  });

  // Load initial state on component mount
  useEffect(() => {
    fetchRecordingState();
  }, []);

  const saveRecordingState = async (isRecording: boolean) => {
    setState((prev) => ({ ...prev, isRecording }));
    await chrome.storage.local.set({ isRecording });
  };

  const fetchRecordingState = async () => {
    const isRec = await chrome.storage.local.get("isRecording");
    setState((prev) => ({
      ...prev,
      isRecording: isRec.isRecording || false,
    }));
  };

  const updateRecording = async (type: string) => {
    await chrome.runtime.sendMessage({
      type: "startRecording",
      recordingType: type,
    });

    if (state.isRecording) {
      await chrome.runtime.sendMessage({
        type: "stopRecording",
        recordingType: type,
      });
      saveRecordingState(false);
    } else {
      await chrome.runtime.sendMessage({
        type: "startRecording",
        recordingType: type,
      });
      saveRecordingState(true);
      window.close();
    }

    await fetchRecordingState();
  };

  return (
    <div className="mainMenu">
      <h2>Meet Capture</h2>
      <div>
        <button onClick={() => updateRecording("startRecording")}>
          {state.isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>
    </div>
  );
}

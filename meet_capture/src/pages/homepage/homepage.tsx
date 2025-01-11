import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import "../../App.css";
import { Page } from "../../App";
import axios from "axios";

interface AudioState {
  isRecording: boolean;
  audioBlob: Blob | null;
  error: string | null;
}

export default function Homepage({
  setIsLoggedIn,
  setCurrentPage,
}: {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  setCurrentPage: Dispatch<SetStateAction<Page>>;
}) {
  const [state, setState] = useState<AudioState>({
    isRecording: false,
    audioBlob: null,
    error: null,
  });

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

  const logoutUser = async () => {
    try {
      await axios.post("http://127.0.0.1:5000/logout", {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      setIsLoggedIn(false);
      localStorage.removeItem("access_token");
      setCurrentPage("login");
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="mainMenu">
      <h2>Meet Capture</h2>
      <Button
        onClick={() => updateRecording("startRecording")}
        variant="contained"
        style={{ width: "75%" }}
      >
        {state.isRecording ? "Stop Recording" : "Start Recording"}
      </Button>

      <Button
        onClick={() => setCurrentPage("reports")}
        variant="contained"
        style={{ marginTop: "10px", width: "75%" }}
      >
        Reports
      </Button>

      <Button
        onClick={logoutUser}
        variant="outlined"
        color="error"
        style={{ marginTop: "10px" }}
      >
        Logout
      </Button>
    </div>
  );
}

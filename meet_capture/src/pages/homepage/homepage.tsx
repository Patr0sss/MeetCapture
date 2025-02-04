import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import "../../App.css";
import { Page } from "../../App";
import axios from "axios";
import './homepage.css';
import { FcGoogle } from "react-icons/fc";

interface AudioState {
  isRecording: boolean;
  audioBlob: Blob | null;
  error: string | null;
}

interface StorageChange {
  [key: string]: chrome.storage.StorageChange;
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

  const [isProcessingData,setIsProcessingData] = useState<boolean>(false);
  const [googleUserData,setGoogleUserData] = useState<any>(""); // trzeba użwac local storage
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState<boolean>(false); // trzeba użwac local storage


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

  const loginGoogle = async () => {
    chrome.identity.getAuthToken({interactive: true}, function(token) {
      let init = {
        method: 'GET',
        async: true,
        headers: {
          Authorization: 'Bearer ' + token,
          'Content-Type': 'application/json'
        },
        data: {
          upstream_params:{
            "prompt":{ "value" : "select_account" }
          }
        },
        'contentType': 'json'
      };

      chrome.storage.local.set({ googleAuthToken: token }, function() {
        if (chrome.runtime.lastError) {
          console.error('Error saving token to local storage:', chrome.runtime.lastError);
        } else {
          console.log('OAuth token saved to local storage!' + token);
        }
      });
      
      fetch('https://www.googleapis.com/oauth2/v3/userinfo', init)
        .then(response => response.json())
        .then(function(data) {
          console.log("CZY TU JEST TOKEN: " + data); 
          setGoogleUserData(data);
          setIsGoogleLoggedIn(true)
        });
        // chrome.storage.local.set({ isLogin: true }, function() {
        //   console.log('User is logged in.');
        // });
    });
  };

  const logoutGoogle = async () => {
    chrome.identity.getAuthToken({ interactive: false }, function (token) {
      if (chrome.runtime.lastError) {
        console.error('Failed to get token:', chrome.runtime.lastError);
        return;
      }

      if (!token) {
        console.log('No token found, user is already logged out.');
        return;
      }

      chrome.identity.removeCachedAuthToken({ token }, function () {
        console.log('Token removed.');

        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
          .then(() => {
            console.log('Token revoked from Google servers.');
          })
          .catch(error => console.error('Error revoking token:', error));

        setGoogleUserData(null);
        setIsGoogleLoggedIn(false);

        chrome.storage.local.set({ isLogin: false }, function () {
          console.log('User is logged out.');
        });
      });
    });
  };

  useEffect(() => { 
    chrome.storage.local.get("isProcessing", (result) => {
      if (result.isProcessing !== undefined) {
        setIsProcessingData(result.isProcessing);
      }
    });
  
    const handleStorageChange = (changes: StorageChange, areaName: string) => {
      if (areaName === "local" && changes.isProcessing) {
        setIsProcessingData(changes.isProcessing.newValue);
      }
    };
  
    chrome.storage.onChanged.addListener(handleStorageChange);
  
    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);



  return (
    <div className="mainMenu">
      <h2>Meet Capture</h2>
      {isGoogleLoggedIn ?
        <div style={{height: "10px",marginBottom: "5px"}}>Logged into google: {googleUserData.name}</div>
        :
        null
      }
      <Button
        className={isProcessingData ? "blocked" : "not-blocked"}
        onClick={() => updateRecording("startRecording")}
        variant="contained"
        style={{ width: "75%" }}
        disabled={isProcessingData}
      >
        {state.isRecording ? "Stop Recording" : "Start Recording"}
      </Button>

      <Button
        onClick={() => setCurrentPage("reports")}
        variant="contained"
        style={{ marginTop: "5px", width: "75%" }}
      >
        Reports
      </Button>

      <Button
        onClick={() => setCurrentPage("calendar")}
        variant="contained"
        style={{ marginTop: "5px", width: "75%" }}
      >
        Open Calendar
      </Button>
      <div style={{display: "flex",gap: "10px"}}>
        {!isGoogleLoggedIn ?
            <Button
              onClick={loginGoogle}
              style={{border: "2px solid black",marginTop: "10px",height: "50%"}}>
              <p style={{color: "black"}}>Login</p> <FcGoogle />
            </Button>
              :
            <Button
              onClick={logoutGoogle}
              style={{border: "2px solid black",marginTop: "10px",height: "50%"}}>
              <p style={{color: "black"}}>Logout</p> <FcGoogle />
            </Button>
        }

        <Button
          onClick={logoutUser}
          variant="outlined"
          color="error"
          style={{ marginTop: "10px",height: "50%" }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

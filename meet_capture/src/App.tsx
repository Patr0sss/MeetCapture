import { useEffect, useState } from "react";
import "./App.css";
import Homepage from "./pages/homepage/homepage";
import LoginPage from "./pages/loginpage/Loginpage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"login" | "home">("login");

  const checkIsRecoring = async () => {
    const isRec = await chrome.storage.local.get("isRecording");
    if (isRec.isRecording) {
      setCurrentPage("home");
    }
  };

  useEffect(() => {
    checkIsRecoring();
    const checkIsLoggedIn = async () => {
      const isLoggedIn = await chrome.storage.local.get("isLoggedIn");
      if (isLoggedIn.isLoggedIn) {
        setCurrentPage("home");
      }
    };
    checkIsLoggedIn();
  }, []);

  const handleLogin = async () => {
    setCurrentPage("home");
    await chrome.storage.local.set({ isLoggedIn: true });
  };

  return (
    <div>
      {currentPage === "login" && <LoginPage onLogin={() => handleLogin()} />}
      {currentPage === "home" && <Homepage />}
    </div>
  );
}

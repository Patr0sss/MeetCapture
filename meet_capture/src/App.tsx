import { useEffect, useState } from "react";
import "./App.css";
import Homepage from "./pages/homepage/homepage";
import LoginPage from "./pages/loginpage/Loginpage";
import Registerpage from "./pages/registerpage/Registerpage";
import ReportPage from "./pages/reportPage/reportpage";

export type Page = "register" | "login" | "home" | "reports";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const checkIsRecoring = async () => {
    const isRec = await chrome.storage.local.get("isRecording");
    if (isRec.isRecording) {
      setCurrentPage("home");
    }
  };

  useEffect(() => {
    checkIsRecoring();
    const checkIsLoggedIn = async () => {
      if (localStorage.getItem("access_token")) {
        setIsLoggedIn(true);
        setCurrentPage("home");
        console.log(isLoggedIn);
      }
    };
    checkIsLoggedIn();
  }, []);

  return (
    <div>
      {currentPage === "login" && (
        <LoginPage
          setCurrentPage={setCurrentPage}
          setIsLoggedIn={setIsLoggedIn}
        />
      )}
      {currentPage === "home" && (
        <Homepage
          setCurrentPage={setCurrentPage}
          setIsLoggedIn={setIsLoggedIn}
        />
      )}
      {currentPage === "register" && (
        <Registerpage setCurrentPage={setCurrentPage} />
      )}
      {currentPage === "reports" && (
        <ReportPage setCurrentPage={setCurrentPage} />
      )}
    </div>
  );
}

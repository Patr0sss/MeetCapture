import { useState } from "react";
import "./App.css";
import Homepage from "./pages/homepage/homepage";
import LoginPage from "./pages/loginpage/Loginpage";

export default function App() {
  const [currentPage, setCurrentPage] = useState<"login" | "home">("login");

  return (
    <div>
      {currentPage === "login" && (
        <LoginPage onLogin={() => setCurrentPage("home")} />
      )}
      {currentPage === "home" && <Homepage />}
    </div>
  );
}

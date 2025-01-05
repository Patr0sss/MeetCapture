import "../../App.css";
import axios from "axios";
import { Dispatch, SetStateAction, useState } from "react";
import { Page } from "../../App";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function Loginpage({
  setCurrentPage,
}: {
  setCurrentPage: Dispatch<SetStateAction<Page>>;
}) {
  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const validateEmail = (): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(user.email);
  };

  const isEmailValid = validateEmail();
  const registerUser = async () => {
    if (!isEmailValid || user.password.length < 6) {
      setError("Invalid email or password");
      return;
    }

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/register",
        {
          email: user.email,
          password: user.password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      if (res.status === 201) {
        setError("");
        setCurrentPage("login");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="mainMenu">
      {error ? <h2 className="errorMessage">{error}</h2> : <h2>Welcome</h2>}

      <TextField
        label="Email"
        variant="outlined"
        onChange={(e) =>
          setUser((prev) => ({ ...prev, email: e.target.value }))
        }
      />

      <TextField
        label="Password"
        variant="outlined"
        type="password"
        onChange={(e) =>
          setUser((prev) => ({ ...prev, password: e.target.value }))
        }
      />

      <Button onClick={registerUser} variant="contained">
        Register
      </Button>

      <p onClick={() => setCurrentPage("login")} style={{ cursor: "pointer" }}>
        Login
      </p>
    </div>
  );
}

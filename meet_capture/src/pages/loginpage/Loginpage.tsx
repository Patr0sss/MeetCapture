import "../../App.css";
import axios from "axios";
import { Page } from "../../App";
import { Dispatch, SetStateAction, useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

export default function Loginpage({
  setIsLoggedIn,
  setCurrentPage,
}: {
  setIsLoggedIn: Dispatch<SetStateAction<boolean>>;
  setCurrentPage: Dispatch<SetStateAction<Page>>;
}) {
  const [user, setUser] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const loginUser = async () => {
    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/login",
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

      if (res.status === 200) {
        setIsLoggedIn(true);
        setCurrentPage("home");
        localStorage.setItem("access_token", res.data.tokens.access);
        return;
      }
      // setError("Invalid email or password");
    } catch (err) {
      console.log(err);
      setIsLoggedIn(false);
      setError("Invalid email or password");
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

      <Button onClick={loginUser} variant="contained">
        Login
      </Button>

      <p
        onClick={() => setCurrentPage("register")}
        style={{ cursor: "pointer" }}
      >
        Register
      </p>
    </div>
  );
}

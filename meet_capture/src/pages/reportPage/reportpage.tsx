import { Dispatch, SetStateAction, useState } from "react";
import Button from "@mui/material/Button";
import "../../App.css";
import { Page } from "../../App";

export default function ReportPage({
  setCurrentPage,
}: {
  setCurrentPage: Dispatch<SetStateAction<Page>>;
}) {
  const [reportsMessage, setReportsMessage] = useState<string>("");
  return (
    <div className="mainMenu">
      <h2>Reports</h2>
      <div>
        {reportsMessage}
        <Button
          onClick={() =>
            setReportsMessage("You have no reports available at this time.")
          }
          variant="contained"
          style={{ marginTop: "20px" }}
        >
          Fetch Reports
        </Button>

        <p
          onClick={() => setCurrentPage("home")}
          style={{ marginTop: "20px", cursor: "pointer" }}
        >
          Homepage
        </p>
      </div>
    </div>
  );
}

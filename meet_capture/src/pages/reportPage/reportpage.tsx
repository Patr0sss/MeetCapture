import { Dispatch, SetStateAction, useEffect, useState } from "react";
import Button from "@mui/material/Button";
import "../../App.css";
import { Page } from "../../App";

export default function ReportPage({
  setCurrentPage,
}: {
  setCurrentPage: Dispatch<SetStateAction<Page>>;
}) {
  const [reportsMessage, setReportsMessage] = useState<string>("");
  const [reports, setReports] = useState<string[]>([]);

  useEffect(() => { 
    const fetchReports = async () => {
      const response = await fetch("http://127.0.0.1:5000/list-reports");
      const data = await response.json();
      if (data.reports) {
        setReports(data.reports);
      } else {
        setReportsMessage("No reports available.");
      }
    }
    fetchReports();
  }, []);

  const downloadReport = async (reportName: string) => {
    try {
        const response = await fetch(`http://127.0.0.1:5000/download-report/${reportName}`);
        if (!response.ok) throw new Error('Failed to fetch the report');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = reportName;  
        console.log("PDF NAME: ", reportName);
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading the report:', error);
    }
};



  return (
    <div className="mainMenu">
      <h2>Reports</h2>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexDirection: "column", minHeight: "100vh" }}>
      {reportsMessage}
      {reports.length > 0 ? (
        <ul style={{ overflow: "auto", marginTop: "20px", padding: 0, width: "80%" }}>
          {reports.map((report) => (
            <li
              key={report}
              style={{
                listStyle: "none",
                display: "grid", 
                gridTemplateColumns: "1fr auto", 
                gap: "10px", 
                alignItems: "center", 
                marginBottom: "10px",
              }}
            >
              <div>{report}</div> 
              <Button
                onClick={() => downloadReport(report)}
                variant="contained"
                style={{
                  maxWidth: "100%", 
                  width: "100%", 
                  height: "40px", 
                  fontSize: "14px", 
                  whiteSpace: "nowrap", 
                }}
              >
                Download
              </Button> 
            </li>
          ))}
        </ul>
        ) : null}

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

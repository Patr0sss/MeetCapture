import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Page } from "../../App";
import { IoMdArrowForward } from "react-icons/io";

export default function CalendarPage({
  setCurrentPage,
}: {
  setCurrentPage: Dispatch<SetStateAction<Page>>;
}) {
  const [events, setEvents] = useState<any[]>([]);
  const [eventTitle, setEventTitle] = useState<string>("");
  const [eventDescription, setEventDescription] = useState<string>("");
  const [eventStartTime, setEventStartTime] = useState<string>("");
  const [eventEndTime, setEventEndTime] = useState<string>("");
  const [inviteEmails, setInviteEmails] = useState<string>("");
  const [selectedEventId,setSelectedEventId] = useState<string | null>(null);

  // Fetch events from Google Calendar
  useEffect(() => {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError) {
        console.error("Error getting token:", chrome.runtime.lastError);
        return;
      }

      fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          console.log("Google Calendar Events:", data);
          setEvents(data.items || []);
        })
        .catch((error) => console.error("Error fetching calendar events:", error));
    });
  }, []);

  const createEvent = () => {
    if (!eventTitle || !eventStartTime || !eventEndTime) {
      alert("Please fill out all required fields.");
      return;
    }

    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError) {
        console.error("Error getting token:", chrome.runtime.lastError);
        return;
      }

      const eventData = {
        summary: eventTitle,
        description: eventDescription,
        start: {
          dateTime: new Date(eventStartTime).toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: new Date(eventEndTime).toISOString(),
          timeZone: "UTC",
        },
        attendees: inviteEmails
          .split(",")
          .map((email) => ({ email: email.trim() }))
          .filter((attendee) => attendee.email),
        sendNotifications: true,
      };

      fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Error creating event: ${response.statusText}`);
          }
          return response.json();
        })
        .then((data) => {
          console.log("Event created:", data);
          setEvents((prevEvents) => [...prevEvents, data]);
          setEventDescription("");
          setEventEndTime("");
          setEventStartTime("");
          setEventTitle("");
          setInviteEmails("");
        })
        .catch((error) => console.error("Error creating event:", error));
    });
  };

  
  const handleSelectEvent = (eventId: string, creatorEmail: string) => {
    setSelectedEventId(eventId)  
    chrome.storage.local.set({ selectedEventId: eventId, creatorEmail: creatorEmail }, () => {
      console.log("Event selected and stored:", { eventId, creatorEmail });
    });
  };
  

  // Navigate back to home
  const comebackHome = () => {
    setCurrentPage("home");
  };

  return (
    <div style={{ padding: "10px", width: "500px", borderRadius: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h4
          style={{
            color: "black",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          Calendar
        </h4>
        <h2 onClick={comebackHome} style={{ cursor: "pointer" }}>
          <IoMdArrowForward />
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
        <div style={{ backgroundColor: "#7c4dff", borderRadius: "4px", height: "300px" }}>
          <h5>Create New Event</h5>
          <input
            type="text"
            placeholder="Event Title"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            style={{ width: "80%", marginBottom: "8px" }}
          />
          <textarea
            placeholder="Event Description"
            value={eventDescription}
            onChange={(e) => setEventDescription(e.target.value)}
            style={{ width: "80%", marginBottom: "8px" }}
          />
          <input
            type="datetime-local"
            value={eventStartTime}
            onChange={(e) => setEventStartTime(e.target.value)}
            style={{ width: "80%", marginBottom: "8px" }}
          />
          <input
            type="datetime-local"
            value={eventEndTime}
            onChange={(e) => setEventEndTime(e.target.value)}
            style={{ width: "80%", marginBottom: "8px" }}
          />
          <input
            type="text"
            placeholder="Invite Emails (comma separated)"
            value={inviteEmails}
            onChange={(e) => setInviteEmails(e.target.value)}
            style={{ width: "80%", marginBottom: "8px" }}
          />
          <button
            onClick={createEvent}
            style={{
              padding: "10px",
              width: "80%",
              backgroundColor: "#6200ea",
              color: "white",
              borderRadius: "3px",
            }}
          >
            Create Event
          </button>
        </div>

        <div
          style={{
            borderColor: "#545555",
            borderStyle: "solid",
            borderRadius: "4px",
            borderWidth: "1px",
            height: "300px",
            justifyContent: "center",
            overflowY: "scroll",
          }}
        >
          <h5>Upcoming Events</h5>
          <ul
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              margin: 0,
              padding: 0,
            }}
          >
            {events.map((event, index) => (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: "16px",
                  backgroundColor: selectedEventId === event.id ? "#ffcc00" : "#2de1b1", 
                  marginTop: "4px",
                  marginBottom: "4px",
                  width: "80%",
                  alignItems: "center",
                  cursor: "pointer",
                }}
                key={index}
                onClick={() => handleSelectEvent(event.id, event.creator?.email || "")}
              >
                <p
                  style={{
                    marginRight: "4px",
                    fontWeight: "bold",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                    borderRadius: "1px",
                  }}
                >
                  {event.summary}
                </p>
                <p style={{ marginRight: "4px" }}>
                  {new Date(event.start.dateTime).toLocaleString()}
                </p>
              </div>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

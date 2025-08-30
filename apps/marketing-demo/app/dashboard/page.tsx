"use client";

import { useState } from "react";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  const createUser = async () => {
    try {
      const response = await fetch("/api/marketing/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `user${Date.now()}@example.com`,
          firstName: "John",
        }),
      });

      const userData = await response.json();
      setUser(userData);
      setMessage("User created successfully!");
    } catch (error) {
      setMessage("Error creating user");
      console.error(error);
    }
  };

  const trackEvent = async () => {
    if (!user) {
      setMessage("Please create a user first");
      return;
    }

    try {
      const response = await fetch("/api/marketing/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          eventName: "button_clicked",
          properties: {
            button: "track_event",
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const eventData = await response.json();
      setEvents((prev) => [eventData, ...prev]);
      setMessage("Event tracked successfully!");
    } catch (error) {
      setMessage("Error tracking event");
      console.error(error);
    }
  };

  const sendEmail = async () => {
    if (!user) {
      setMessage("Please create a user first");
      return;
    }

    try {
      const response = await fetch("/api/marketing/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: user.email,
          from: "demo@bettermarketing.dev",
          subject: "Welcome to Better Marketing!",
          html: "<h1>Welcome!</h1><p>Thank you for trying Better Marketing.</p>",
          text: "Welcome! Thank you for trying Better Marketing.",
        }),
      });

      const result = await response.json();
      setMessage(`Email sent successfully! Message ID: ${result.messageId}`);
    } catch (error) {
      setMessage("Error sending email");
      console.error(error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Marketing Dashboard</h1>

      {message && (
        <div className="p-4 bg-blue-100 border border-blue-400 rounded">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Actions</h2>

          <button
            onClick={createUser}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create Test User
          </button>

          <button
            onClick={trackEvent}
            disabled={!user}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Track Event
          </button>

          <button
            onClick={sendEmail}
            disabled={!user}
            className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send Email
          </button>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Current User</h2>
          {user ? (
            <div className="p-4 bg-gray-100 rounded">
              <p>
                <strong>ID:</strong> {user.id}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Name:</strong> {user.firstName} {user.lastName}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>
          ) : (
            <p className="text-gray-500">No user created yet</p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Events</h2>
        {events.length > 0 ? (
          <div className="space-y-2">
            {events.map((event, index) => (
              <div key={index} className="p-4 bg-gray-100 rounded">
                <p>
                  <strong>Event:</strong> {event.eventName}
                </p>
                <p>
                  <strong>User:</strong> {event.userId}
                </p>
                <p>
                  <strong>Properties:</strong>{" "}
                  {JSON.stringify(event.properties)}
                </p>
                <p>
                  <strong>Timestamp:</strong>{" "}
                  {new Date(event.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No events tracked yet</p>
        )}
      </div>
    </div>
  );
}

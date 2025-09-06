"use client";

import { useState } from "react";
import { clientMk } from "../../lib/marketing-client";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">(
    "success"
  );

  const createCampaign = async () => {
    try {
      // const client = clientMk.user.create({
      //   lastName: "Doe",
      //   firstName: "John",
      //   email: "john.jusdds@example.com",
      //   phone: "08042219698",
      // });

      // const client = await clientMk.notification.create({
      //   userId: "ZUyWpp89hQLdOjQO", // Replace with actual user ID
      //   title: "New Campaign Created",
      //   message: "A new marketing campaign has been created.",
      //   type: "info",
      // });

      // Now using the intuitive client syntax - no more [":id"] brackets!

      // Option 1: Get a specific notification by ID
      const notificationId = "ur3g1lfT0qHd14Le";
      const notificationResult = await clientMk.notification.get({
        id: notificationId, // Route parameter
      });

      const userId = "ZUyWpp89hQLdOjQO";
      // Option 2: Get all notifications for a user
      const userNotifications = await clientMk.notification.user({
        userId: userId,
      });

      // Option 3: Get user notifications with query parameters
      // const filteredNotifications = await clientMk.notification.user({
      //   params: { userId: notificationId },
      //   query: { unreadOnly: true, limit: 10 }
      // });

      console.log("Notification result:", notificationResult);
      setUser(notificationResult);
      // });

      // Reusing `user` state to display campaign info for now
      // setUser(client);
      // console.log("Created user:", client);
      setMessage("Campaign created successfully!");
      setMessageType("success");
    } catch (error) {
      setMessage("Error creating campaign");
      setMessageType("error");
      console.error(error);
    }
  };

  // const trackEvent = async () => {
  //   if (!user) {
  //     setMessage("Please create a user first");
  //     setMessageType("error");
  //     return;
  //   }

  //   try {
  //     const eventData = await clientMk.api.track({
  //       userId: user.id,
  //       event: "button_clicked",
  //       properties: {
  //         button: "track_event",
  //         timestamp: new Date().toISOString(),
  //       },
  //     });

  //     setEvents((prev) => [eventData, ...prev]);
  //     setMessage("Event tracked successfully!");
  //     setMessageType("success");
  //   } catch (error) {
  //     setMessage("Error tracking event");
  //     setMessageType("error");
  //     console.error(error);
  //   }
  // };

  // const sendEmail = async () => {
  //   if (!user) {
  //     setMessage("Please create a user first");
  //     setMessageType("error");
  //     return;
  //   }

  //   try {
  //     const result = await clientMk.api.email.send({
  //       to: user.email,
  //       from: "demo@betterframework.dev",
  //       subject: "Welcome to Better Framework!",
  //       content:
  //         "<h1>Welcome!</h1><p>Thank you for trying Better Framework.</p>",
  //     });

  //     setMessage(
  //       `Email sent successfully! Message ID: ${result.messageId || "N/A"}`
  //     );
  //     setMessageType("success");
  //   } catch (error) {
  //     setMessage("Error sending email");
  //     setMessageType("error");
  //     console.error(error);
  //   }
  // };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Framework Dashboard</h1>

      {message && (
        <div
          className={`p-4 rounded ${messageType === "success" ? "bg-green-100 border border-green-400 text-green-700" : "bg-red-100 border border-red-400 text-red-700"}`}
        >
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Actions</h2>

          <button
            onClick={createCampaign}
            className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Create Test Campaign
          </button>
          {/* <button
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
          </button> */}
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
                  <strong>Event:</strong> {event.eventName || event.event}
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

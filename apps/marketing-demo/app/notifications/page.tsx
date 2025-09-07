"use client";

import { useState } from "react";
import { clientMk } from "../../lib/marketing-client";

export default function NotificationsDemo() {
  const [log, setLog] = useState<string[]>([]);

  const run = async () => {
    const entries: string[] = [];
    const push = (m: string) => entries.push(m);
    try {
      const user = await clientMk.user.create({
        email: `notif+${Math.random().toString(36).slice(2, 6)}@example.com`,
        firstName: "Notif",
        fetchOptions: { throw: true },
      });
      const userId = user.user.id;
      push(`Created user: ${userId}`);

      const created = await clientMk.notification.create({
        userId,
        title: "Hello",
        message: "From Notifications Demo",
        fetchOptions: { throw: true },
      });
      push(`Created notification for ${userId}`);

        const listed = await clientMk.notification.user({
          userId,
          query: { unreadOnly: true, limit: 10 },
          fetchOptions: { throw: true },
        });
        push(
          `Listed notifications: ${JSON.stringify(listed.notifications || listed)}`
        );
    } catch (e: any) {
      push(`Error: ${e?.message || String(e)}`);
    }
    setLog(entries);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Notifications Demo</h1>
      <button
        onClick={run}
        className="bg-purple-600 text-white px-3 py-2 rounded"
      >
        Run flow
      </button>
      <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap">
        {log.join("\n")}
      </pre>
    </div>
  );
}

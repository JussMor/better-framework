"use client";

import { useState } from "react";
import { clientMk } from "../../lib/marketing-client";

export default function UsersDemo() {
  const [log, setLog] = useState<string[]>([]);

  const run = async () => {
    const entries: string[] = [];
    const push = (m: string) => entries.push(m);
    try {
      const created = await clientMk.user.create({
        email: `demo+${Math.random().toString(36).slice(2, 6)}@example.com`,
        firstName: "Demo",
        fetchOptions: { throw: true },
      });
      push(`Created: ${created.user.id}`);
      console.log("Created user:", created);

      const found = await clientMk.user.get({
        id: created.user.id,
        fetchOptions: { throw: true },
      });
      push(`Found: ${found.user.email}`);

      const updated = await clientMk.user.update({
        id: found.user.id,
        lastName: "User",
        fetchOptions: { throw: true },
      });
      push(`Updated: ${updated.user.lastName}`);

      await clientMk.user.delete({
        id: updated.user.id,
        fetchOptions: { throw: true },
      });
      push("Deleted user");
    } catch (e: any) {
      push(`Error: ${e?.message || String(e)}`);
    }
    setLog(entries);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Users Demo</h1>
      <button
        onClick={run}
        className="bg-blue-600 text-white px-3 py-2 rounded"
      >
        Run flow
      </button>
      <pre className="bg-gray-100 p-3 rounded whitespace-pre-wrap">
        {log.join("\n")}
      </pre>
    </div>
  );
}

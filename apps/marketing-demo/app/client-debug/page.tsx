"use client";

import { useState } from "react";
import { inspectClients } from "../../lib/client-debug";

export default function ClientDebugPage() {
  const [output, setOutput] = useState<string>("");

  const runInspection = () => {
    // Capture console output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    try {
      inspectClients();
    } catch (error) {
      logs.push(`Error: ${error}`);
    }

    console.log = originalLog;
    setOutput(logs.join("\n"));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Client Debug Page</h1>

      <button
        onClick={runInspection}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Run Client Inspection
      </button>

      {output && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Inspection Results:</h2>
          <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}

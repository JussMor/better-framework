"use client";

import { useState } from "react";
import { runTests } from "../../lib/test-server-endpoints";
import { useCustomEndpoints } from "../../lib/use-custom-client";

export default function TestCustomPlugin() {
  const [results, setResults] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const testServer = async () => {
    setLoading(true);
    setResults("Testing server endpoints...\n");

    // Capture console.log output
    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    try {
      await runTests();
    } catch (error) {
      logs.push(`Error: ${error}`);
    }

    console.log = originalLog;
    setResults(logs.join("\n"));
    setLoading(false);
  };

  const testClient = async () => {
    setLoading(true);
    setResults("Testing client endpoints...\n");

    const originalLog = console.log;
    const logs: string[] = [];
    console.log = (...args) => {
      logs.push(args.join(" "));
      originalLog(...args);
    };

    try {
      await useCustomEndpoints();
    } catch (error) {
      logs.push(`Client Error: ${error}`);
    }

    console.log = originalLog;
    setResults(logs.join("\n"));
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Custom Plugin Test Page</h1>

      <div className="space-y-4 mb-6">
        <button
          onClick={testServer}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Testing..." : "Test Server Endpoints (Direct Fetch)"}
        </button>

        <button
          onClick={testClient}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 ml-2"
        >
          {loading ? "Testing..." : "Test Client Endpoints (Framework Client)"}
        </button>
      </div>

      {results && (
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Test Results:</h2>
          <pre className="text-sm whitespace-pre-wrap overflow-auto max-h-96">
            {results}
          </pre>
        </div>
      )}

      <div className="mt-6 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Expected Endpoints:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>GET /api/framework/custom/status</li>
          <li>POST /api/framework/custom/data</li>
          <li>GET /api/framework/custom/data/list</li>
        </ul>

        <h3 className="font-semibold mb-2 mt-4">Expected Client Methods:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>clientMk.custom.status()</li>
          <li>clientMk.custom.data()</li>
          <li>clientMk.custom.data.list()</li>
        </ul>
      </div>
    </div>
  );
}

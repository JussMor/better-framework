/**
 * Example of how to test your custom plugin endpoints
 *
 * After adding your plugin to the marketing framework, these endpoints will be available:
 */

// Test your custom endpoints with these examples:

// 1. GET /api/framework/custom/status
// Returns: { status: "ok", message: "Custom plugin is working!", timestamp: "...", version: "1.0.0" }

// 2. POST /api/framework/custom/data
// Body: {
//   "name": "My Custom Item",
//   "type": "example",
//   "data": { "key": "value", "number": 42 },
//   "tags": ["test", "example"]
// }
// Returns: { success: true, data: {...}, message: "Custom data created successfully" }

// 3. GET /api/framework/custom/data/list?page=1&limit=5&type=example
// Returns: { data: [...], pagination: { page: 1, limit: 5, total: 5, totalPages: 1 } }

// Example usage with fetch:
export async function testCustomEndpoints() {
  const baseUrl = "http://localhost:3001/api/framework";

  try {
    // Test status endpoint
    console.log("Testing status endpoint...");
    const statusResponse = await fetch(`${baseUrl}/custom/status`);
    const statusData = await statusResponse.json();
    console.log("Status:", statusData);

    // Test create data endpoint
    console.log("Testing create data endpoint...");
    const createResponse = await fetch(`${baseUrl}/custom/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Item",
        type: "example",
        data: { description: "This is a test", priority: "high" },
        tags: ["test", "demo"],
      }),
    });
    const createData = await createResponse.json();
    console.log("Create:", createData);

    // Test list data endpoint
    console.log("Testing list data endpoint...");
    const listResponse = await fetch(
      `${baseUrl}/custom/data/list?page=1&limit=3`
    );
    const listData = await listResponse.json();
    console.log("List:", listData);
  } catch (error) {
    console.error("Error testing endpoints:", error);
  }
}

// To use these endpoints in your Next.js app, you can call them from:
// - Client components (use fetch or axios)
// - Server components (use fetch with full URL)
// - API routes (use marketing.api.custom.status(), etc.)

// Example in a React component:
/*
"use client";
import { useState } from "react";

export function CustomPluginDemo() {
  const [status, setStatus] = useState(null);
  
  const checkStatus = async () => {
    const response = await fetch("/api/framework/custom/status");
    const data = await response.json();
    setStatus(data);
  };
  
  return (
    <div>
      <button onClick={checkStatus}>Check Plugin Status</button>
      {status && <pre>{JSON.stringify(status, null, 2)}</pre>}
    </div>
  );
}
*/

/**
 * Test the server endpoints directly without the client
 * This will help us verify that the server plugin is working correctly
 */

// Test the endpoints directly with fetch
export async function testServerEndpoints() {
  const baseUrl = "http://localhost:3001/api/framework";

  console.log("🧪 Testing server endpoints directly...");

  try {
    // Test status endpoint
    console.log("1. Testing GET /custom/status");
    const statusResponse = await fetch(`${baseUrl}/custom/status`);
    console.log("Status Response:", statusResponse.status);

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log("✅ Status data:", statusData);
    } else {
      console.log("❌ Status failed:", await statusResponse.text());
    }

    // Test create data endpoint
    console.log("2. Testing POST /custom/data");
    const createResponse = await fetch(`${baseUrl}/custom/data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Item",
        type: "test",
        data: { hello: "world" },
        tags: ["test"],
      }),
    });
    console.log("Create Response:", createResponse.status);

    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log("✅ Create data:", createData);
    } else {
      console.log("❌ Create failed:", await createResponse.text());
    }

    // Test list endpoint
    console.log("3. Testing GET /custom/data/list");
    const listResponse = await fetch(
      `${baseUrl}/custom/data/list?page=1&limit=3`
    );
    console.log("List Response:", listResponse.status);

    if (listResponse.ok) {
      const listData = await listResponse.json();
      console.log("✅ List data:", listData);
    } else {
      console.log("❌ List failed:", await listResponse.text());
    }
  } catch (error) {
    console.error("🚨 Error testing endpoints:", error);
  }
}

// Test if the plugin was added correctly
export async function checkPluginStatus() {
  try {
    const response = await fetch("http://localhost:3001/api/admin/plugins");
    if (response.ok) {
      const data = await response.json();
      console.log("📋 Plugin status:", data);
      return data;
    }
  } catch (error) {
    console.log(
      "Could not check plugin status (admin endpoint may not exist):",
      error
    );
  }
}

// Run all tests
export async function runTests() {
  await checkPluginStatus();
  await testServerEndpoints();
}

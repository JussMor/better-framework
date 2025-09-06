/**
 * Direct test of the client typing issue
 * This file will help us identify exactly what's wrong
 */

import {
  campaignsClientPlugin,
  createFrameworkClient,
} from "better-framework/client";
import { myCustomClientPlugin } from "./custom-plugin";

// Test 1: Create client with just campaigns plugin
const clientWithJustCampaigns = createFrameworkClient({
  plugins: [campaignsClientPlugin()],
});

// Test 2: Create client with just custom plugin
const clientWithJustCustom = createFrameworkClient({
  plugins: [myCustomClientPlugin()],
});

// Test 3: Create client with both plugins
const clientWithBoth = createFrameworkClient({
  plugins: [campaignsClientPlugin(), myCustomClientPlugin()],
});

// Test 4: Let's inspect what properties exist
export function inspectClients() {
  console.log("🔍 Client Inspection:");

  console.log("1. Client with just campaigns:");
  console.log(
    "   - Keys:",
    Object.getOwnPropertyNames(clientWithJustCampaigns)
  );
  console.log(
    "   - Has campaign property:",
    "campaign" in clientWithJustCampaigns
  );

  console.log("2. Client with just custom:");
  console.log("   - Keys:", Object.getOwnPropertyNames(clientWithJustCustom));
  console.log("   - Has custom property:", "custom" in clientWithJustCustom);

  console.log("3. Client with both:");
  console.log("   - Keys:", Object.getOwnPropertyNames(clientWithBoth));
  console.log("   - Has campaign property:", "campaign" in clientWithBoth);
  console.log("   - Has custom property:", "custom" in clientWithBoth);

  // Let's try to access the properties
  try {
    console.log(
      "4. Campaigns create exists:",
      typeof clientWithJustCampaigns.campaign?.create
    );
  } catch (e) {
    console.log("4. Campaigns create access failed:", e);
  }

  try {
    // @ts-expect-error - Testing runtime access
    console.log(
      "5. Custom status exists:",
      typeof clientWithJustCustom.custom?.status
    );
  } catch (e) {
    console.log("5. Custom status access failed:", e);
  }
}

// Export clients for testing
export { clientWithBoth, clientWithJustCampaigns, clientWithJustCustom };

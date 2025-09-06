/**
 * Test client to isolate the custom plugin type inference issue
 */

import {
  campaignsClientPlugin,
  createFrameworkClient,
} from "better-framework/client";
import { testClientPlugin } from "./test-plugin";

// Test client with minimal plugin
export const testClient = createFrameworkClient({
  plugins: [campaignsClientPlugin(), testClientPlugin()],
});

// Type tests
export function testClientTypes() {
  // These should work (campaigns plugin)
  // @ts-expect-error - testing if this exists
  testClient.campaign.create({ name: "Test Campaign" });

  // @ts-expect-error - testing if this exists
  testClient.campaign.list();

  // These should work if the test plugin is properly inferred
  // @ts-expect-error - testing if this exists
  testClient.test.hello();

  // @ts-expect-error - testing if this exists
  testClient.test.create({ name: "Test Item" });
}

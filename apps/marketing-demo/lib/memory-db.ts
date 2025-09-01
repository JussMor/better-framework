import { MemoryDB } from "better-marketing/adapters/memory";

// In-memory database for demo purposes. Each key represents a model/table.
// NOTE: Data will reset on every server restart (stateless).
export const memoryDB: MemoryDB = {
  marketingUser: [],
  marketingEvent: [],
  marketingEmail: [],
  campaign: [],
  segment: [],
};

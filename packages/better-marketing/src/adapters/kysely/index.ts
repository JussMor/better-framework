import type { DatabaseAdapter } from "../../types";

export function kyselyAdapter(db: any): DatabaseAdapter {
  return {
    name: "kysely",
    async createUser() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async getUserById() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async getUserByEmail() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async updateUser() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async deleteUser() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async createEvent() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async getEventsByUserId() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async createCampaign() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async getCampaignById() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async updateCampaign() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async deleteCampaign() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async createSegment() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async getSegmentById() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async updateSegment() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async deleteSegment() {
      throw new Error("Kysely adapter not implemented yet");
    },
    async getUsersInSegment() {
      throw new Error("Kysely adapter not implemented yet");
    },
  };
}

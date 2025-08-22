import type { DatabaseAdapter } from "../../types";

export function mongooseAdapter(models: any): DatabaseAdapter {
  return {
    name: "mongoose",
    async createUser() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async getUserById() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async getUserByEmail() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async updateUser() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async deleteUser() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async createEvent() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async getEventsByUserId() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async createCampaign() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async getCampaignById() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async updateCampaign() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async deleteCampaign() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async createSegment() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async getSegmentById() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async updateSegment() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async deleteSegment() {
      throw new Error("Mongoose adapter not implemented yet");
    },
    async getUsersInSegment() {
      throw new Error("Mongoose adapter not implemented yet");
    },
  };
}

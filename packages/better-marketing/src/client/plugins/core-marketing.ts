import { MarketingUser } from "../../types";
import type { MarketingClientPlugin } from "../types";

export const coreMarketingPlugin = (): MarketingClientPlugin => {
  return {
    id: "core-marketing",
    pathMethods: {
      "/user/create": "POST",
      "/user/get": "GET",
      "/user/update": "PUT",
      "/user/delete": "DELETE",
      "/campaign/create": "POST",
      "/campaign/get": "GET",
      "/campaign/update": "PUT",
      "/campaign/delete": "DELETE",
      "/email/send": "POST",
      "/email/send-bulk": "POST",
      "/analytics/track": "POST",
      "/analytics/get": "GET",
    },
    getActions: ($fetch) => ({
      user: {
        create: (data: MarketingUser) =>
          $fetch("/user/create", { method: "POST", body: data }),
        get: async (id: string) => {
          const response = await $fetch(`/user/get/${id}`, {
            method: "GET",
          });
          if ((response as any).error) {
            throw new Error(
              (response as any).error?.message || "User fetch failed"
            );
          }
          const d = (response as any).data;
          return d && d.user ? d.user : d;
        },
        update: async (id: string, data: any) => {
          const response = await $fetch(`/user/update/${id}`, {
            method: "PUT",
            body: data,
          });
          if ((response as any).error) {
            throw new Error(
              (response as any).error?.message || "User update failed"
            );
          }
          const d = (response as any).data;
          return d && d.user ? d.user : d;
        },
        delete: async (id: string) => {
          const response = await $fetch(`/user/delete/${id}`, {
            method: "DELETE",
          });
          if ((response as any).error) {
            throw new Error(
              (response as any).error?.message || "User deletion failed"
            );
          }
          return (response as any).data;
        },
      },
      campaign: {
        create: async (data: any) => {
          const response = await $fetch("/campaign/create", {
            method: "POST",
            body: data,
          });
          if ((response as any).error) {
            throw new Error(
              (response as any).error?.message || "Campaign creation failed"
            );
          }
          return (response as any).data;
        },
        get: async (id: string) => {
          const response = await $fetch(`/campaign/get/${id}`, {
            method: "GET",
          });
          if ((response as any).error) {
            throw new Error(
              (response as any).error?.message || "Campaign fetch failed"
            );
          }
          return (response as any).data;
        },
        update: async (id: string, data: any) => {
          const response = await $fetch(`/campaign/update/${id}`, {
            method: "PUT",
            body: data,
          });
          if ((response as any).error) {
            throw new Error(
              (response as any).error?.message || "Campaign update failed"
            );
          }
          return (response as any).data;
        },
        delete: async (id: string) => {
          const response = await $fetch(`/campaign/delete/${id}`, {
            method: "DELETE",
          });
          if ((response as any).error) {
            throw new Error(
              (response as any).error?.message || "Campaign deletion failed"
            );
          }
          return (response as any).data;
        },
      },
      email: {
        send: async (data: any) => {
          const response = await $fetch("/email/send", {
            method: "POST",
            body: data,
          });
          if ((response as any).error) {
            throw new Error(
              (response as any).error?.message || "Email send failed"
            );
          }
          return (response as any).data;
        },
        sendBulk: async (data: any) => {
          const response = await $fetch("/email/send-bulk", {
            method: "POST",
            body: data,
          });
          if ((response as any).error) {
            throw new Error(
              (response as any).error?.message || "Bulk email send failed"
            );
          }
          return (response as any).data;
        },
      },
      track: async (data: any) => {
        const response = await $fetch("/analytics/track", {
          method: "POST",
          body: data,
        });
        if ((response as any).error) {
          throw new Error(
            (response as any).error?.message || "Event tracking failed"
          );
        }
        return (response as any).data;
      },
      getAnalytics: async (params: any) => {
        const response = await $fetch("/analytics/get", {
          method: "GET",
          query: params,
        });
        if ((response as any).error) {
          throw new Error(
            (response as any).error?.message || "Analytics fetch failed"
          );
        }
        return (response as any).data;
      },
        
    }),
  }
}


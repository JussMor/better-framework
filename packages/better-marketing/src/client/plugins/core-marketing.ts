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
      api: {
        user: {
          create: (data: any) =>
            $fetch("/user/create", { method: "POST", body: data }),
          get: (id: string) => $fetch(`/user/get/${id}`, { method: "GET" }),
          update: (id: string, data: any) =>
            $fetch(`/user/update/${id}`, { method: "PUT", body: data }),
          delete: (id: string) =>
            $fetch(`/user/delete/${id}`, { method: "DELETE" }),
        },
        campaign: {
          create: (data: any) =>
            $fetch("/campaign/create", { method: "POST", body: data }),
          get: (id: string) => $fetch(`/campaign/get/${id}`, { method: "GET" }),
          update: (id: string, data: any) =>
            $fetch(`/campaign/update/${id}`, { method: "PUT", body: data }),
          delete: (id: string) =>
            $fetch(`/campaign/delete/${id}`, { method: "DELETE" }),
        },
        email: {
          send: (data: any) =>
            $fetch("/email/send", { method: "POST", body: data }),
          sendBulk: (data: any) =>
            $fetch("/email/send-bulk", { method: "POST", body: data }),
        },
        track: (data: any) =>
          $fetch("/analytics/track", { method: "POST", body: data }),
        getAnalytics: (params: any) =>
          $fetch("/analytics/get", { method: "GET", query: params }),
      },
    }),
  };
};

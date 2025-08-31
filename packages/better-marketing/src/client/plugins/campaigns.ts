import type { MarketingClientPlugin } from "../types";

export const campaignsPlugin = (): MarketingClientPlugin => {
  return {
    id: "campaigns",
    pathMethods: {
      "/campaign/create": "POST",
      "/campaign/get": "GET",
      "/campaign/update": "PUT",
      "/campaign/delete": "DELETE",
      "/campaign/list": "GET",
    },
    getActions: ($fetch) => ({
      api: {
        campaign: {
          create: async (data: any) => {
            const response = await $fetch("/campaign/create", {
              method: "POST",
              body: data,
            });
            if ((response as any).error) {
              throw new Error(
                (response as any).error?.message || "Campaign create failed"
              );
            }
            const d = (response as any).data;
            return d && d.campaign ? d.campaign : d;
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
            const d = (response as any).data;
            return d && d.campaign ? d.campaign : d;
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
                (response as any).error?.message || "Campaign delete failed"
              );
            }
            return (response as any).data;
          },
          list: async (query?: any) => {
            const response = await $fetch(`/campaign/list`, {
              method: "GET",
              query,
            });
            if ((response as any).error) {
              throw new Error(
                (response as any).error?.message || "Campaign list failed"
              );
            }
            return (response as any).data;
          },
        },
      },
    }),
  };
};

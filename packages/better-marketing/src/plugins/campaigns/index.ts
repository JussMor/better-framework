// Server-side campaigns plugin skeleton
// Export handlers that will be mounted by the core router. Keep minimal for now.

export const routes = {
  "POST /campaign/create": async (ctx: any) => {
    // simple echo create
    const body = ctx.req?.body || ctx.request?.body || ctx.body;
    // pretend we created an id
    const created = { id: String(Date.now()), ...body };
    return { campaign: created };
  },

  "GET /campaign/get/:id": async (ctx: any) => {
    const { id } = ctx.params || ctx;
    // stubbed example
    return { campaign: { id, name: `Campaign ${id}` } };
  },

  "PUT /campaign/update/:id": async (ctx: any) => {
    const { id } = ctx.params || ctx;
    const body = ctx.req?.body || ctx.request?.body || ctx.body;
    return { campaign: { id, ...body } };
  },

  "DELETE /campaign/delete/:id": async (ctx: any) => {
    const { id } = ctx.params || ctx;
    return { success: true, id };
  },

  "GET /campaign/list": async (ctx: any) => {
    // return an empty list placeholder
    return { campaigns: [] };
  },
};

export default {
  id: "campaigns",
  routes,
};

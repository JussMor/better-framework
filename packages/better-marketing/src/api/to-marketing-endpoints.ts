import {
  APIError,
  toResponse,
  type EndpointContext,
  type EndpointOptions,
  type InputContext,
} from "better-call";
import { createDefu } from "defu";
import type { HookEndpointContext, MarketingContext } from "../types";
import { ShouldPublishLog } from "../utils/logger";
import type { MarketingEndpoint, MarketingMiddleware } from "./call";

// Internal context used while executing an endpoint + hooks
type InternalContext = InputContext<string, any> &
  EndpointContext<string, any> & {
    asResponse?: boolean;
    context: MarketingContext & {
      logger: MarketingContext["logger"];
      returned?: unknown;
      responseHeaders?: Headers;
    };
  };

const defuReplaceArrays = createDefu((obj, key, value) => {
  if (Array.isArray(obj[key]) && Array.isArray(value)) {
    obj[key] = value;
    return true;
  }
});

export function toMarketingEndpoints<
  E extends Record<string, MarketingEndpoint>,
>(endpoints: E, ctx: MarketingContext | Promise<MarketingContext>) {
  const api: Record<
    string,
    ((
      context: EndpointContext<string, any> & InputContext<string, any>
    ) => Promise<any>) & {
      path?: string;
      options?: EndpointOptions;
    }
  > = {};

  for (const [key, endpoint] of Object.entries(endpoints)) {
    api[key] = async (context) => {
      const marketingContext = await ctx;
      let internalContext: InternalContext = {
        ...context,
        context: {
          ...marketingContext,
          returned: undefined,
          responseHeaders: undefined,
        },
        path: endpoint.path,
        headers: context?.headers ? new Headers(context?.headers) : undefined,
      };

      const { beforeHooks, afterHooks } = getHooks(marketingContext);
      const before = await runBeforeHooks(internalContext, beforeHooks);
      if (
        "context" in before &&
        before.context &&
        typeof before.context === "object"
      ) {
        const { headers, ...rest } = before.context as { headers: Headers };
        if (headers) {
          headers.forEach((value, key) => {
            (internalContext.headers as Headers).set(key, value);
          });
        }
        internalContext = defuReplaceArrays(rest, internalContext);
      } else if (before) {
        return before;
      }

      internalContext.asResponse = false;
      internalContext.returnHeaders = true;
      const result = (await endpoint(internalContext as any).catch((e: any) => {
        if (e instanceof APIError) {
          return {
            response: e,
            headers: e.headers ? new Headers(e.headers) : null,
          };
        }
        throw e;
      })) as { headers: Headers; response: any };

      if (result instanceof Response) return result;

      internalContext.context.returned = result.response;
      internalContext.context.responseHeaders = result.headers;

      const after = await runAfterHooks(internalContext, afterHooks);
      if (after.response) result.response = after.response;

      if (
        result.response instanceof APIError &&
        ShouldPublishLog(marketingContext.logger.level, "debug")
      ) {
        const respAny: any = result.response;
        result.response.stack =
          respAny.errorStack || respAny.errorWithStack?.stack;
      }

      if (result.response instanceof APIError && !context?.asResponse) {
        throw result.response;
      }

      return context?.asResponse
        ? toResponse(result.response, { headers: result.headers })
        : context?.returnHeaders
          ? { headers: result.headers, response: result.response }
          : result.response;
    };
    api[key].path = endpoint.path;
    api[key].options = endpoint.options;
  }

  return api as E;
}

async function runBeforeHooks(
  context: InternalContext,
  hooks: {
    matcher: (context: HookEndpointContext) => boolean;
    handler: MarketingMiddleware;
  }[]
) {
  let modifiedContext: { headers?: Headers } = {};
  for (const hook of hooks) {
    if (!hook.matcher(context)) continue;
    const result = await hook
      .handler({ ...context, returnHeaders: false })
      .catch((e: unknown) => {
        if (e instanceof APIError) throw e;
        throw e;
      });
    if (result && typeof result === "object") {
      if ("context" in result && typeof result.context === "object") {
        const { headers, ...rest } = result.context as { headers: Headers };
        if (headers instanceof Headers) {
          if (!modifiedContext.headers) modifiedContext.headers = new Headers();
          headers.forEach((value, key) =>
            modifiedContext.headers!.set(key, value)
          );
        }
        modifiedContext = defuReplaceArrays(rest, modifiedContext);
        continue;
      }
      return result;
    }
  }
  return { context: modifiedContext };
}

async function runAfterHooks(
  context: InternalContext,
  hooks: {
    matcher: (context: HookEndpointContext) => boolean;
    handler: MarketingMiddleware;
  }[]
) {
  for (const hook of hooks) {
    if (!hook.matcher(context)) continue;
    const result = (await hook.handler(context).catch((e) => {
      if (e instanceof APIError) {
        return {
          response: e,
          headers: e.headers ? new Headers(e.headers) : null,
        };
      }
      throw e;
    })) as { response: any; headers: Headers };
    if (result.headers) {
      result.headers.forEach((value, key) => {
        if (!context.context.responseHeaders) {
          context.context.responseHeaders = new Headers({ [key]: value });
        } else if (key.toLowerCase() === "set-cookie") {
          context.context.responseHeaders.append(key, value);
        } else {
          context.context.responseHeaders.set(key, value);
        }
      });
    }
    if (result.response) context.context.returned = result.response;
  }
  return {
    response: context.context.returned,
    headers: context.context.responseHeaders,
  };
}

function getHooks(marketingContext: MarketingContext) {
  const plugins = marketingContext.options.plugins || [];
  const beforeHooks: {
    matcher: (context: HookEndpointContext) => boolean;
    handler: MarketingMiddleware;
  }[] = [];
  const afterHooks: {
    matcher: (context: HookEndpointContext) => boolean;
    handler: MarketingMiddleware;
  }[] = [];
  if (marketingContext.options.hooks?.before) {
    beforeHooks.push({
      matcher: () => true,
      handler: marketingContext.options.hooks.before,
    });
  }
  if (marketingContext.options.hooks?.after) {
    afterHooks.push({
      matcher: () => true,
      handler: marketingContext.options.hooks.after,
    });
  }
  const pluginBeforeHooks = ([] as any[]).concat(
    ...plugins.map((p: any) => p.hooks?.before || [])
  );
  const pluginAfterHooks = ([] as any[]).concat(
    ...plugins.map((p: any) => p.hooks?.after || [])
  );
  if (pluginBeforeHooks.length) beforeHooks.push(...pluginBeforeHooks);
  if (pluginAfterHooks.length) afterHooks.push(...pluginAfterHooks);
  return { beforeHooks, afterHooks };
}

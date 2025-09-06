import {
  APIError,
  toResponse,
  type EndpointContext,
  type EndpointOptions,
  type InputContext,
} from "better-call";
import { createDefu } from "defu";
import type { HookEndpointContext, FrameworkContext } from "../types";
import { ShouldPublishLog } from "../utils/logger";
import type { FrameworkEndpoint, FrameworkMiddleware } from "./call";

// Internal context used while executing an endpoint + hooks
type InternalContext = InputContext<string, any> &
  EndpointContext<string, any> & {
    asResponse?: boolean;
    context: FrameworkContext & {
      logger: FrameworkContext["logger"];
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

export function toFrameworkEndpoints<
  E extends Record<string, FrameworkEndpoint>,
>(endpoints: E, ctx: FrameworkContext | Promise<FrameworkContext>) {
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
      const frameworkContext = await ctx;
      let internalContext: InternalContext = {
        ...context,
        context: {
          ...frameworkContext,
          returned: undefined,
          responseHeaders: undefined,
        },
        path: endpoint.path,
        headers: context?.headers ? new Headers(context?.headers) : undefined,
      };

      const { beforeHooks, afterHooks } = getHooks(frameworkContext);
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
        ShouldPublishLog(frameworkContext.logger.level, "debug")
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
    handler: FrameworkMiddleware;
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
    handler: FrameworkMiddleware;
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

function getHooks(frameworkContext: FrameworkContext) {
  const plugins = frameworkContext.options.plugins || [];
  const beforeHooks: {
    matcher: (context: HookEndpointContext) => boolean;
    handler: FrameworkMiddleware;
  }[] = [];
  const afterHooks: {
    matcher: (context: HookEndpointContext) => boolean;
    handler: FrameworkMiddleware;
  }[] = [];
  if (frameworkContext.options.hooks?.before) {
    beforeHooks.push({
      matcher: () => true,
      handler: frameworkContext.options.hooks.before,
    });
  }
  if (frameworkContext.options.hooks?.after) {
    afterHooks.push({
      matcher: () => true,
      handler: frameworkContext.options.hooks.after,
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

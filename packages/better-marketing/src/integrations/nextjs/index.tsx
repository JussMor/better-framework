import type { BetterMarketingInstance } from "../../types";

export function toNextJsHandler(
  marketing:
    | BetterMarketingInstance<any, any>
    | {
        handler: (request: Request) => Promise<Response>;
      }
    | ((request: Request) => Promise<Response>)
) {
  const handler = async (request: Request) => {
    if (typeof marketing === "function") {
      return marketing(request);
    }

    if ("handler" in marketing) {
      // Ensure marketing context is initialized before handling request
      if ("$context" in marketing && marketing.$context) {
        // If $context is a promise, await it
        if (typeof (marketing.$context as any)?.then === "function") {
          await (marketing.$context as Promise<any>);
        }
      }
      return marketing.handler(request);
    }

    throw new Error("Invalid marketing handler provided");
  };

  return {
    GET: handler,
    POST: handler,
    PUT: handler,
    DELETE: handler,
    PATCH: handler,
    OPTIONS: handler,
  };
}

import { Framework } from "../../framework";

export function toNextJsHandler(
  framework:
    | Framework
    | {
        handler: (request: Request) => Promise<Response>;
      }
    | ((request: Request) => Promise<Response>)
) {
  const handler = async (request: Request) => {
    if (typeof framework === "function") {
      return framework(request);
    }

    if ("handler" in framework) {
      // Ensure framework context is initialized before handling request
      if ("$context" in framework && framework.$context) {
        // If $context is a promise, await it
        if (typeof (framework.$context as any)?.then === "function") {
          await (framework.$context as Promise<any>);
        }
      }
      return framework.handler(request);
    }

    throw new Error("Invalid framework handler provided");
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

import type { EndpointContext, InputContext } from "better-call";
import type { FrameworkContext } from ".";

export type HookEndpointContext = EndpointContext<string, any> &
  Omit<InputContext<string, any>, "method"> & {
    context: FrameworkContext & {
      returned?: unknown;
      responseHeaders?: Headers;
    };
    headers?: Headers;
  };

export type GenericEndpointContext = EndpointContext<string, any> & {
  context: FrameworkContext;
};

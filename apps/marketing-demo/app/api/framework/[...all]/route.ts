import { framework } from "../../../../lib/framework";
import { toNextJsHandler } from "better-framework/nextjs";

export const { GET, POST, PUT, DELETE, PATCH, OPTIONS } =
  toNextJsHandler(framework);

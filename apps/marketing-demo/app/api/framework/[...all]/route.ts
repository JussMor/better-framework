import { toNextJsHandler } from "better-framework/nextjs";
import { marketing } from "../../../../lib/marketing";

export const { GET, POST, PUT, DELETE, PATCH, OPTIONS } =
  toNextJsHandler(marketing);

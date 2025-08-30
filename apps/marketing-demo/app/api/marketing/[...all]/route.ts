import { marketing } from "@/lib/marketing";
import { toNextJsHandler } from "better-marketing/nextjs";

export const { GET, POST, PUT, DELETE, PATCH, OPTIONS } =
  toNextJsHandler(marketing);

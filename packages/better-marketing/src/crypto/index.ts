/**
 * Cryptographic utilities for Better Marketing
 */

import { generateId as utilsGenerateId } from "../core/utils";

export function generateApiKey(): string {
  return `bm_${utilsGenerateId()}_${Date.now()}`;
}

export { utilsGenerateId as generateId };

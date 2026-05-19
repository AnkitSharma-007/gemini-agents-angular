import type * as Genai from '@google/genai';

let cached: Promise<typeof Genai> | null = null;

/**
 * Lazy-load the `@google/genai` SDK on first use. The SDK is large (~150 kB
 * gzip) and unreachable until the user has a key, so we keep it out of the
 * initial bundle and resolve a single shared module promise across the app.
 */
export function loadGenaiSdk(): Promise<typeof Genai> {
  if (!cached) cached = import('@google/genai');
  return cached;
}

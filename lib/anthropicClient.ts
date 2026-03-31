/**
 * lib/anthropicClient.ts
 * Singleton Anthropic client.
 * Import this module in API routes only — never in browser-side code.
 * Reads ANTHROPIC_API_KEY from the server environment at module load time.
 */

import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error(
    "Missing environment variable: ANTHROPIC_API_KEY. " +
      "Add it to your .env.local file (see .env.example)."
  );
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export default anthropic;

/**
 * scripts/seed-knowledge.ts
 *
 * NOTE: This seed script requires a dedicated embedding provider.
 * The project currently uses Claude (Anthropic) for chat, but Anthropic does
 * not provide an embeddings API. Vector search is therefore disabled and the
 * chat bot falls back to the static COMPANY_KNOWLEDGE in promptBuilder.ts.
 *
 * To enable RAG seeding in the future:
 *  1. Add Voyage AI (https://www.voyageai.com) — Anthropic's recommended
 *     embedding partner — or another provider (e.g. Cohere).
 *  2. Replace the stub below with a real embedding call.
 *  3. Run: npm run seed
 */

console.error(
  "\n[seed-knowledge] Seeding is not available without an embedding provider.\n" +
    "The chatbot works without it — see scripts/seed-knowledge.ts for details.\n"
);
process.exit(0);

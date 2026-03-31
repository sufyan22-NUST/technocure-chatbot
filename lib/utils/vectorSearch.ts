/**
 * lib/utils/vectorSearch.ts
 *
 * NOTE: Vector search is currently disabled because Anthropic does not provide
 * an embeddings API. The chat route automatically falls back to the static
 * COMPANY_KNOWLEDGE in promptBuilder.ts, which covers all Technocure FAQs.
 *
 * To re-enable RAG in the future, add a dedicated embedding provider
 * (e.g. Voyage AI — anthropic's recommended partner — or Cohere) and restore
 * the supabase.rpc("match_knowledge_chunks") call with the resulting vector.
 */

import type { KnowledgeChunk } from "@/lib/types";

/**
 * Always returns an empty array. The API route will use the static knowledge
 * base fallback in the system prompt instead.
 */
export async function searchKnowledgeChunks(
  _queryText: string
): Promise<KnowledgeChunk[]> {
  return [];
}

/**
 * Stub — embedding generation is not available without an embedding provider.
 * Used only by the seed script; throws if called.
 */
export async function generateEmbedding(_text: string): Promise<number[]> {
  throw new Error(
    "Embedding generation requires a dedicated embedding provider. " +
      "See lib/utils/vectorSearch.ts for instructions."
  );
}

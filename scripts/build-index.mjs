// Builds data/vector-index.json for the RAG chatbot.
// 1) collect content (public/data/profile.json + data/knowledge/*.md)
// 2) split into chunks   3) embed each chunk with Gemini   4) save the vector index
// Run:  npm run build-index      (without GEMINI_API_KEY it saves a keyword-only index)
import fs from "node:fs";
import { loadEnv } from "../lib/env.js";
import { collectChunks, INDEX_PATH, PROFILE_PATH } from "../lib/rag.js";
import { hasGemini, embedTexts } from "../lib/gemini.js";

loadEnv();

const chunks = collectChunks();
console.log(`Collected ${chunks.length} chunks:`);
for (const c of chunks) console.log(`  #${String(c.id).padStart(2)}  ${c.title}  (${c.text.length} chars) -> ${c.anchor}`);

let model = null;
if (hasGemini()) {
  try {
    const vectors = await embedTexts(chunks.map((c) => `${c.title}\n${c.text}`), "RETRIEVAL_DOCUMENT");
    if (vectors.length !== chunks.length) throw new Error(`got ${vectors.length} vectors for ${chunks.length} chunks`);
    vectors.forEach((v, i) => (chunks[i].embedding = v.map((x) => Number(x.toFixed(6)))));
    model = process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001";
    console.log(`Embedded ${vectors.length} chunks with ${model} (${vectors[0]?.length} dimensions).`);
  } catch (e) {
    console.warn(`\n⚠ Embedding failed (${e.message}). Saving a keyword-only index instead.\n`);
  }
} else {
  console.log("\nℹ GEMINI_API_KEY not set: saving a keyword-only index (chatbot still works with keyword search).");
}

const owner = JSON.parse(fs.readFileSync(PROFILE_PATH, "utf8")).name || "the portfolio owner";
fs.writeFileSync(INDEX_PATH, JSON.stringify({ owner, model, createdAt: new Date().toISOString(), chunks }));
console.log(`\n✔ Saved ${INDEX_PATH}`);

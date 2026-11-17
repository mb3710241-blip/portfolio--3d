// POST /api/chat  { message, history? }  ->  { answer, sources[], mode }
// RAG pipeline: retrieve relevant chunks -> ground the LLM on them -> answer with citations.
import { send, readJson, clientIp, rateLimiter } from "../lib/http.js";
import { loadIndex, hybridSearch, buildSystemPrompt, buildUserPrompt } from "../lib/rag.js";
import { hasGemini, embedQuery, generate } from "../lib/gemini.js";

const limited = rateLimiter({ max: 20, windowMs: 60_000 });
const GREETING = /^\s*(hi+|hello|hey|salam|salaam|assalam[\w ]*|aoa|good (morning|evening|afternoon))\b[\s!.?]*$/i;

// the owner's name is stored in the index at build time (functions on Vercel only bundle data/**)
function ownerName() {
  try {
    return loadIndex().owner || "the portfolio owner";
  } catch {
    return "the portfolio owner";
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return send(res, 405, { error: "Use POST." });
  if (limited(clientIp(req))) return send(res, 429, { error: "Too many messages. Please wait a minute." });

  let body;
  try {
    body = await readJson(req, 12_000);
  } catch (e) {
    return send(res, e.status || 400, { error: e.message });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return send(res, 400, { error: "Please type a question." });
  if (message.length > 500) return send(res, 400, { error: "Please keep questions under 500 characters." });

  const history = (Array.isArray(body.history) ? body.history : [])
    .filter((m) => m && typeof m.text === "string" && (m.role === "user" || m.role === "model"))
    .slice(-6)
    .map((m) => ({ role: m.role, text: m.text.slice(0, 1000) }));

  const name = ownerName();

  try {
    const index = loadIndex();
    let queryVector = null;
    if (hasGemini() && index.chunks.some((c) => Array.isArray(c.embedding))) {
      try {
        queryVector = await embedQuery(message);
      } catch (e) {
        console.warn("Query embedding failed, using keyword search:", e.message);
      }
    }

    let hits = hybridSearch(index.chunks, message, queryVector, 4);
    // always give the model the short overview so "who is he?" style questions work
    const overview = index.chunks.find((c) => c.anchor === "#home");
    if (overview && !hits.some((h) => h.id === overview.id)) {
      const { embedding, ...o } = overview;
      hits = [...hits, o];
    }

    if (hasGemini()) {
      try {
        const answer = await generate({
          system: buildSystemPrompt(name),
          prompt: buildUserPrompt(message, hits),
          history,
        });
        const used = [...new Set([...answer.matchAll(/\[(\d+)\]/g)].map((m) => Number(m[1])))]
          .filter((n) => n >= 1 && n <= hits.length);
        return send(res, 200, {
          answer: answer || `Sorry, I couldn't find that. You can ask ${name} through the contact form.`,
          sources: used.map((n) => ({ n, title: hits[n - 1].title, anchor: hits[n - 1].anchor })),
          mode: queryVector ? "rag-vector" : "rag-keyword",
        });
      } catch (e) {
        console.error("Gemini generation failed:", e.message);
        // fall through to keyword answer
      }
    }

    return send(res, 200, keywordAnswer(message, hits.filter((h) => h.score > 0), name));
  } catch (err) {
    console.error("Chat error:", err);
    return send(res, 500, { error: "The assistant is unavailable right now. Please try again later." });
  }
}

/** Offline fallback (no API key): returns the best matching chunk instead of an LLM answer. */
function keywordAnswer(message, hits, name) {
  if (GREETING.test(message)) {
    return {
      answer: `Hi! I'm ${name}'s portfolio assistant. Ask me about ${name}'s skills, projects, education or how to get in touch.`,
      sources: [],
      mode: "keyword",
    };
  }
  if (!hits.length) {
    return {
      answer: `I don't have information about that in ${name}'s portfolio. You can ask ${name} directly using the contact form.`,
      sources: [],
      mode: "keyword",
    };
  }
  // combine up to 3 strong matches (e.g. several skill groups)
  const strong = hits.filter((h) => h.score >= hits[0].score * 0.6).slice(0, 3);
  const parts = [];
  let used = 0;
  for (const h of strong) {
    if (used && used + h.text.length > 700) break;
    parts.push(`${h.text} [${parts.length + 1}]`);
    used += h.text.length;
  }
  if (!parts.length) parts.push(`${hits[0].text.slice(0, 600).replace(/\s+\S*$/, "")}… [1]`);
  return {
    answer: `Here is what I found in the portfolio:\n\n${parts.join("\n\n")}`,
    sources: parts.map((_, i) => ({ n: i + 1, title: strong[i]?.title || hits[0].title, anchor: strong[i]?.anchor || hits[0].anchor })),
    mode: "keyword",
  };
}

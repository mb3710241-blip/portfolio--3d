// Google Gemini API client (embeddings + text generation) using plain fetch.
// Free API key: https://aistudio.google.com/apikey

const BASE = "https://generativelanguage.googleapis.com/v1beta";

export function hasGemini() {
  return Boolean(process.env.GEMINI_API_KEY);
}

function cfg() {
  return {
    key: process.env.GEMINI_API_KEY,
    chatModel: process.env.GEMINI_CHAT_MODEL || "gemini-flash-latest",
    embedModel: process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001",
    dims: Number(process.env.EMBED_DIMS || 768),
  };
}

async function post(url, body, timeoutMs = 25_000) {
  const { key } = cfg();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(`Gemini ${r.status}: ${data?.error?.message || r.statusText}`);
    return data;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Embeds many texts. taskType: "RETRIEVAL_DOCUMENT" for chunks, "RETRIEVAL_QUERY" for questions.
 * Returns an array of number[] vectors.
 */
export async function embedTexts(texts, taskType = "RETRIEVAL_DOCUMENT") {
  const { embedModel, dims } = cfg();
  const out = [];
  for (let i = 0; i < texts.length; i += 90) {
    const batch = texts.slice(i, i + 90);
    const data = await post(`${BASE}/models/${embedModel}:batchEmbedContents`, {
      requests: batch.map((text) => ({
        model: `models/${embedModel}`,
        content: { parts: [{ text }] },
        taskType,
        outputDimensionality: dims,
      })),
    });
    for (const e of data.embeddings || []) out.push(e.values);
  }
  return out;
}

export async function embedQuery(text) {
  const [v] = await embedTexts([text], "RETRIEVAL_QUERY");
  return v;
}

/** Generates an answer. history = [{role:"user"|"model", text}] */
export async function generate({ system, prompt, history = [], temperature = 0.3 }) {
  const { chatModel } = cfg();
  const contents = [
    ...history.map((m) => ({ role: m.role === "model" ? "model" : "user", parts: [{ text: m.text }] })),
    { role: "user", parts: [{ text: prompt }] },
  ];
  const data = await post(`${BASE}/models/${chatModel}:generateContent`, {
    systemInstruction: { parts: [{ text: system }] },
    contents,
    generationConfig: { temperature, maxOutputTokens: 700 },
  });
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  return text.trim();
}

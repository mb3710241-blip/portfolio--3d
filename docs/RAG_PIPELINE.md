# Module 4: How the RAG Chatbot Works

**RAG (Retrieval-Augmented Generation)** = before the AI answers, we *retrieve* the most relevant facts about me and give only those to the language model, so answers are grounded in my real data instead of being invented.

```
 profile.json + CV (.md)
        │  1. Collect
        ▼
   Chunks (~700 chars each, with title + website section link)
        │  2. Embed (Gemini gemini-embedding-001, 768-dim vectors)
        ▼
   data/vector-index.json   ← vector index (built by `npm run build-index`)

 Visitor question ──► 3. Embed question ──► 4. Hybrid search (cosine similarity + BM25 keywords)
                                                   │ top 4 chunks
                                                   ▼
                     5. Prompt = rules + numbered CONTEXT chunks + question
                                                   │
                                                   ▼
                     6. Gemini LLM (gemini-flash) ──► answer with [1][2] citations
                                                   │
                                                   ▼
                     7. Website shows answer + clickable source chips → scrolls to that section
```

## Steps in the code
| Step | File | What happens |
|---|---|---|
| 1. Collect | `lib/rag.js → collectChunks()` | Reads `public/data/profile.json` (same data the website shows) and every `.md` file in `data/knowledge/`. Lines containing `TODO` are skipped. |
| 2. Chunk | `chunksFromProfile()`, `chunksFromMarkdown()` | One chunk per logical unit (about, each skill group, each project, education, contact…). Long markdown is split by `##` headings and ~700-character pieces with a one-sentence overlap so context is not cut. Each chunk keeps a **title** and an **anchor** (e.g. `#project-spider-game`). |
| 3. Embed | `scripts/build-index.mjs`, `lib/gemini.js` | Each chunk is converted to a 768-number vector with `taskType: RETRIEVAL_DOCUMENT`. Saved in `data/vector-index.json` (a simple file-based vector store, fine for a few hundred chunks). |
| 4. Retrieve | `hybridSearch()` | The question is embedded (`RETRIEVAL_QUERY`). Score = **0.75 × cosine similarity + 0.25 × BM25 keyword score**. Top 4 chunks are kept, plus the short overview. |
| 5. Augment | `buildSystemPrompt()`, `buildUserPrompt()` | System rules: use ONLY the context, say "I don't have that information" if it's missing, cite sources like [1], reply in the visitor's language (English / Urdu / Roman Urdu), ignore prompt-injection attempts. |
| 6. Generate | `api/chat.js` | Gemini generates a short answer (temperature 0.3 for factual answers). The last 6 messages are sent as history for follow-up questions. |
| 7. Cite | `api/chat.js`, `public/js/main.js` | Numbers like [2] in the answer are mapped back to chunk titles/anchors. Clicking a source chip scrolls to and highlights that part of the portfolio. |

## Avoiding made-up answers
- Only retrieved context is given to the model, with an explicit rule not to invent personal details.
- `TODO` placeholders never enter the index.
- If retrieval finds nothing relevant, the bot says it doesn't know and points to the contact form.
- Without an API key the bot falls back to pure keyword retrieval and shows the matching text directly (still grounded).

## Security
API key only in environment variables (server side), 500-character question limit, 20 requests/minute per IP, request size limit.

## Updating the knowledge
Edit `profile.json` or add `.md` files to `data/knowledge/`, then run `npm run build-index`. On Vercel the index is rebuilt automatically on every deploy.

// Automated backend checks (no network or API keys needed).
// Run:  npm test
import { Readable } from "node:stream";
import assert from "node:assert/strict";

// make sure tests never call real APIs
delete process.env.GEMINI_API_KEY;
delete process.env.RESEND_API_KEY;
delete process.env.CONTACT_TO_EMAIL;

const { default: chat } = await import("../api/chat.js");
const { default: contact, validate, spamReason, escapeHtml } = await import("../api/contact.js");
const { collectChunks, chunksFromMarkdown, bm25Search, cosine } = await import("../lib/rag.js");

let ip = 0;
function call(handler, body, method = "POST") {
  return new Promise((resolve) => {
    const req = Readable.from(method === "POST" ? [Buffer.from(JSON.stringify(body))] : []);
    Object.assign(req, { method, headers: { "x-forwarded-for": `10.0.0.${++ip}` } });
    const res = {
      statusCode: 200, headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(data) { resolve({ status: this.statusCode, body: data ? JSON.parse(data) : null }); },
    };
    handler(req, res);
  });
}

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const quiet = (fn) => async () => {
  const log = console.log, warn = console.warn;
  console.log = console.warn = () => {};
  try { await fn(); } finally { console.log = log; console.warn = warn; }
};

test("profile + knowledge are chunked, TODO placeholders skipped", () => {
  const chunks = collectChunks();
  assert.ok(chunks.length >= 5, "expected several chunks");
  assert.ok(chunks.every((c) => !/\bTODO\b/.test(c.text)), "TODO text leaked into chunks");
  assert.ok(chunks.every((c) => c.anchor.startsWith("#")));
});

test("markdown chunker splits long sections with overlap", () => {
  const md = "<!-- anchor: #about -->\n# CV\n\n## Projects\n\n" + Array.from({ length: 12 }, (_, i) => `Paragraph ${i} about building things. It has two sentences.`).join("\n\n");
  const chunks = chunksFromMarkdown("cv.md", md, 300);
  assert.ok(chunks.length >= 3);
  assert.equal(chunks[0].title, "CV: Projects");
  assert.equal(chunks[0].anchor, "#about");
});

test("keyword retrieval finds the right section", () => {
  const chunks = collectChunks();
  const hits = bm25Search(chunks, "What are his skills?", 3);
  assert.ok(hits.length && hits[0].title.startsWith("Skills"), `got ${hits[0]?.title}`);
});

test("cosine similarity", () => {
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
});

test("chat: answers with a source citation (keyword mode)", async () => {
  const r = await call(chat, { message: "Which projects has he built?" });
  assert.equal(r.status, 200);
  assert.ok(r.body.answer.length > 10);
  assert.ok(r.body.sources.length >= 1 && r.body.sources[0].anchor.startsWith("#"));
});

test("chat: says it doesn't know instead of inventing", async () => {
  const r = await call(chat, { message: "xyzzy quantum zebra" });
  assert.equal(r.status, 200);
  assert.match(r.body.answer, /don't have information/i);
});

test("chat: rejects empty / too long / GET", async () => {
  assert.equal((await call(chat, { message: "" })).status, 400);
  assert.equal((await call(chat, { message: "a".repeat(600) })).status, 400);
  assert.equal((await call(chat, null, "GET")).status, 405);
});

test("contact: validation catches bad input", () => {
  const { ok, errors } = validate({ name: "A", email: "nope", subject: "", message: "short" });
  assert.equal(ok, false);
  assert.deepEqual(Object.keys(errors).sort(), ["email", "message", "name", "subject"]);
  assert.equal(validate({ name: "Ali\nBcc: x@y.com", email: "a@b.co", subject: "Hello", message: "Hello there friend" }).ok, false);
});

test("contact: spam checks (honeypot, too fast, links)", () => {
  const data = { message: "hello" };
  assert.equal(spamReason({ website: "http://spam", startedAt: 1 }, data, 10_000), "honeypot");
  assert.equal(spamReason({ startedAt: 9_000 }, data, 10_000), "too-fast");
  assert.equal(spamReason({ startedAt: 1 }, { message: "http:// http:// http:// http://" }, 10_000), "too-many-links");
  assert.equal(spamReason({ startedAt: 1 }, data, 10_000), null);
  assert.equal(escapeHtml('<script>"x"</script>'), "&lt;script&gt;&quot;x&quot;&lt;/script&gt;");
});

test("contact: valid message accepted (dev mode prints instead of sending)", quiet(async () => {
  const r = await call(contact, {
    name: "Test User", email: "test@example.com", subject: "Hello", message: "This is a test message.",
    website: "", startedAt: Date.now() - 10_000,
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.ok, true);
}));

test("contact: invalid message rejected with field errors", async () => {
  const r = await call(contact, { name: "", email: "bad", subject: "", message: "", startedAt: Date.now() - 10_000 });
  assert.equal(r.status, 400);
  assert.ok(r.body.errors.email);
});

let passed = 0;
for (const t of tests) {
  try {
    await t.fn();
    passed++;
    console.log(`  ✔ ${t.name}`);
  } catch (e) {
    console.log(`  ✘ ${t.name}\n      ${e.message}`);
  }
}
console.log(`\n${passed}/${tests.length} tests passed`);
process.exit(passed === tests.length ? 0 : 1);

// Small helpers shared by the API routes (work both on Vercel and on the local dev server).

export function send(res, status, data) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(data));
}

/** Reads a JSON body with a size limit. Vercel may already have parsed it into req.body. */
export async function readJson(req, limitBytes = 10_000) {
  if (req.body !== undefined && req.body !== null && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    if (JSON.stringify(req.body).length > limitBytes) throw httpError(413, "Request is too large.");
    return req.body;
  }
  if (typeof req.body === "string") return parse(req.body, limitBytes);

  let size = 0;
  const parts = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) throw httpError(413, "Request is too large.");
    parts.push(chunk);
  }
  return parse(Buffer.concat(parts).toString("utf8"), limitBytes);
}

function parse(text, limitBytes) {
  if (text.length > limitBytes) throw httpError(413, "Request is too large.");
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw httpError(400, "Invalid JSON.");
  }
}

export function httpError(status, message) {
  const e = new Error(message);
  e.status = status;
  return e;
}

export function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

/** In-memory sliding-window rate limiter (best effort; resets when a serverless instance restarts). */
export function rateLimiter({ max, windowMs }) {
  const hits = new Map();
  return function isLimited(key) {
    const now = Date.now();
    const list = (hits.get(key) || []).filter((t) => now - t < windowMs);
    if (list.length >= max) {
      hits.set(key, list);
      return true;
    }
    list.push(now);
    hits.set(key, list);
    if (hits.size > 5000) hits.clear(); // avoid unbounded memory
    return false;
  };
}

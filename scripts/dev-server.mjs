// Local dev server: serves /public and runs /api/*.js the same way Vercel does.
// Run:  npm run dev   ->  http://localhost:3000
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { loadEnv } from "../lib/env.js";

loadEnv();
const root = process.cwd();
const PUBLIC = path.join(root, "public");
const PORT = Number(process.env.PORT || 3000);
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".ico": "image/x-icon",
  ".glb": "model/gltf-binary", ".gltf": "model/gltf+json", ".bin": "application/octet-stream",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mp3": "audio/mpeg", ".pdf": "application/pdf", ".txt": "text/plain",
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  try {
    // ---- API routes: /api/chat -> api/chat.js
    const api = url.pathname.match(/^\/api\/([\w-]+)\/?$/);
    if (api) {
      const file = path.join(root, "api", `${api[1]}.js`);
      if (!fs.existsSync(file)) return notFound(res);
      const mod = await import(pathToFileURL(file).href);
      return await mod.default(req, res);
    }

    // ---- static files
    let file = path.normalize(path.join(PUBLIC, decodeURIComponent(url.pathname)));
    if (!file.startsWith(PUBLIC)) {
      res.statusCode = 403;
      return res.end("Forbidden");
    }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!fs.existsSync(file)) return notFound(res);

    const stat = fs.statSync(file);
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Accept-Ranges", "bytes");

    // Range requests so <video> seeking works
    const range = req.headers.range?.match(/bytes=(\d*)-(\d*)/);
    if (range) {
      const start = range[1] ? Number(range[1]) : 0;
      const end = range[2] ? Number(range[2]) : stat.size - 1;
      if (start >= stat.size || end >= stat.size || start > end) {
        res.statusCode = 416;
        res.setHeader("Content-Range", `bytes */${stat.size}`);
        return res.end();
      }
      res.statusCode = 206;
      res.setHeader("Content-Range", `bytes ${start}-${end}/${stat.size}`);
      res.setHeader("Content-Length", end - start + 1);
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.setHeader("Content-Length", stat.size);
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.statusCode = 500;
    res.end("Server error");
  }
});

function notFound(res) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/plain");
  res.end("Not found");
}

server.listen(PORT, () => {
  console.log(`\n  ✔ Portfolio running at  http://localhost:${PORT}`);
  console.log(`    Chatbot:  ${process.env.GEMINI_API_KEY ? "Gemini (RAG)" : "keyword mode (add GEMINI_API_KEY to .env for AI answers)"}`);
  console.log(`    Email:    ${process.env.RESEND_API_KEY ? "Resend" : "messages are printed here (add RESEND_API_KEY to .env to send real emails)"}`);
  console.log("    Stop with Ctrl + C\n");
});

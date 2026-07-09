/* global process */
import { createReadStream, existsSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { createServer } from "node:http";

const port = Number(process.env.PORT || 4173);
const distDir = resolve("dist");
const indexFile = join(distDir, "index.html");

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

function getContentType(filePath) {
  const extension = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return contentTypes[extension] || "application/octet-stream";
}

function sendFile(res, filePath) {
  res.writeHead(200, {
    "Content-Type": getContentType(filePath),
    "Cache-Control": filePath.endsWith("index.html")
      ? "no-store"
      : "public, max-age=31536000, immutable",
  });
  createReadStream(filePath).pipe(res);
}

createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  const pathname = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
  const requestedPath = resolve(join(distDir, pathname));

  if (requestedPath.startsWith(distDir) && existsSync(requestedPath) && statSync(requestedPath).isFile()) {
    sendFile(res, requestedPath);
    return;
  }

  sendFile(res, indexFile);
}).listen(port, "0.0.0.0", () => {
  console.log(`EcoRoute frontend listening on ${port}`);
});

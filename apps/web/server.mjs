// Servidor estático da prévia do portal (só desenvolvimento local). Sem dependências.
// Rotas sem extensão caem no index.html (navegação do lado do cliente).
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { networkInterfaces } from "node:os";
import { extname, join, resolve, sep } from "node:path";

const ROOT = resolve(import.meta.dirname, "public");
const PORT = Number(process.env.PORT) || 5180;
const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".m4a": "audio/mp4",
};

createServer(async (req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url ?? "/", "http://local").pathname);
  } catch {
    res.writeHead(400).end();
    return;
  }
  const file = resolve(ROOT, "." + pathname);
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403).end(); // bloqueia ../
    return;
  }
  if (!extname(file) && pathname !== "/") {
    res.writeHead(302, { location: "/#" + pathname }).end(); // links antigos (/sobre) → rota por hash (#/sobre)
    return;
  }
  const target = extname(file) ? file : join(ROOT, "index.html");
  try {
    const body = await readFile(target);
    res.writeHead(200, { "content-type": TYPES[extname(target)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(body);
  } catch {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" }).end("Não encontrado");
  }
}).listen(PORT, "0.0.0.0", () => {
  console.log(`Portal PSICOSE (prévia)\n  Local: http://localhost:${PORT}`);
  for (const list of Object.values(networkInterfaces()))
    for (const n of list ?? [])
      if (n.family === "IPv4" && !n.internal) console.log(`  Rede:  http://${n.address}:${PORT}`);
});

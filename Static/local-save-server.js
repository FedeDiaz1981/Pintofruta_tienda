const http = require("http");
const fs = require("fs/promises");
const path = require("path");
const fsSync = require("fs");

const PORT = 8787;
const ROOT = __dirname;

function send(res, statusCode, body, headers = {}) {
    res.writeHead(statusCode, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        ...headers,
    });
    res.end(body);
}

function safeJoin(relativePath) {
    const normalized = path.normalize(relativePath).replace(/^([.][.][/\\])+/, "");
    const fullPath = path.join(ROOT, normalized);
    if (!fullPath.startsWith(ROOT)) {
        throw new Error("Invalid path");
    }
    return fullPath;
}

function readJson(req) {
    return new Promise((resolve, reject) => {
        let raw = "";
        req.on("data", (chunk) => {
            raw += chunk;
            if (raw.length > 10 * 1024 * 1024) {
                reject(new Error("Payload too large"));
                req.destroy();
            }
        });
        req.on("end", () => {
            if (!raw) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(raw));
            } catch (error) {
                reject(error);
            }
        });
        req.on("error", reject);
    });
}

async function ensureDirFor(filePath) {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
}

async function readSiteContent() {
    const filePath = safeJoin("data/site-content.json");
    try {
        const text = await fs.readFile(filePath, "utf8");
        return JSON.parse(text);
    } catch {
        return null;
    }
}

async function writeSiteContent(content) {
    const filePath = safeJoin("data/site-content.json");
    await ensureDirFor(filePath);
    await fs.writeFile(filePath, JSON.stringify(content, null, 2), "utf8");
}

async function writeProjectFile(relativePath, dataBase64) {
    const filePath = safeJoin(relativePath);
    await ensureDirFor(filePath);
    await fs.writeFile(filePath, Buffer.from(dataBase64, "base64"));
}

function getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const map = {
        ".html": "text/html; charset=utf-8",
        ".js": "application/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json; charset=utf-8",
        ".svg": "image/svg+xml",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".ico": "image/x-icon",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".map": "application/json; charset=utf-8",
    };
    return map[ext] || "application/octet-stream";
}

async function serveStaticFile(req, res) {
    const pathname = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${PORT}`).pathname);
    let relativePath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    if (relativePath === "admin-demo.html" && req.headers.referer && req.headers.referer.includes("/admin-demo.html")) {
        relativePath = "admin-demo.html";
    }
    const filePath = safeJoin(relativePath);
    try {
        const stat = await fs.stat(filePath);
        if (stat.isDirectory()) {
            const indexPath = path.join(filePath, "index.html");
            if (fsSync.existsSync(indexPath)) {
                const body = await fs.readFile(indexPath);
                send(res, 200, body, { "Content-Type": "text/html; charset=utf-8" });
                return true;
            }
            return false;
        }
        const body = await fs.readFile(filePath);
        send(res, 200, body, { "Content-Type": getContentType(filePath) });
        return true;
    } catch {
        return false;
    }
}

const server = http.createServer(async (req, res) => {
    try {
        if (req.method === "OPTIONS") {
            send(res, 204, "");
            return;
        }

        if (req.method === "GET" && req.url === "/health") {
            send(res, 200, JSON.stringify({ ok: true }), { "Content-Type": "application/json" });
            return;
        }

        if (req.method === "GET" && req.url === "/api/content") {
            const content = await readSiteContent();
            send(res, 200, JSON.stringify(content || {}), { "Content-Type": "application/json" });
            return;
        }

        if (req.method === "POST" && req.url === "/api/content") {
            const body = await readJson(req);
            await writeSiteContent(body.content || {});
            send(res, 200, JSON.stringify({ ok: true }), { "Content-Type": "application/json" });
            return;
        }

        if (req.method === "POST" && req.url === "/api/file") {
            const body = await readJson(req);
            if (!body.path || !body.dataBase64) {
                send(res, 400, JSON.stringify({ ok: false, error: "Missing path or data" }), { "Content-Type": "application/json" });
                return;
            }
            await writeProjectFile(body.path, body.dataBase64);
            send(res, 200, JSON.stringify({ ok: true }), { "Content-Type": "application/json" });
            return;
        }

        if (req.method === "GET") {
            const served = await serveStaticFile(req, res);
            if (served) {
                return;
            }
        }

        send(res, 404, JSON.stringify({ ok: false, error: "Not found" }), { "Content-Type": "application/json" });
    } catch (error) {
        send(res, 500, JSON.stringify({ ok: false, error: error.message || "Server error" }), { "Content-Type": "application/json" });
    }
});

server.listen(PORT, "127.0.0.1", () => {
    console.log(`Local save server running on http://127.0.0.1:${PORT}`);
});

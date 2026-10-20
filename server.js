const http = require("http");
const fs = require("fs");
const path = require("path");
const menuStore = require("./menu-store");

const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, "public");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const DATA = path.join(__dirname, "data");
const INQUIRIES = path.join(DATA, "inquiries.jsonl");

function readBody(req, limit = 20000) {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > limit) {
        req.destroy();
        reject(new Error("too big"));
      }
    });
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

function sendJson(res, status, body) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-cache",
  });
  res.end(JSON.stringify(body));
}

function menuKeyOk(req) {
  const expected = process.env.MENU_PASSWORD || "";
  if (!expected) return true;
  return req.headers["x-menu-key"] === expected;
}

function saveInquiry(fields) {
  fs.mkdirSync(DATA, { recursive: true });
  const row = JSON.stringify({ received: new Date().toISOString(), ...fields }) + "\n";
  fs.appendFileSync(INQUIRIES, row);
}

http
  .createServer(async (req, res) => {
    const urlPath = decodeURIComponent(req.url.split("?")[0]);

    /*
    if (req.method === "POST" && urlPath === "/functions") {
      try {
        const body = new URLSearchParams(await readBody(req));
        if (body.get("website")) {
          res.writeHead(303, { Location: "/functions?sent=1" });
          return res.end();
        }
        const inquiry = {
          name: (body.get("name") || "").trim(),
          email: (body.get("email") || "").trim(),
          phone: (body.get("phone") || "").trim(),
          event_type: (body.get("event_type") || "").trim(),
          date: (body.get("date") || "").trim(),
          guests: (body.get("guests") || "").trim(),
          where: (body.get("where") || "").trim(),
          details: (body.get("details") || "").trim(),
        };
        if (!inquiry.name || !inquiry.email || !inquiry.email.includes("@")) {
          res.writeHead(303, { Location: "/functions?error=1" });
          return res.end();
        }
        saveInquiry(inquiry);
        console.log("Function inquiry:", inquiry);
        res.writeHead(303, { Location: "/functions?sent=1" });
        return res.end();
      } catch (err) {
        console.error(err);
        res.writeHead(303, { Location: "/functions?error=1" });
        return res.end();
      }
    }
    */

    if (req.method === "GET" && urlPath === "/api/menu") {
      try {
        const menu = await menuStore.loadMenu();
        return sendJson(res, 200, menu);
      } catch (err) {
        console.error(err);
        return sendJson(res, 500, { error: "Menu could not be loaded." });
      }
    }

    if (req.method === "PUT" && urlPath === "/api/menu") {
      if (!menuKeyOk(req)) return sendJson(res, 401, { error: "Wrong password." });
      try {
        const doc = JSON.parse(await readBody(req, 500000));
        const saved = await menuStore.saveMenu(doc);
        return sendJson(res, 200, saved);
      } catch (err) {
        console.error(err);
        return sendJson(res, 400, { error: "Menu could not be saved." });
      }
    }

    let filePath = path.normalize(path.join(ROOT, urlPath));

    if (urlPath === "/edit") {
      filePath = path.join(ROOT, "edit.html");
    }

    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }

    if (urlPath === "/health") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      return res.end("ok");
    }

    /*
    if (urlPath === "/functions") {
      filePath = path.join(ROOT, "functions.html");
    }
    */

    if (urlPath === "/takeout") {
      filePath = path.join(ROOT, "takeout.html");
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, "index.html");
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404, { "Content-Type": "text/plain" });
        return res.end("Not found");
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        "Content-Type": TYPES[ext] || "application/octet-stream",
        "Cache-Control": [".html", ".css", ".js"].includes(ext)
          ? "no-cache"
          : "public, max-age=86400",
      });
      res.end(data);
    });
  })
  .listen(PORT, "0.0.0.0", () => {
    console.log(`Michael's Village Pub running on port ${PORT}`);
  });

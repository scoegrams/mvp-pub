const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "data", "uploads");
const URI = process.env.MONGODB_URI || "";
const MAX = 5 * 1024 * 1024;

let client;

async function collection() {
  if (!URI) return null;
  const { MongoClient } = require("mongodb");
  if (!client) {
    client = new MongoClient(URI);
    await client.connect();
  }
  const name = process.env.MONGODB_DB || "mvp";
  return client.db(name).collection("photos");
}

function slug(value) {
  const text = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return text || "dish";
}

function sniff(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: ".jpg", type: "image/jpeg" };
  }
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { ext: ".png", type: "image/png" };
  }
  if (buf.length > 12 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return { ext: ".webp", type: "image/webp" };
  }
  return null;
}

function asBuffer(value) {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;
  if (value.buffer) return Buffer.from(value.buffer);
  return Buffer.from(value);
}

function parseUpload(contentType, raw) {
  const type = String(contentType || "");
  if (type.startsWith("image/")) {
    return { buf: raw, filename: "photo" };
  }
  const match = type.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) throw new Error("bad type");
  const token = (match[1] || match[2]).trim();
  const boundary = Buffer.from("--" + token);
  let from = raw.indexOf(boundary);
  if (from < 0) throw new Error("boundary");
  from += boundary.length;
  while (from < raw.length) {
    if (raw[from] === 0x2d && raw[from + 1] === 0x2d) break;
    if (raw[from] === 13 && raw[from + 1] === 10) from += 2;
    const headerEnd = raw.indexOf(Buffer.from("\r\n\r\n"), from);
    if (headerEnd < 0) break;
    const headers = raw.slice(from, headerEnd).toString("latin1");
    const next = raw.indexOf(Buffer.from("\r\n--" + token), headerEnd + 4);
    const end = next < 0 ? raw.length : next;
    const buf = raw.slice(headerEnd + 4, end);
    from = end + 2;
    if (!/filename=/i.test(headers)) continue;
    const filename = ((headers.match(/filename="([^"]*)"/i) || headers.match(/filename=([^;\r\n]+)/i) || [])[1] || "photo").trim();
    return { buf, filename };
  }
  throw new Error("no file");
}

async function savePhoto({ filename, buf }) {
  const kind = sniff(buf);
  if (!kind) throw new Error("bad image");
  if (buf.length > MAX) throw new Error("too big");
  const id = slug(String(filename || "photo").replace(/\.[a-z0-9]+$/i, "")) + "-" + Date.now().toString(36) + kind.ext;
  fs.mkdirSync(DIR, { recursive: true });
  fs.writeFileSync(path.join(DIR, id), buf);
  const col = await collection();
  if (col) {
    await col.updateOne(
      { _id: id },
      { $set: { type: kind.type, buf, updated: new Date() } },
      { upsert: true }
    );
  }
  return { url: "/img/dishes/" + id, storage: col ? "mongodb" : "file" };
}

async function getPhoto(id) {
  if (!/^[a-z0-9][a-z0-9._-]{0,80}$/.test(id)) return null;
  const disk = path.join(DIR, id);
  if (fs.existsSync(disk)) {
    const buf = fs.readFileSync(disk);
    const kind = sniff(buf) || { type: "image/jpeg" };
    return { buf, type: kind.type };
  }
  const col = await collection();
  if (!col) return null;
  const doc = await col.findOne({ _id: id });
  const buf = asBuffer(doc && doc.buf);
  if (!buf) return null;
  return { buf, type: doc.type || "image/jpeg" };
}

module.exports = { parseUpload, savePhoto, getPhoto, MAX };

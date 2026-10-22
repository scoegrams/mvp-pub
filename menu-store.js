const fs = require("fs");
const path = require("path");

const FILE = path.join(__dirname, "menu", "menu.json");
const URI = process.env.MONGODB_URI || "";

let client;

function readFile() {
  return JSON.parse(fs.readFileSync(FILE, "utf8"));
}

function writeFile(doc) {
  const next = JSON.stringify(doc, null, 2) + "\n";
  const tmp = FILE + ".tmp";
  fs.writeFileSync(tmp, next);
  fs.renameSync(tmp, FILE);
}

async function collection() {
  if (!URI) return null;
  const { MongoClient } = require("mongodb");
  if (!client) {
    client = new MongoClient(URI);
    await client.connect();
  }
  const name = process.env.MONGODB_DB || "mvp";
  return client.db(name).collection("menu");
}

function clean(doc) {
  const categories = Array.isArray(doc.categories) ? doc.categories : [];
  return {
    footer: String(doc.footer || "").slice(0, 500),
    categories: categories.slice(0, 40).map((category, index) => ({
      id: slug(category.id || category.name || "section-" + index),
      name: String(category.name || "Section").slice(0, 80),
      note: String(category.note || "").slice(0, 400),
      items: (Array.isArray(category.items) ? category.items : []).slice(0, 80).map((item, itemIndex) => {
        const next = {
          id: slug(item.id || item.name || "item-" + itemIndex),
          name: String(item.name || "Item").slice(0, 80),
          price: String(item.price || "").slice(0, 120),
          detail: String(item.detail || "").slice(0, 400),
        };
        const image = cleanImage(item.image);
        if (image) next.image = image;
        return next;
      }),
    })),
  };
}

function cleanImage(value) {
  const image = String(value || "").trim();
  if (!/^(\/img\/|https:\/\/)[^\s"'<>]+$/.test(image)) return "";
  if (image.includes("..")) return "";
  return image.slice(0, 300);
}

function slug(value) {
  const text = String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return text || "item";
}

function fileImages() {
  const images = new Map();
  for (const category of readFile().categories || []) {
    for (const item of category.items || []) {
      const image = cleanImage(item.image);
      if (item.id && image) images.set(item.id, image);
    }
  }
  return images;
}

function fillMissingImages(doc) {
  const images = fileImages();
  return {
    footer: doc.footer || "",
    categories: (doc.categories || []).map((category) => ({
      ...category,
      items: (category.items || []).map((item) => {
        if (cleanImage(item.image) || !images.has(item.id)) return item;
        return { ...item, image: images.get(item.id) };
      }),
    })),
  };
}

async function loadMenu() {
  const col = await collection();
  if (!col) return readFile();
  const saved = await col.findOne({ _id: "live" });
  if (saved && Array.isArray(saved.categories)) {
    return fillMissingImages({ footer: saved.footer || "", categories: saved.categories });
  }
  const seed = readFile();
  await col.updateOne(
    { _id: "live" },
    { $set: { ...seed, updated: new Date() } },
    { upsert: true }
  );
  return seed;
}

async function saveMenu(doc) {
  const next = clean(doc);
  const col = await collection();
  if (col) {
    await col.updateOne(
      { _id: "live" },
      { $set: { ...next, updated: new Date() } },
      { upsert: true }
    );
    return { ...next, storage: "mongodb" };
  }
  writeFile(next);
  return { ...next, storage: "file" };
}

function storageName() {
  return URI ? "mongodb" : "file";
}

module.exports = { loadMenu, saveMenu, storageName };

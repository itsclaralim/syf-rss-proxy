import fs from "fs";
import fetch from "node-fetch";

const CONFIG = {
  RSS_URL: "https://syfine.tistory.com/rss",
  MAX_PAGES: 60
};

async function fetchAllRSS() {
  let allItems = [];
  for (let i = 1; i <= CONFIG.MAX_PAGES; i++) {
    const url = `${CONFIG.RSS_URL}?page=${i}`;
    console.log("🔹 Fetching", url);
    const res = await fetch(url);
    const xml = await res.text();
    if (!xml.includes("<item>")) break;

    const parsed = parseRSS(xml);
    allItems.push(...parsed);
  }
  return allItems;
}

function parseRSS(xml) {
  const items = [];
  const blocks = xml.split("<item>").slice(1);
  for (const block of blocks) {
    const title = getTag(block, "title");
    const link = getTag(block, "link");
    const desc = getTag(block, "description");
    const pubDate = getTag(block, "pubDate");
    const cats = [...block.matchAll(/<category>([\s\S]*?)<\/category>/g)]
      .map((m) => decodeCDATA(m[1]).trim())
      .filter(Boolean);
    items.push({ title, link, desc, cats, pubDate });
  }
  return items;
}

function getTag(xml, tag) {
  const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? decodeCDATA(m[1]) : "";
}

function decodeCDATA(s = "") {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

(async () => {
  const items = await fetchAllRSS();
  const output = {
    source: "syfine.tistory.com",
    total: items.length,
    updated: new Date().toISOString(),
    items
  };
  fs.writeFileSync("rss.json", JSON.stringify(output, null, 2));
  console.log(`✅ ${items.length} posts saved to rss.json`);
})();

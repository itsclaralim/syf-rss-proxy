import fs from 'fs';
import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

const BLOG_RSS = 'https://syfine.tistory.com/rss';
const MAX_PAGES = 60; // ✅ 페이지당 10개 → 최대 600개 게시물
const OUTPUT_FILE = 'rss.json';

const parser = new XMLParser({ ignoreAttributes: false });

async function fetchAll() {
  const all = [];
  for (let i = 1; i <= MAX_PAGES; i++) {
    const url = `${BLOG_RSS}?page=${i}`;
    console.log(`📡 Fetching page ${i} ...`);

    try {
      const res = await fetch(url);
      const xml = await res.text();

      if (!xml.includes('<item>')) break; // 페이지 없음 → 종료

      const parsed = parser.parse(xml);
      const items = parsed.rss.channel.item || [];

      // 배열 아닌 단일 아이템 처리
      const arr = Array.isArray(items) ? items : [items];

      for (const item of arr) {
        all.push({
          title: item.title,
          link: item.link,
          desc: item.description,
          cats: item.category ? (Array.isArray(item.category) ? item.category : [item.category]) : [],
          pub: item.pubDate
        });
      }
    } catch (err) {
      console.warn(`⚠️ Page ${i} fetch error:`, err);
      break;
    }
  }

  console.log(`✅ Total ${all.length} posts fetched`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(all, null, 2));
}

await fetchAll();

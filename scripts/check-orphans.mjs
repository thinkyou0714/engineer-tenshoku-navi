// orphan ページ検査(CI ゲート): dist/ の内部リンクグラフを辿り、トップページから
// 到達できない /guide/* 記事を検出する。到達不能な記事は検索エンジンにも読者にも
// 見つけられにくく、内部リンク配線の漏れを意味する。
// 使い方: node scripts/check-orphans.mjs [distDir=dist]
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2] || 'dist';

// dist の実ページ一覧(URL パス表現、base 込みの href と突き合わせる)
const pages = new Map(); // urlPath -> filePath
function walk(dir, rel = '') {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, rel + '/' + e.name);
    else if (e.name === 'index.html') pages.set(rel || '/', p);
    else if (e.name.endsWith('.html')) pages.set(rel + '/' + e.name.replace(/\.html$/, ''), p);
  }
}
walk(dist);

// base prefix はトップの canonical から導出(CI の内部リンク検査と同じ方式)
const rootHtml = fs.readFileSync(pages.get('/') ?? path.join(dist, 'index.html'), 'utf8');
const canon = rootHtml.match(/<link rel="canonical" href="([^"]+)"/)?.[1] ?? '';
const base = canon.replace(/^https?:\/\/[^/]+/, '').replace(/\/+$/, '');

const norm = (href) => {
  let h = href.split('#')[0].split('?')[0];
  if (base && h.startsWith(base)) h = h.slice(base.length);
  return h.replace(/\/+$/, '') || '/';
};

// BFS: トップから内部リンクを辿る
const seen = new Set();
const queue = ['/'];
while (queue.length) {
  const cur = queue.shift();
  if (seen.has(cur)) continue;
  seen.add(cur);
  const file = pages.get(cur);
  if (!file) continue;
  const html = fs.readFileSync(file, 'utf8');
  for (const m of html.matchAll(/<a [^>]*href="([^"]+)"/g)) {
    const href = m[1];
    if (/^https?:\/\//.test(href) || href.startsWith('#') || href.startsWith('mailto:')) continue;
    const target = norm(href);
    if (pages.has(target) && !seen.has(target)) queue.push(target);
  }
}

const orphans = [...pages.keys()].filter((p) => p.startsWith('/guide/') && !seen.has(p));
if (orphans.length) {
  for (const o of orphans) console.error('ORPHAN ' + o);
  console.error(`orphan check: ${orphans.length} unreachable /guide page(s) from the top page`);
  process.exit(1);
}
console.log(`orphan check OK: all ${[...pages.keys()].filter((p) => p.startsWith('/guide/')).length} /guide pages reachable from /`);

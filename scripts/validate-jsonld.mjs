// dist/ 内の全 <script type="application/ld+json"> を検証する CI ゲート。
// - JSON として parse できること
// - @graph 直下の各ノードに @type があること
// - Article は headline/datePublished/dateModified/author を持つこと
// - 方針違反の Review / AggregateRating が混入していないこと(実レビューなしでの使用禁止)
// 使い方: node scripts/validate-jsonld.mjs [distDir=dist]
import fs from 'node:fs';
import path from 'node:path';

const dist = process.argv[2] || 'dist';
let pages = 0;
let blocks = 0;
const errors = [];

function* htmlFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* htmlFiles(p);
    else if (e.name.endsWith('.html')) yield p;
  }
}

for (const file of htmlFiles(dist)) {
  pages++;
  const html = fs.readFileSync(file, 'utf8');
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) {
    blocks++;
    let data;
    try {
      data = JSON.parse(m[1]);
    } catch (e) {
      errors.push(`${file}: JSON parse error — ${e.message}`);
      continue;
    }
    const nodes = data['@graph'] ?? [data];
    for (const node of nodes) {
      if (!node || typeof node !== 'object') continue;
      const type = node['@type'];
      if (!type) {
        errors.push(`${file}: node without @type`);
        continue;
      }
      const types = Array.isArray(type) ? type : [type];
      if (types.some((t) => t === 'Review' || t === 'AggregateRating')) {
        errors.push(`${file}: forbidden ${types.join(',')} schema (site policy: no fabricated reviews)`);
      }
      if (types.includes('Article')) {
        for (const req of ['headline', 'datePublished', 'dateModified', 'author']) {
          if (!node[req]) errors.push(`${file}: Article missing "${req}"`);
        }
      }
      if (types.includes('FAQPage') && !(node.mainEntity?.length > 0)) {
        errors.push(`${file}: FAQPage with empty mainEntity`);
      }
    }
  }
}

if (errors.length) {
  for (const e of errors) console.error('NG ' + e);
  console.error(`JSON-LD validation: ${errors.length} error(s) across ${pages} pages`);
  process.exit(1);
}
console.log(`JSON-LD validation OK: ${blocks} blocks across ${pages} pages, 0 errors`);

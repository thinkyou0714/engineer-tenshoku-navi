// コンテンツ鮮度の監査(報告のみ・非ブロック)。updatedDate(なければ publishDate)が
// 一定期間より古い記事を「更新候補」として一覧する。週次運用でどの記事を追記・改稿
// するかの優先順位づけに使う(LLM/検索ともに新鮮なコンテンツを優先する傾向)。
// 使い方: node scripts/audit-freshness.mjs [postsDir=src/content/posts] [--months=N] [--asof=YYYY-MM-DD]
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--')) || 'src/content/posts';
const months = Number((args.find((a) => a.startsWith('--months=')) || '--months=6').split('=')[1]);
const asofArg = (args.find((a) => a.startsWith('--asof=')) || '').split('=')[1];
const asof = asofArg ? new Date(asofArg) : new Date();
const cutoff = new Date(asof);
cutoff.setMonth(cutoff.getMonth() - months);

const rows = [];
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.md')) continue;
  const fm = fs.readFileSync(path.join(dir, f), 'utf8').match(/^---\n([\s\S]*?)\n---/);
  if (!fm) continue;
  const pub = fm[1].match(/^publishDate:\s*['"]?([0-9-]+)/m)?.[1];
  const up = fm[1].match(/^updatedDate:\s*['"]?([0-9-]+)/m)?.[1];
  const effective = up || pub;
  if (!effective) continue;
  rows.push({ slug: f.replace(/\.md$/, ''), date: effective, updated: !!up, d: new Date(effective) });
}

rows.sort((a, b) => a.d - b.d);
const stale = rows.filter((r) => r.d < cutoff);

console.log(`freshness audit: ${rows.length} posts, asof=${asof.toISOString().slice(0, 10)}, threshold=${months}mo (cutoff ${cutoff.toISOString().slice(0, 10)})`);
if (stale.length) {
  for (const r of stale) {
    console.log(`  STALE ${r.date} ${r.updated ? '(updated)' : '(published)'} ${r.slug}`);
  }
  console.log(`\n${stale.length} 件が ${months} ヶ月以上更新なし。実際に改稿したら updatedDate を更新すること(鮮度偽装はしない)。`);
} else {
  console.log(`OK: すべての記事が直近 ${months} ヶ月以内。`);
}

// 内部リンクのアンカーテキスト多様性を監査する(報告のみ・非ブロック)。
// 同じ /guide/<slug> に対して完全一致のアンカーテキストが過度に集中していると、
// SEO 上の過剰最適化(exact-match anchor spam)と見なされるリスクがある。dofollow の
// 内部リンクが対象(offer: CTA は rel=sponsored nofollow なので対象外)。
// 使い方: node scripts/audit-anchors.mjs [postsDir=src/content/posts] [--max=N]
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv.find((a) => !a.startsWith('--') && a !== process.argv[0] && a !== process.argv[1]) || 'src/content/posts';
const MAX = Number((process.argv.find((a) => a.startsWith('--max=')) || '--max=6').split('=')[1]);

// slug -> Map(anchorText -> count)
const targets = new Map();
for (const f of fs.readdirSync(dir)) {
  if (!f.endsWith('.md')) continue;
  const body = fs.readFileSync(path.join(dir, f), 'utf8');
  for (const m of body.matchAll(/\[([^\]]+)\]\(\/guide\/([a-z0-9-]+)\)/g)) {
    const [, text, slug] = m;
    if (!targets.has(slug)) targets.set(slug, new Map());
    const c = targets.get(slug);
    c.set(text, (c.get(text) || 0) + 1);
  }
}

const warnings = [];
for (const [slug, counts] of [...targets].sort()) {
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  for (const [text, n] of counts) {
    if (n > MAX) {
      warnings.push(
        `/guide/${slug}: アンカー「${text}」が ${n} 回(全 ${total} 本中)— 表現を分散させると自然`
      );
    }
  }
}

console.log(`anchor audit: ${targets.size} internal targets, threshold=${MAX} identical anchors`);
if (warnings.length) {
  for (const w of warnings) console.log('  WARN ' + w);
  console.log(`\n${warnings.length} 件の過集中を検出(警告のみ。ビルドは失敗しません)。`);
} else {
  console.log('OK: 完全一致アンカーの過集中なし。');
}

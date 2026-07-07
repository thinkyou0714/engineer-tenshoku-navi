#!/usr/bin/env node
// IndexNow 送信スクリプト — dist/ のサイトマップから URL を集めて
// https://api.indexnow.org/indexnow に一括 POST する(Bing / Yandex 等が対応)。
// Node 18+ の標準機能のみ(fetch / fs)。追加依存なし。
//
// 使い方:
//   npm run build                                   # 先に dist/ を生成
//   INDEXNOW_KEY=<キー> node scripts/indexnow-submit.mjs
//   node scripts/indexnow-submit.mjs --dry-run      # 送信せず payload 表示のみ
//
// キーファイルの設置手順(初回のみ):
//   1. キーを生成する(8〜128文字の英数字。例: `openssl rand -hex 16`)。
//   2. `public/<KEY>.txt` を作成し、中身はキー文字列そのもの1行にする。
//      例: キーが `abc123` なら `public/abc123.txt` に `abc123` と書く。
//   3. npm run build → デプロイし、`<サイトURL>/<base>/<KEY>.txt` で
//      キー文字列が取得できることをブラウザで確認する。
//   4. 実行環境(ローカル .env / Vercel / CI)に環境変数 `INDEXNOW_KEY=<キー>` を設定。
//      keyLocation は sitemap の場所から自動導出(サブパス配信でも可)。
//      別の場所に置いた場合のみ `INDEXNOW_KEY_LOCATION=<フルURL>` で上書きできる。
//
// 挙動:
//   - INDEXNOW_KEY 未設定 → dry-run として payload を表示して正常終了(exit 0)。
//   - --dry-run 指定      → 同上(キー設定済みでも送信しない)。
//   - dist/ にサイトマップが無い → 分かりやすいエラーを出して exit 1。
//   - IndexNow API が 200/202 以外 → exit 1(CI で失敗を検知できる)。

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import process from 'node:process';

const DIST = resolve(process.cwd(), 'dist');
const ENDPOINT = 'https://api.indexnow.org/indexnow';
const DRY_RUN_FLAG = process.argv.includes('--dry-run');
const KEY = process.env.INDEXNOW_KEY || '';
const DRY_RUN = DRY_RUN_FLAG || !KEY;

/** <loc>...</loc> をすべて抜き出す(依存なしの素朴な抽出で十分)。 */
function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
}

async function collectUrls() {
  const indexPath = join(DIST, 'sitemap-index.xml');
  const zeroPath = join(DIST, 'sitemap-0.xml');

  if (!existsSync(indexPath) && !existsSync(zeroPath)) {
    console.error('エラー: dist/ に sitemap-index.xml / sitemap-0.xml が見つかりません。');
    console.error('先に `npm run build` を実行してから再実行してください。');
    process.exit(1);
  }

  // sitemap-index.xml があれば、そこに列挙された sitemap をローカルの同名ファイルで読む。
  // 無ければ sitemap-0.xml を直接読む。
  let sitemapFiles = [];
  let sitemapBaseUrl = ''; // keyLocation 導出用(sitemap が置かれている URL ディレクトリ)
  if (existsSync(indexPath)) {
    const indexXml = await readFile(indexPath, 'utf8');
    for (const loc of extractLocs(indexXml)) {
      const basename = loc.split('/').pop();
      if (!sitemapBaseUrl) sitemapBaseUrl = loc.slice(0, loc.length - basename.length);
      const local = join(DIST, basename);
      if (existsSync(local)) sitemapFiles.push(local);
      else console.error(`警告: ${loc} に対応するローカルファイル dist/${basename} が無いためスキップ。`);
    }
  }
  if (sitemapFiles.length === 0 && existsSync(zeroPath)) sitemapFiles = [zeroPath];

  const urls = [];
  for (const file of sitemapFiles) {
    const xml = await readFile(file, 'utf8');
    urls.push(...extractLocs(xml));
  }
  return { urls: [...new Set(urls)], sitemapBaseUrl };
}

async function main() {
  const { urls, sitemapBaseUrl } = await collectUrls();

  if (urls.length === 0) {
    console.error('エラー: サイトマップから URL を1件も抽出できませんでした。dist/ の内容を確認してください。');
    process.exit(1);
  }

  const host = new URL(urls[0]).host;
  const key = KEY || '<INDEXNOW_KEY 未設定>';
  const keyLocation =
    process.env.INDEXNOW_KEY_LOCATION ||
    `${sitemapBaseUrl || new URL(urls[0]).origin + '/'}${key}.txt`;

  const payload = { host, key, keyLocation, urlList: urls };

  if (DRY_RUN) {
    const reason = DRY_RUN_FLAG ? '--dry-run 指定' : 'INDEXNOW_KEY 未設定';
    console.log(`[dry-run: ${reason}] 送信せず payload を表示します (${urls.length} URLs):`);
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n実送信するには: INDEXNOW_KEY=<キー> node scripts/indexnow-submit.mjs');
    return;
  }

  console.log(`IndexNow へ ${urls.length} URLs を送信します (host: ${host})...`);
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  });

  // IndexNow の成功は 200 (OK) / 202 (Accepted)。それ以外は失敗として非0終了。
  if (res.status === 200 || res.status === 202) {
    console.log(`OK: HTTP ${res.status} — 送信完了。反映はエンジン側のクロール次第(即時保証なし)。`);
    return;
  }
  const body = await res.text().catch(() => '');
  console.error(`エラー: HTTP ${res.status} ${res.statusText}`);
  if (body) console.error(body.slice(0, 500));
  console.error('ヒント: 403/422 はキーファイル(<KEY>.txt)が公開URLに無い/内容不一致が典型要因。');
  process.exit(1);
}

main().catch((err) => {
  console.error('エラー:', err && err.message ? err.message : err);
  process.exit(1);
});

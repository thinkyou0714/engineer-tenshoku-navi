# エンジニア転職ナビ — 静的サイト

エンジニア/IT転職の比較・選び方を **事実ベース** で解説するアフィリエイト情報サイト。
[Astro](https://astro.build) の静的サイト（zero-JS）。コンプライアンス（景表法/ステマ規制、`rel="sponsored"`、
開示）と真正性（捏造レビュー・架空体験談を作らない）を設計段階で組み込み済み。

`affiliate-ops` スキルで作ったニッチキット（7記事・lint済）を、デプロイ可能なサイトに反映したものです。

## 技術スタック
- Astro 6（content collections + Zod スキーマ。Node 22.12+）
- `@astrojs/sitemap`（`lastmod` 連携済み） / `@astrojs/rss`
- `rehype-external-links`（全外部リンクに `rel="sponsored nofollow noopener"` を自動付与）
- `astro-og-canvas`（記事ごとの OG 画像を日本語フォント同梱でビルド時生成）

## クイックスタート
```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # → dist/（静的HTML）
npm run preview
```

## 公開までにやること（プレースホルダを埋める）
1. **アフィリエイトリンク**: 記事内のCTAは `[テキスト](offer:<id>)` 形式で、実体は
   `src/data/offers.mjs` に一元管理。ASP承認後に該当オファーの `url` を記入するか、
   環境変数 `OFFER_URL_<ID>`（例: `OFFER_URL_LEVTECH`。Vercel で設定可・env が優先）を設定して
   ビルドすると**全記事のCTAが一括で実リンク化**されます（未設定の間は `#` のまま）。
   → 外部リンクは **自動で `rel="sponsored nofollow"`** が付きます（Google要件）。
   運用手順の全体像（ドメイン移行→ASP申請→リンク挿入→週次KPI）は [docs/OPERATIONS.md](./docs/OPERATIONS.md)。
2. **運営者情報（E-E-A-T）**: `src/data/site.ts` の `author`（氏名・経歴・`sameAs`）を **実在の情報** に置換。
   **捏造はしない**（経歴が無ければ「比較・調査ベース」のまま）。
3. **ドメイン移行**(任意): 環境変数 `SITE_URL=https://ドメイン` + `SITE_BASE=`(空) を設定するだけ
   (`src/data/site.ts` は自動追従、canonical/sitemap/内部リンク/robots.txt もビルド時に切替)。
4. **アクセス解析**(任意): `PUBLIC_GA_ID=G-XXXXXXXXXX` を設定すると**同意制のGA4**が有効化(未設定なら解析なし・バナーも非表示)。`.env.example` 参照。
5. **実体験**: 本当の利用経験ができたら本文に追記し、frontmatter の `updatedDate` を更新する(架空体験は書かない)。
6. 公開前に `npm run build` + 下記コンプラチェック + **人間の最終目視**。

## ディレクトリ
```
src/
  content/posts/*.md       # 記事（frontmatter: title/description/kind/publishDate/faq...）
  content.config.ts        # Zod スキーマ
  data/site.ts             # サイト全体設定（名前/著者/組織/開示文）
  utils/schema.ts          # JSON-LD ビルダー（Article/Breadcrumb/FAQPage/Person/Organization）
  layouts/                 # BaseLayout / ArticleLayout
  components/              # Disclosure / AffiliateLink / AuthorBox / Breadcrumb / Header / Footer / ...
  pages/                   # index / guide/[slug] / shindan(診断) / og/(OG画像) / 404 / rss.xml / robots.txt / llms.txt / about / ...
  data/offers.mjs          # アフィリオファーの一元レジストリ（ASP承認後はここに URL 記入）
  assets/fonts/            # OG画像用 Noto Sans JP（SIL OFL 1.1、OFL.txt 同梱）
scripts/compliance-lint.py # コンプラ linter（CI gate で使用、vendored）
scripts/indexnow-submit.mjs# IndexNow 送信（dist/ の sitemap から URL 抽出。--dry-run 対応）
scripts/validate-jsonld.mjs / check-orphans.mjs / gen-icons.mjs  # CI 検査・アイコン生成
docs/OPERATIONS.md         # 収益化ランブック（ドメイン移行 / ASP申請 / リンク挿入 / 週次KPI）
public/                    # favicon.svg / apple-touch-icon.png / logo.png / ads.txt / .well-known/security.txt
```
※ robots.txt / llms.txt / sitemap / OG画像はビルド時に自動生成されます（ドメイン移行に自動追従）。

## 記事を追加する
`src/content/posts/<slug>.md` を作成（`drafts/_TEMPLATE-article.md` 相当の frontmatter）。
`kind: cluster`、`/guide/<slug>` で公開、ピラーから内部リンクを張る。`faq:` に Q&A を入れると FAQPage 構造化データが付きます。

## コンプライアンス（このサイトの前提）
- 全ページ上部に広告開示バナー + `/affiliate-policy` / `/disclosures`。
- 外部/アフィリリンクに `rel="sponsored nofollow"`（rehype が自動付与）。
- **Review/AggregateRating 構造化データは使わない**（実レビュー無しでの使用はペナルティリスク）。
- 「必ず/No.1/100%」等の断定をしない（`compliance-lint.py` で検出）。求職者無料を明記。
- 機械チェックは補助。**最終ゲートは人間の目視**。本サイトは法的助言ではありません。

## CI（`.github/workflows/ci.yml`）
push/PR で実行: ① `compliance-lint.py` で `検出数: 0` を必須 ② `astro check`(型・0エラー)
③ `npm run build` ④ 外部リンクの `rel=sponsored` 検査 ⑤ JSON-LD 機械検証(Review/AggregateRating
禁止ゲート含む) ⑥ orphan ページ検査 ⑦ `/guide/*` 内部リンクの存在検査(base は canonical から自動導出)。
いずれか失敗で CI が落ちます。加えて週次で外部リンク死活チェック(`link-check.yml`、失敗時 Issue 起票)。

ローカルで(Node **22.12+** が必要。Astro 6 の要件):
```bash
python3 scripts/compliance-lint.py --root src/content/posts   # 検出数: 0 を確認
npx astro check && npm run build
node scripts/validate-jsonld.mjs dist && node scripts/check-orphans.mjs dist
npm run audit   # アンカーテキスト過集中 + コンテンツ鮮度の助言(非ブロック)
```

新しい記事は `drafts/_TEMPLATE-article.md` をコピーして書き始めると、frontmatter・
コンプラチェックリスト・CTA/内部リンクの雛形が揃っています。

## デプロイ
- **GitHub Pages（現在の公開先）**: `main` への push で `.github/workflows/deploy.yml`（`withastro/action`）が
  自動ビルド・公開。ライブURL: `https://thinkyou0714.github.io/engineer-tenshoku-navi/`。
  base path 対応済み（`astro.config.mjs` の `base`、内部リンク/canonical/sitemap すべて base-aware）。
- **独自ドメイン / Vercel（本番推奨）に移行する場合**:
  1. 環境変数 `SITE_URL=https://本番ドメイン` と `SITE_BASE=`（空）を設定するだけ
     （canonical / sitemap / 内部リンク / robots.txt / llms.txt / OG画像URL / CI 検査まで自動追従）。
  2. Vercel に import（`vercel.json` でセキュリティヘッダ + CSP 付与。GitHub Pages はレスポンスヘッダ
     非対応のため、これらのヘッダは Vercel 配信時のみ有効）。
- 任意の静的ホスト: `npm run build` の `dist/` を配信。

将来の改善は [ROADMAP.md](./ROADMAP.md)。

## Claude Code で開発する (web / cloud 対応)

このリポジトリは **Claude Code on the web** に対応しています。

- 依存は `.claude/bootstrap.sh`（SessionStart フック）が `npm ci` で自動インストール。
- クラウドセッションは `AGENTS.md` と `.claude/skills/`（例: `build-site`）を自動ロード。
- MCP は本リポジトリではローカル専用。詳細は
  [`.github/docs/claude-code-web-readiness.md`](https://github.com/thinkyou0714/.github/blob/main/docs/claude-code-web-readiness.md)。

## License

MIT — see [LICENSE](./LICENSE).

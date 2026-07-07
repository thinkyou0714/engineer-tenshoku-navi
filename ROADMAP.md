# ROADMAP — 改善バックログ（100アイデア深堀の蒸留）

静的サイトのベストプラクティスを ~100 アイデア調査し（SEO/構造化データ/内部リンク/性能/a11y/コンプラ/計測等）、
**v1で実装済み** と **次以降（未実装）** に整理。数値・規制は2026年6月時点で要確認。

## v1 実装済み（Tier-now）
- Astro content collections（Zod）+ 7記事（ピラー1 + クラスタ6、lint済）。
- SEO: title/description/canonical/robots、OGP/Twitter card、`@astrojs/sitemap`、`@astrojs/rss`、`robots.txt`。
- 構造化データ: Article / BreadcrumbList / FAQPage / Person(著者) / Organization / WebSite（JSON-LD）。
  **Review/AggregateRating は意図的に不採用**（実レビュー無しでの使用はリスク）。
- コンプラ: 全ページ開示バナー + `/affiliate-policy` `/disclosures`、外部リンク `rel="sponsored nofollow"`（rehype 自動）。
- 著者 E-E-A-T: `/about` の Person schema（誠実な編集部、実績はプレースホルダ）。
- アクセシビリティ: セマンティックHTML、見出し階層、skip link、フォーカス可視、テーブル `<th scope>`、コントラスト配慮。
- 性能: Astro zero-JS 静的HTML、system フォント。
- CI gate: compliance-lint（検出数:0 必須）+ build + 外部リンク rel=sponsored 検査 + 内部リンク存在検査。
- セキュリティヘッダ（`vercel.json`: HSTS/X-Content-Type-Options/Referrer-Policy/X-Frame-Options/Permissions-Policy）。

## Phase 2 実装済み (2026-06-13)
- 記事 7 → **12本**(30代/40代ハイクラス/年収交渉/職務経歴書/スクール選び)。
- **関連記事**(各記事末・内部リンク)・**目次は将来**。
- **GA4(同意制 opt-in)**: `PUBLIC_GA_ID` 設定時のみ、同意後に読込。privacy.astro 反映。
- **env 駆動の base/site**: `SITE_URL`/`SITE_BASE` でドメイン移行が2環境変数(site.ts 自動追従)。

## Phase 3 実装済み (2026-07-07)
- **オファーレジストリ** (`src/data/offers.mjs`): 記事内 `[テキスト](offer:<id>)` → ビルド時に実URL解決。
  ASP承認後は `url` 記入 or 環境変数 `OFFER_URL_<ID>` の**1箇所で全CTAが実リンク化**(未設定なら `#` のまま)。
- **アフィリクリック計測**: GA4 `affiliate_click` イベント(`offer_id` / `link_url` / `active`)。同意後のみ・承認前クリックも需要計測可。
- **CRO**: 診断ページ `/shindan`(自分ごと化 → 該当記事へ誘導)。
- **記事内 TOC**(`Toc.astro`)+ 比較表の **ItemList 構造化データ**。
- **記事 12 → 20本**(高intent 8本追加: doda/Geekly/フリーランス比較 等)。
- **IndexNow 送信スクリプト** (`scripts/indexnow-submit.mjs`): dist/ の sitemap から URL 抽出 → api.indexnow.org へ POST。
  `INDEXNOW_KEY` 未設定 or `--dry-run` で非破壊確認。
- **収益化ランブック** (`docs/OPERATIONS.md`): ドメイン移行 → ASP申請 → リンク挿入 → 週次KPI運用の手順書。

## 次以降（Tier-next・未実装）
| テーマ | アイデア | 目安 Impact/Effort |
|---|---|---|
| SEO | 記事ごとの OG 画像（1200×630）自動生成、`updatedDate` の sitemap lastmod 連携（git timestamp） | 4/2 |
| 構造化データ | `HowTo`(該当時)。※比較表の `ItemList` は Phase 3 で済 | 2/2 |
| 内部リンク | 関連記事サイドバー、orphan/アンカー多様性の自動監査。※目次(TOC)は Phase 3 で済 | 4/2-3 |
| 性能 | 画像導入時の `<Image>`(AVIF/WebP)・font preload、Lighthouse CI | 4/2-3 |
| コンプラ | CSP ヘッダ（JSON-LD/インラインに配慮した設計）、`ads.txt` | 3/2 |
| 配信 | Search Console 連携・サイトマップ送信。※IndexNow push は Phase 3 で済（`scripts/indexnow-submit.mjs`） | 3/1-2 |
| コンテンツ | 競合SERP差分、コンテンツ更新サイクル。※残クラスタ(30代/40代/職務経歴書/年収交渉/診断)は Phase 2–3 で済 | 4/3 |
| CRO | A/Bテストログ。※診断コンテンツ(/shindan)は Phase 3 で済 | 4/3 |
| 運用 | rank tracker(API)、リンク切れ定期監査、編集カレンダー | 3/3 |
| 国際化 | i18n / hreflang（英語展開する場合） | 2/3 |
| ドメイン | 独自ドメイン取得 + 301、ブランド整備（手順は `docs/OPERATIONS.md` §1-1） | 3/1 |

## 不採用（理由つき）
- **AI生成コンテンツの自動量産**: 真正性ポリシーと衝突。雛形+人間/事実比較に留める。
- **Review/AggregateRating の自動付与**: 実レビュー無しは不可。
- **アフィリリンクのクローキング(301)**: Google解釈の混乱・Amazon TOS抵触。必要時は 307 か明示。

> 出典(抜粋): Astro Docs / Google「rel=sponsored」ガイド / 消費者庁 景表法・ステマ規制 / schema.org / Core Web Vitals 2026 /
> @astrojs/sitemap・rss。すべて2026年6月時点・要確認。本書は実務ガイドであり法的助言ではありません。

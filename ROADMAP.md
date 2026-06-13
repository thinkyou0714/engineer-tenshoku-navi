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

## 次以降（Tier-next・未実装）
| テーマ | アイデア | 目安 Impact/Effort |
|---|---|---|
| 計測 | GA4 + Cookie 同意バナー（同意後ロード）、アフィリクリックをイベント計測 | 4/3 |
| SEO | 記事ごとの OG 画像（1200×630）自動生成、`updatedDate` の sitemap lastmod 連携（git timestamp） | 4/2 |
| 構造化データ | 比較表の `ItemList`、`HowTo`(該当時) | 2/2 |
| 内部リンク | 関連記事サイドバー、目次(TOC)、orphan/アンカー多様性の自動監査 | 4/2-3 |
| 性能 | 画像導入時の `<Image>`(AVIF/WebP)・font preload、Lighthouse CI | 4/2-3 |
| コンプラ | CSP ヘッダ（JSON-LD/インラインに配慮した設計）、`ads.txt` | 3/2 |
| 配信 | IndexNow（Bing/Yandex）push、Search Console 連携・サイトマップ送信 | 3/1-2 |
| コンテンツ | 残クラスタ(30代/40代/職務経歴書/年収交渉/診断)、競合SERP差分、コンテンツ更新サイクル | 4/3 |
| CRO | 年収診断などの自分ごと化コンテンツ、A/Bテストログ | 4/3 |
| 運用 | rank tracker(API)、リンク切れ定期監査、編集カレンダー | 3/3 |
| 国際化 | i18n / hreflang（英語展開する場合） | 2/3 |
| ドメイン | 独自ドメイン取得 + 301、ブランド整備 | 3/1 |

## 不採用（理由つき）
- **AI生成コンテンツの自動量産**: 真正性ポリシーと衝突。雛形+人間/事実比較に留める。
- **Review/AggregateRating の自動付与**: 実レビュー無しは不可。
- **アフィリリンクのクローキング(301)**: Google解釈の混乱・Amazon TOS抵触。必要時は 307 か明示。

> 出典(抜粋): Astro Docs / Google「rel=sponsored」ガイド / 消費者庁 景表法・ステマ規制 / schema.org / Core Web Vitals 2026 /
> @astrojs/sitemap・rss。すべて2026年6月時点・要確認。本書は実務ガイドであり法的助言ではありません。

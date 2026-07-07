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

## Phase 4 実装済み (2026-07-07・バグ根本修正 + 100アイデア再深堀)
- **バグ根本修正**: rss.xml channel link の base 欠落 / pending CTA の "#" ジャンプ /
  CI 内部リンク検査のドメイン移行後 no-op 化 / robots.txt の URL ハードコード(ビルド時生成へ) /
  compliance-lint の参照切れ / Footer 年号 / Organization schema の logo 404。
- **セキュリティ**: Astro 5.18→**6.4.8** + esbuild override で npm audit **0件**(6アドバイザリ全解消)。
  内部実装依存のキャッシュ削除 hack を撤去し `astro build --force` に一本化。dependabot.yml 新設。
- **SEO**: 記事ごとの **OG画像自動生成**(astro-og-canvas + Noto Sans JP 同梱)、favicon/apple-touch-icon/
  logo.png、sitemap **lastmod**(updatedDate 連携)、article:published_time/modified_time、theme-color。
- **AI検索(2026)**: **llms.txt** をビルド時自動生成。
- **内部リンク**: 記事 `tags` + 関連記事の共有タグスコアリング(全記事同一リストを解消)。
- **CI強化**: `astro check`(型・0エラー)、JSON-LD 機械検証(Review/AggregateRating 禁止ゲート含む)、
  orphan ページ検査、週次外部リンク死活チェック(Issue 起票)、PR テンプレート。
- **CRO/UX**: 404 に人気ページ導線、prefetch(hover)、pending CTA の aria-disabled +(準備中)表示。
- **配信**: CSP ヘッダ(Vercel 用)、.well-known/security.txt、ads.txt プレースホルダ。
- **記事衛生**: TODO(実体験) コメント全削除(公開HTMLに漏れていた)、実改稿4記事のみ updatedDate 付与。

## 次以降（Tier-next・未実装）
| テーマ | アイデア | 目安 Impact/Effort |
|---|---|---|
| 構造化データ | `HowTo`(該当時) | 2/2 |
| 内部リンク | アンカーテキスト多様性の自動監査 | 3/2 |
| 性能 | 画像導入時の `<Image>`(AVIF/WebP)・font preload | 4/2-3 |
| 配信 | Search Console 連携・サイトマップ送信(人間の初回設定が必要) | 3/1-2 |
| コンテンツ | 競合SERP差分、コンテンツ更新サイクル | 4/3 |
| CRO | A/Bテストログ | 4/3 |
| 運用 | rank tracker(API)、編集カレンダー | 3/3 |
| ドメイン | 独自ドメイン取得 + 301、ブランド整備（手順は `docs/OPERATIONS.md` §1-1） | 3/1 |

## 不採用（理由つき）
- **タグアーカイブページ**: 記事20本では thin content 化・重複リスク。30本超で再検討。
- **サイト内検索**: 20ページ規模では費用対効果が低い(関連記事タグで代替)。
- **View Transitions / ClientRouter**: zero-JS 方針と衝突し収益寄与なし。
- **Lighthouse CI 常設**: 静的極小サイトに恒常CIは過剰。手動実行を OPERATIONS §3 に記載。
- **i18n / hreflang**: 単一言語サイトのため不要(英語展開時に再検討)。
- **Astro 7.0.6(2026-07時点)**: コンパイラRust化+markdownパイプライン刷新の直後で、自作 rehype
  3本が生命線の本サイトには時期尚早。6.4.8 で脆弱性は全解消済み。Sätteri 安定後に移行。
- **updatedDate の全記事一括付与**: 実改稿なしの日付更新は鮮度偽装 = 真正性ポリシー違反。
- **AI生成コンテンツの自動量産**: 真正性ポリシーと衝突。雛形+人間/事実比較に留める。
- **Review/AggregateRating の自動付与**: 実レビュー無しは不可。
- **アフィリリンクのクローキング(301)**: Google解釈の混乱・Amazon TOS抵触。必要時は 307 か明示。

> 出典(抜粋): Astro Docs / Google「rel=sponsored」ガイド / 消費者庁 景表法・ステマ規制 / schema.org / Core Web Vitals 2026 /
> @astrojs/sitemap・rss。すべて2026年6月時点・要確認。本書は実務ガイドであり法的助言ではありません。

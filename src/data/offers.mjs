// アフィリエイトオファーの一元管理。
//
// プレーン ESM (.mjs) にしている理由: astro.config.mjs(Node 実行)と
// .astro / .ts(Vite 実行)の両方から同じファイルを import できるようにするため。
//
// 運用フロー:
//   1. ASP(A8.net / バリューコマース等)で提携申請 → 承認を待つ
//   2. 承認後、下の該当オファーの `url` にアフィリエイトリンク(実URL)を記入する
//      (またはビルド時に環境変数 OFFER_URL_<ID> を設定する。環境変数が優先される。
//       ただし空文字の環境変数は「未設定」と同義で、offers.mjs の url にフォールバックする)
//   3. npm run build するだけで、全記事の `offer:<id>` CTA が実リンク化される
//
// 記事側の書き方: markdown 内で [CTAテキスト](offer:<id>) と書く。
// URL が未設定(ペンディング)の間は href="#" のままビルドされ、見た目は変わらない。

/**
 * @typedef {Object} Offer
 * @property {string} id      オファーの一意ID。記事内の `offer:<id>` および
 *                            環境変数 OFFER_URL_<IDを大文字化・ハイフン→アンダースコア> に対応する。
 * @property {string} name    サービスの正式名称(表示・管理用)。
 * @property {string} cta     記事内で使う標準CTAテキスト(移行時のアンカーテキストの目安)。
 * @property {string} note    CTA横に付ける表記(PR表記・無料であることの明示)。景表法/ステマ規制対応のため削除しない。
 * @property {string} url     アフィリエイトリンクの実URL。★ASP承認後にここへ実URLを記入★
 *                            空文字の間はペンディング扱い(href="#" のまま公開される)。
 * @property {string} article このオファーの主戦場となる記事 slug(管理用メモ)。
 *                            並行作業中でまだ存在しない slug もあるため、存在チェックはしない。
 * @property {string[]} tags  オファーの分類タグ(集計・出し分け用)。
 */

/** @type {Offer[]} */
export const OFFERS = [
  { id: 'levtech', name: 'レバテックキャリア', cta: 'レバテックキャリアに相談', note: 'PR/相談無料', url: '', article: 'cluster-levtech-hyoban', tags: ['agent', 'specialized'] },
  { id: 'bizreach', name: 'ビズリーチ', cta: 'ビズリーチに登録', note: 'PR/無料登録', url: '', article: 'cluster-bizreach-highclass', tags: ['scout', 'highclass'] },
  { id: 'doda', name: 'doda', cta: 'dodaに登録', note: 'PR/無料登録', url: '', article: 'cluster-doda-engineer', tags: ['general'] },
  { id: 'geekly', name: 'Geekly', cta: 'Geeklyに相談', note: 'PR/相談無料', url: '', article: 'cluster-geekly-hyoban', tags: ['agent', 'specialized'] },
  { id: 'levtech-freelance', name: 'レバテックフリーランス', cta: 'レバテックフリーランスに相談', note: 'PR/相談無料', url: '', article: 'cluster-freelance-vs-seishain', tags: ['freelance'] },
];

/**
 * id からオファーを引く。
 * @param {string} id オファーID(例: 'levtech')
 * @returns {Offer | undefined} 見つからなければ undefined
 */
export function getOffer(id) {
  return OFFERS.find((o) => o.id === id);
}

/**
 * オファーの実URLを解決する。
 * 優先順位: 環境変数 OFFER_URL_<ID> > offer.url > ''(空文字 = ペンディング)。
 * 空文字の環境変数は「未設定」と同義に扱う(offer.url へフォールバック)。
 * 例: id 'levtech-freelance' → 環境変数 OFFER_URL_LEVTECH_FREELANCE
 * @param {Offer} offer
 * @returns {string} 実URL。未設定なら空文字。
 */
export function offerUrl(offer) {
  const envKey = 'OFFER_URL_' + offer.id.toUpperCase().replace(/-/g, '_');
  return process.env[envKey] || offer.url || '';
}

/**
 * オファーがアクティブ(実URLが設定済み)かどうか。
 * @param {Offer} offer
 * @returns {boolean} offerUrl が空でなければ true
 */
export function isOfferActive(offer) {
  return offerUrl(offer) !== '';
}

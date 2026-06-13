// Single source of site-wide config. Replace placeholders before launch.
export const SITE = {
  name: 'エンジニア転職ナビ',
  tagline: 'エンジニア/IT転職の比較・選び方を、事実ベースで',
  description:
    'エンジニア・IT職の転職エージェント/スカウトを、成果条件・対象者・特徴で中立に比較。誇大表現や偽レビューを使わず、公式情報と公開データで選び方を解説します。',
  // TODO: replace with your real domain (Vercel/own). Must match astro.config `site`.
  url: 'https://engineer-tenshoku-navi.vercel.app',
  lang: 'ja',
  locale: 'ja_JP',
  author: {
    id: 'henshubu',
    name: '編集部',
    // 実在の経歴・資格があれば置き換える。捏造はしない。
    jobTitle: '編集部(比較・調査担当)',
    bio: '本サイトは特定個人の体験談ではなく、各社の公式情報と公開データに基づく比較・調査で構成しています。',
    // 実在のプロフィールのみ(例: 'https://x.com/...')。無ければ空のまま。
    sameAs: [] as string[],
  },
  organization: {
    name: 'エンジニア転職ナビ編集部',
    // logo はプレースホルダ。実ロゴを public/ に置いて差し替え。
    logo: '/logo.png',
  },
  // 開示文(景表法/ステマ規制)。サイト全体のバナーと各ページで使用。
  disclosure:
    '本サイトはアフィリエイト広告を含みます。紹介により手数料を受け取ることがありますが、手数料の有無は紹介順位に影響しません。',
};

export type Faq = { q: string; a: string };
export type Crumb = { name: string; url?: string };

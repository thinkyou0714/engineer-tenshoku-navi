// 記事ごとの OG 画像(1200×630 PNG)をビルド時に自動生成する。
// - 全記事 + default(記事以外のページ用)を /og/<slug>.png として出力
// - フォントは同梱の Noto Sans JP(SIL OFL 1.1、src/assets/fonts/)のみを使用し、
//   ビルドはネットワーク非依存・決定的
// - BaseHead.astro が og:image / twitter:image でこの URL を参照する
import { OGImageRoute } from 'astro-og-canvas';
import { getCollection } from 'astro:content';
import { SITE } from '../../data/site';

const posts = await getCollection('posts', ({ data }) => !data.draft);

const pages: Record<string, { title: string; description: string }> = Object.fromEntries(
  posts.map((p) => [p.id, { title: p.data.title, description: p.data.description }])
);
pages['default'] = { title: SITE.name, description: SITE.tagline };

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page: (typeof pages)[string]) => ({
    title: page.title,
    description: page.description,
    // サイトのアクセント(#1f6feb)→濃紺のグラデーション。文字は白。
    bgGradient: [
      [31, 111, 235],
      [17, 42, 95],
    ],
    border: { color: [255, 255, 255], width: 12, side: 'inline-start' as const },
    padding: 72,
    font: {
      title: {
        families: ['Noto Sans JP'],
        weight: 'Bold' as const,
        size: 56,
        lineHeight: 1.3,
        color: [255, 255, 255],
      },
      description: {
        families: ['Noto Sans JP'],
        size: 30,
        lineHeight: 1.5,
        color: [214, 226, 251],
      },
    },
    fonts: [
      './src/assets/fonts/NotoSansJP-Bold.otf',
      './src/assets/fonts/NotoSansJP-Regular.otf',
    ],
  }),
});

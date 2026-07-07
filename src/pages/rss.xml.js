import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../data/site';

export async function GET() {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return rss({
    title: SITE.name,
    description: SITE.description,
    // context.site はオリジンのみ(base パスを含まない)ため、channel <link> が
    // サブパス配信でルートを指してしまう。origin+base を導出済みの SITE.url を使う。
    site: SITE.url,
    items: posts
      .sort((a, b) => +b.data.publishDate - +a.data.publishDate)
      .map((p) => ({
        title: p.data.title,
        description: p.data.description,
        pubDate: p.data.publishDate,
        link: `${SITE.url}/guide/${p.id}`,
      })),
  });
}

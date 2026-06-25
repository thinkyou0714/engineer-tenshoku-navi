import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../data/site';
import { getBaseUrl } from '../utils/env';

export async function GET(context) {
  const posts = await getCollection('posts', ({ data }) => !data.draft);
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site,
    items: posts
      .sort((a, b) => +b.data.publishDate - +a.data.publishDate)
      .map((p) => ({
        title: p.data.title,
        description: p.data.description,
        pubDate: p.data.publishDate,
        link: `${getBaseUrl()}/guide/${p.id}`,
      })),
  });
}

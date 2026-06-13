// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

// Production: replace `site` with your real domain (Vercel/own).
// On a custom domain (root path) no `base` is needed.
export default defineConfig({
  site: 'https://engineer-tenshoku-navi.vercel.app',
  output: 'static',
  integrations: [sitemap()],
  markdown: {
    // Every external (http/https) link gets rel="sponsored nofollow noopener" + target=_blank.
    // This is the Google requirement for affiliate links — so when you replace the (#) CTA
    // placeholders with real affiliate URLs, they become compliant automatically.
    rehypePlugins: [
      [
        rehypeExternalLinks,
        { rel: ['sponsored', 'nofollow', 'noopener'], target: '_blank' },
      ],
    ],
  },
});

// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';
import { createRehypeBaseLinks } from './src/plugins/rehype-base-links.ts';

// Deploy target is env-driven, so moving to a custom domain / Vercel is 2 env vars:
//   GitHub Pages (default): SITE_URL unset, SITE_BASE unset
//   Vercel / custom domain (root): SITE_URL=https://your-domain  SITE_BASE=""
// src/data/site.ts derives origin/base/url from these automatically.
const SITE_URL = process.env.SITE_URL ?? 'https://thinkyou0714.github.io';
const BASE = process.env.SITE_BASE ?? '/engineer-tenshoku-navi';

const rehypeBaseLinks = createRehypeBaseLinks(BASE);

export default defineConfig({
  site: SITE_URL,
  base: BASE,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
  markdown: {
    // base-prefix internal links first, then mark external links sponsored.
    rehypePlugins: [
      rehypeBaseLinks,
      [
        rehypeExternalLinks,
        { rel: ['sponsored', 'nofollow', 'noopener'], target: '_blank' },
      ],
    ],
  },
});

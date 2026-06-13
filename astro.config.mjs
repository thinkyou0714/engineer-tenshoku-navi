// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';

// Deploy target: GitHub Pages project site → served under a base path.
//   live (preview): https://thinkyou0714.github.io/engineer-tenshoku-navi
// To move to a custom domain / Vercel (root path): set BASE = '/', set `site`
// to your domain, and update src/data/site.ts + public/robots.txt to match.
const BASE = '/engineer-tenshoku-navi';

// Prefix root-relative markdown links (e.g. /guide/foo) with the base path so they
// resolve correctly under the Pages subpath. (Astro does not rewrite markdown links.)
function rehypeBaseLinks() {
  const walk = (node) => {
    if (node && node.tagName === 'a' && node.properties) {
      const h = node.properties.href;
      if (typeof h === 'string' && h.startsWith('/') && !h.startsWith(BASE + '/') && h !== BASE) {
        node.properties.href = BASE + h;
      }
    }
    if (node && node.children) node.children.forEach(walk);
  };
  return (tree) => walk(tree);
}

export default defineConfig({
  site: 'https://thinkyou0714.github.io',
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

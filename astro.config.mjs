// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';
import { loadEnv } from 'vite';
import { getOffer, offerUrl, isOfferActive } from './src/data/offers.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

// Merge .env(.production) values into process.env BEFORE anything below reads it.
// Astro injects .env into import.meta.env only at page-render time, so without this
// merge, OFFER_URL_* / SITE_URL written in a .env file would apply to .astro pages
// but NOT to markdown CTA rendering (content sync) — a silent half-applied build.
{
  const fileEnv = loadEnv(process.env.NODE_ENV ?? 'production', ROOT, '');
  for (const [k, v] of Object.entries(fileEnv)) {
    if (!(k in process.env)) process.env[k] = v;
  }
}

// Sitemap <lastmod>: map each post slug to updatedDate ?? publishDate, read from the
// markdown frontmatter at config-load time (the sitemap integration has no access to
// content collections). Non-post pages get no lastmod (better than a fake one).
function loadPostLastmods() {
  /** @type {Map<string, string>} */
  const map = new Map();
  const dir = path.join(ROOT, 'src', 'content', 'posts');
  for (const f of fs.readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const fm = fs.readFileSync(path.join(dir, f), 'utf8').match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const up = fm[1].match(/^updatedDate:\s*['"]?([0-9-]+)/m);
    const pub = fm[1].match(/^publishDate:\s*['"]?([0-9-]+)/m);
    const d = (up && up[1]) || (pub && pub[1]);
    if (d) map.set(f.replace(/\.md$/, ''), new Date(d).toISOString());
  }
  return map;
}
const POST_LASTMODS = loadPostLastmods();

// NOTE: Astro's content-layer cache keys rendered post HTML by the markdown digest,
// so offer URL / rehype-plugin changes would not re-render cached posts. `npm run
// build` therefore runs `astro build --force` (official flag) — the previous
// data-store.json deletion hack (Astro-internal path dependency) was removed.

// Deploy target is env-driven, so moving to a custom domain / Vercel is 2 env vars:
//   GitHub Pages (default): SITE_URL unset, SITE_BASE unset
//   Vercel / custom domain (root): SITE_URL=https://your-domain  SITE_BASE=""
// src/data/site.ts derives origin/base/url from these automatically.
const SITE_URL = process.env.SITE_URL ?? 'https://thinkyou0714.github.io';
const BASE = process.env.SITE_BASE ?? '/engineer-tenshoku-navi';

// Resolve affiliate CTA links written as [text](offer:<id>) in markdown against the
// central registry in src/data/offers.mjs. Active offers (URL set via offers.mjs or
// OFFER_URL_* env var) become real sponsored links; pending offers stay as href="#"
// placeholders. Unknown ids fail the build so typos cannot ship. Must run BEFORE
// rehypeBaseLinks (so "#"/http hrefs are already final) and before rehypeExternalLinks.
function rehypeOfferLinks() {
  const OFFER_HREF = /^offer:([a-z0-9-]+)$/;
  /** @param {any} tree @param {any} file */
  return (tree, file) => {
    /** @param {any} node */
    const walk = (node) => {
      if (node && node.tagName === 'a' && node.properties) {
        const h = node.properties.href;
        // Two-stage detection: catch ANY offer:-prefixed href (case/format errors
        // included) so malformed links fail the build instead of shipping as dead
        // "offer:..." hrefs; then strictly resolve well-formed lowercase ids.
        if (typeof h === 'string' && /^offer:/i.test(h)) {
          const m = h.match(OFFER_HREF);
          const id = m ? m[1] : null;
          const offer = id ? getOffer(id) : undefined;
          if (!offer) {
            throw new Error(
              `rehypeOfferLinks: unknown or malformed offer link "${h}" in ${file && file.path ? file.path : '(unknown file)'}. ` +
                'Use lowercase [text](offer:<id>) with an id from src/data/offers.mjs.'
            );
          }
          if (isOfferActive(offer)) {
            node.properties.href = offerUrl(offer);
            node.properties.rel = ['sponsored', 'nofollow', 'noopener'];
            node.properties.target = '_blank';
            node.properties.dataOffer = id;
          } else {
            // Pending: placeholder until the ASP URL is filled in. A tiny global
            // script in BaseLayout prevents the default "#" jump; aria-disabled
            // tells assistive tech the link is not yet actionable.
            node.properties.href = '#';
            node.properties.dataOffer = id;
            node.properties.dataOfferPending = '';
            node.properties.ariaDisabled = 'true';
          }
        }
      }
      if (node && node.children) node.children.forEach(walk);
    };
    walk(tree);
  };
}

// Prefix root-relative markdown links (e.g. /guide/foo) with the base path so they
// resolve correctly under the Pages subpath. (Astro does not rewrite markdown links.)
function rehypeBaseLinks() {
  /** @param {any} node */
  const walk = (node) => {
    if (node && node.tagName === 'a' && node.properties) {
      const h = node.properties.href;
      if (typeof h === 'string' && h.startsWith('/') && !h.startsWith(BASE + '/') && h !== BASE) {
        node.properties.href = BASE + h;
      }
    }
    if (node && node.children) node.children.forEach(walk);
  };
  return (/** @type {any} */ tree) => walk(tree);
}

export default defineConfig({
  site: SITE_URL,
  base: BASE,
  output: 'static',
  trailingSlash: 'ignore',
  // 全内部リンクをホバー時に先読みしてナビ体感速度を上げる(追加JSは極小)。
  // prefetchAll がないと data-astro-prefetch を付けたリンクだけが対象で実質 no-op。
  prefetch: { prefetchAll: true, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      serialize(item) {
        const m = item.url.match(/\/guide\/([a-z0-9-]+)\/?$/);
        const lastmod = m && POST_LASTMODS.get(m[1]);
        if (lastmod) item.lastmod = lastmod;
        return item;
      },
    }),
  ],
  markdown: {
    // resolve offer: CTA links first, then base-prefix internal links, then mark
    // external links sponsored.
    rehypePlugins: [
      rehypeOfferLinks,
      rehypeBaseLinks,
      [
        rehypeExternalLinks,
        { rel: ['sponsored', 'nofollow', 'noopener'], target: '_blank' },
      ],
    ],
  },
});

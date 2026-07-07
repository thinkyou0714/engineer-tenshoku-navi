// @ts-check
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeExternalLinks from 'rehype-external-links';
import { loadEnv } from 'vite';
import { OFFERS, getOffer, offerUrl, isOfferActive } from './src/data/offers.mjs';

// Merge .env(.production) values into process.env BEFORE anything below reads it.
// Astro injects .env into import.meta.env only at page-render time, so without this
// merge, OFFER_URL_* / SITE_URL written in a .env file would apply to .astro pages
// but NOT to markdown CTA rendering (content sync) — a silent half-applied build.
{
  const root = path.dirname(fileURLToPath(import.meta.url));
  const fileEnv = loadEnv(process.env.NODE_ENV ?? 'production', root, '');
  for (const [k, v] of Object.entries(fileEnv)) {
    if (!(k in process.env)) process.env[k] = v;
  }
}

// Astro's content-layer cache stores rendered post HTML keyed only by each markdown
// file's digest, so changing a resolved offer URL (OFFER_URL_* env var or offers.mjs
// edit) would NOT re-render unchanged posts. Bust the cache whenever the resolved
// offer set changes, so "fill in the URL → npm run build" always takes effect.
// Best-effort: on failure, `astro build --force` is the manual fallback.
function bustContentCacheOnOfferChange() {
  const root = path.dirname(fileURLToPath(import.meta.url));
  const fingerprint = JSON.stringify(OFFERS.map((o) => [o.id, offerUrl(o)]));
  const marker = path.join(root, 'node_modules', '.astro', 'offers-fingerprint.json');
  try {
    if (fs.existsSync(marker) && fs.readFileSync(marker, 'utf8') === fingerprint) return;
    for (const store of [
      path.join(root, 'node_modules', '.astro', 'data-store.json'),
      path.join(root, '.astro', 'data-store.json'),
    ]) {
      if (fs.existsSync(store)) fs.rmSync(store);
    }
    fs.mkdirSync(path.dirname(marker), { recursive: true });
    fs.writeFileSync(marker, fingerprint);
  } catch {
    /* never fail the build over cache maintenance */
  }
}
bustContentCacheOnOfferChange();

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
  return (tree, file) => {
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
  site: SITE_URL,
  base: BASE,
  output: 'static',
  trailingSlash: 'ignore',
  integrations: [sitemap()],
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

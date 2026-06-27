# CLAUDE.md

## 1. Project Contract

- This repository is `engineer-tenshoku-navi`.
- It is an Astro static affiliate information site for engineer / IT job-change topics.
- Keep the site compliance-first: do not add exaggerated claims, fake reviews, fake credentials, or unverified rankings.
- Keep generated output static. The current build target is `output: 'static'` in `astro.config.mjs`.
- Do not change affiliate, compliance, or legal copy without checking the relevant existing policy pages and README notes.
- Do not invent services, authors, awards, approval rates, conversion rates, or personal experience.
- Treat `(#)` links in article CTAs as placeholders. They do not monetize and must not be replaced with guessed URLs.
- When adding affiliate URLs, use real ASP links only and keep sponsored/nofollow behavior intact.

## 2. Quick Start

Use the commands that already exist in `package.json`.

```sh
npm install
npm run dev
npm run build
npm run check
```

- `npm run dev` runs `astro dev`.
- The local dev URL is usually `http://localhost:4321`.
- `npm run build` runs `astro build` and writes `dist/`.
- `npm run check` runs `astro check`.
- `npm run preview` is also available for previewing a built site.
- CI uses `npm ci` before `npm run build` in `.github/workflows/ci.yml`.

For local compliance checking:

```sh
python3 scripts/compliance-lint.py --root src/content/posts
```

- A clean compliance run prints `検出数: 0`.
- Review any lint hit manually; the script is a pre-publish guard, not legal advice.

## 3. Repository Map

- `astro.config.mjs` defines Astro config, sitemap integration, base path handling, and external-link rel behavior.
- `src/content.config.ts` defines the `posts` content collection and Zod schema.
- `src/content/posts/` contains Markdown article content.
- `src/pages/guide/[slug].astro` renders non-draft posts under `/guide/<slug>`.
- `src/pages/index.astro` renders the top page.
- `src/pages/about.astro`, `src/pages/affiliate-policy.astro`, `src/pages/disclosures.astro`, and `src/pages/privacy.astro` are static policy/info pages.
- `src/layouts/BaseLayout.astro` owns the HTML shell.
- `src/layouts/ArticleLayout.astro` owns article pages, breadcrumbs, author box, related posts, and article schema wiring.
- `src/components/` contains shared UI components.
- `src/data/site.ts` is the site-wide config source used by pages, metadata, and schema builders.
- `src/utils/schema.ts` builds JSON-LD objects.
- `scripts/compliance-lint.py` is the compliance lint script.
- `.github/workflows/ci.yml` runs compliance lint, build, affiliate rel checks, and internal link checks.
- `.github/workflows/deploy.yml` deploys GitHub Pages from `main`.

## 4. Architecture

### Astro Config

- `astro.config.mjs` uses `defineConfig`.
- `SITE_URL` defaults to `https://thinkyou0714.github.io`.
- `SITE_BASE` defaults to `/engineer-tenshoku-navi`.
- `site` is set from `SITE_URL`.
- `base` is set from `SITE_BASE`.
- `@astrojs/sitemap` is enabled.
- `rehype-external-links` adds `rel="sponsored nofollow noopener"` and `target="_blank"` to external Markdown links.
- The local `rehypeBaseLinks()` plugin prefixes root-relative Markdown links with the configured base when needed.

### Content Collections

- `src/content.config.ts` defines a `posts` collection.
- The loader reads `src/content/posts/**/*.md`.
- Required frontmatter fields include `title`, `description`, `kind`, and `publishDate`.
- `kind` must be `pillar` or `cluster`.
- Optional fields include `targetKeyword`, `updatedDate`, `author`, `draft`, `order`, and `faq`.
- `draft` defaults to `false`.
- `order` defaults to `99`.
- `faq` items require `q` and `a`.

### Article Rendering

- `src/pages/guide/[slug].astro` calls `getCollection('posts', ({ data }) => !data.draft)`.
- Each post ID becomes the URL slug.
- Article URLs are `/guide/<post.id>`.
- Article Markdown is rendered with `render(post)` and passed into `ArticleLayout.astro`.
- `ArticleLayout.astro` emits article metadata, breadcrumbs, FAQ schema, author box, and related posts.

### Layouts And Components

- `BaseLayout.astro` imports global CSS and wraps all pages with header, disclosure, main content, footer, and analytics.
- `BaseHead.astro` writes title, description, canonical, robots, OGP, Twitter card, sitemap, RSS, and JSON-LD script tags.
- `Disclosure.astro` renders the site-wide affiliate disclosure banner.
- `AffiliateLink.astro` is for hand-authored Astro links and adds `rel="sponsored nofollow noopener"` to external URLs.
- `Breadcrumb.astro` renders breadcrumb UI.
- `AuthorBox.astro` renders author information from `src/data/site.ts`.
- `RelatedPosts.astro` renders related article links.
- `PostCard.astro` is used for article list cards.
- `Analytics.astro` handles optional analytics behavior.

## 5. Compliance

The compliance stance is intentionally conservative.

### Lint Categories

`scripts/compliance-lint.py` checks four categories:

- `keihyoho`: 景表法
- `yakukiho`: 薬機法
- `tokushoho`: 特商法/収益保証
- `approval_rate`: ASP承認率リスク

The script scans Markdown/text content and reports file, line, category, matched term, and guidance.

### Local And CI Checks

- Run `python3 scripts/compliance-lint.py --root src/content/posts` before content changes are considered done.
- `.github/workflows/ci.yml` fails unless the compliance output contains `検出数: 0`.
- CI builds the site with `npm run build`.
- CI checks built external links under `dist/` and requires sponsored rel attributes.
- CI checks generated internal `/guide/*` links point to existing built article pages.

### Copy Rules

- Avoid absolute claims such as guaranteed success, guaranteed income, or universal No.1 claims.
- Do not claim medical, psychological, or legal effects.
- Do not use fabricated experience stories.
- Do not publish fake author credentials.
- Do not add Review or AggregateRating schema without genuine, verifiable review data.
- Keep compensation disclosure visible and consistent with `SITE.disclosure` in `src/data/site.ts`.
- Treat `(#)` links as unresolved placeholders until a real affiliate URL exists.

## 6. SEO And Structured Data

- Metadata is centralized through `BaseHead.astro`.
- Canonical URLs use the deployed URL and current Astro pathname.
- Sitemap output comes from `@astrojs/sitemap`.
- RSS is available through `src/pages/rss.xml.js`.
- JSON-LD builders live in `src/utils/schema.ts`.
- Existing builders include Organization, WebSite, Person, Article, BreadcrumbList, and FAQPage.
- `graph(...nodes)` wraps JSON-LD in a Schema.org graph.
- `Review` and `AggregateRating` are intentionally not provided in `src/utils/schema.ts`.
- Article FAQ frontmatter feeds FAQPage JSON-LD through `ArticleLayout.astro`.

## 7. Deployment

### GitHub Pages

- `.github/workflows/deploy.yml` deploys from pushes to `main`.
- The current GitHub Pages URL in README is `https://thinkyou0714.github.io/engineer-tenshoku-navi/`.
- The default Astro base path is `/engineer-tenshoku-navi`.
- Do not break base-aware links when changing paths.

### Vercel Or Custom Domain

- `astro.config.mjs` reads `SITE_URL` and `SITE_BASE`.
- `src/data/site.ts` derives `SITE.origin`, `SITE.base`, and `SITE.url` from Astro env values.
- For a root-domain deployment, set `SITE_URL` to the production origin and `SITE_BASE` to an empty base value.
- README also notes that `public/robots.txt` and CI base-prefix assumptions should be reviewed when the deployment base changes.
- Optional GA uses `PUBLIC_GA_ID` as documented in README.

## 8. Extending Content

When adding a new article:

1. Create `src/content/posts/<slug>.md`.
2. Use frontmatter accepted by `src/content.config.ts`.
3. Choose `kind: pillar` or `kind: cluster`.
4. Set `publishDate` to a real date.
5. Add `faq` only when each answer is supported by the article.
6. Link internally using `/guide/<slug>` style paths.
7. Do not add guessed affiliate URLs.
8. Run compliance lint, build, and check.

Use this verification set after content or template changes:

```sh
python3 scripts/compliance-lint.py --root src/content/posts
npm run build
npm run check
```

## 9. Change Discipline

- Read the target file before editing it.
- Keep changes scoped to the requested task.
- Prefer existing Astro, TypeScript, and content-collection patterns.
- Do not modify generated `dist/` output as source.
- Do not edit `.github/workflows/ci.yml` or `.github/workflows/deploy.yml` unless the task explicitly asks for workflow changes.
- Do not make compliance copy weaker for conversion-rate reasons.
- If a command fails, identify the root cause before changing code.
- If a path or command is not present in this repository, do not document it as available.

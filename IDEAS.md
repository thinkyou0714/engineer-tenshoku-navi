# engineer-tenshoku-navi — Improvement Backlog

Scored best-practice backlog from a read-only deep-research sweep (value × effort × risk).
Tiers: **T1** = high-value / low-risk · **T2** = behavior-preserving code-quality · **T3** = higher-leverage
or behavior-changing (needs design). Compliance note: this is a 景表法/ステマ/薬機法-sensitive affiliate
site — never weaken the compliance gates; these ideas only add guards.

## Already present (verified) / not needed
- `.gitattributes` exists; `astro check` script exists (just not wired into CI yet — see T1-follow).
- Uses **no Renovate** → Dependabot is the right dependency-automation choice (added in this PR).

## T1 — scaffolding + security (this PR)
- **`CLAUDE.md`** — layered, code-accurate guide (Quick Start → Architecture → Compliance → SEO → Deploy → Extending).
- **`.editorconfig`** — 2-space/LF baseline (`*.py` = 4-space).
- **`.github/dependabot.yml`** — npm + github-actions weekly updates.
- **`.github/workflows/codeql.yml`** — JS/TS static analysis (SHA-pinned).
- **`.github/workflows/dependency-review.yml`** — license/vuln review on PRs (SHA-pinned).
- **`.github/workflows/secret-scan.yml`** — gitleaks (SHA-pinned).

## T1-follow — CI wiring (next PR, edits existing `ci.yml`)
- **Wire `npm run check` (astro check)** into CI before build — catches TS/component type errors. (high/S/low)
- **`compliance-lint.py --selftest`** step in CI — regression-guards the validator itself. (high/S/low)
- **Placeholder-link scan** — fail-soft warn when published (non-draft) articles still contain `(#)` CTA links. (medium/S/low)
- **SHA-pin existing workflows** (`ci.yml`/`deploy.yml` use `@v4`/`@v5` tags) — Dependabot github-actions can then maintain them. (medium/S/low)
- **Build-time env validation** — require `SITE_URL` when `SITE_BASE` is set; validate URL shape. (`astro.config.mjs`) (medium/M/low)

## T2 — behavior-preserving code-quality
- **Extract `rehypeBaseLinks`** from `astro.config.mjs` into `src/plugins/rehype-base-links.ts` (a factory) — unit-testable, reusable. (M/S/low)
- **Port `compliance-lint.py` selftest into a real test suite** (`scripts/test-compliance-lint.py`, stdlib `unittest`/pytest), parameterized per category + edge cases. (M/M/low)
- **SEO metadata length validation** in `content.config.ts` (title ≤60, description 100–160). (M/S/low — behavior-changing for authors)

## T3 — higher-leverage / behavior-changing (separate PRs, design first)
- **CSP header** in `vercel.json` (`default-src 'self'`; scope GA inline script) — careful, can break Analytics. (high/S/medium)
- **Lighthouse CI** on PRs — assert perf/a11y budgets translate from the zero-JS design. (M/M/low)
- **OG image generation** (1200×630 at build) for social previews. (M/L/medium)
- **Sitemap `lastmod` from `updatedDate`** (custom @astrojs/sitemap wrapper). (M/M/medium)
- **RSS category/tag filtering**; **`ads.txt`** for ASP transparency; **draft preview** mode with `noindex`. (mixed)

> Part of an ecosystem-wide best-practice sweep; companion backlogs live in the sibling repos
> (ccmux, fugu, denken-os).

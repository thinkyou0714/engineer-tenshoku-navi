---
name: build-site
description: Build or preview the Astro site and report errors. Use when asked to build, preview, or verify the site compiles.
---

Build (or dev-preview) the static site and report the outcome.

1. Ensure deps are installed (SessionStart bootstrap handles this; else `npm ci`).
2. Build: `npm run build` (→ `astro build`, outputs `dist/`). Local preview: `npm run dev`.
3. Report: success + output size, or the first build error with its file/line. Summarize any Astro/TS diagnostics.
4. Do not alter content or components unless the user asks; keep 景表法/薬機法 compliance in mind for any copy changes.

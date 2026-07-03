# AGENTS.md — engineer-tenshoku-navi

エンジニア/IT 転職の比較・選び方を事実ベースで解説するアフィリエイト静的サイト。SEO / コンプラ設計済み。

- **Stack**: Astro (static), TypeScript, Node. Deploy: Vercel (`vercel.json`) / 任意の静的ホスト (`dist/`).
- **Layout**: `src/` (pages/components/content) · `public/` (assets) · `scripts/` (tooling) · `STRATEGY.md` / `ROADMAP.md` (方針).
- **Setup**: deps auto-install via `.claude/bootstrap.sh` on SessionStart (local + web/cloud). Manual: `npm ci`.
- **Build**: `npm run build` (→ `astro build`, outputs `dist/`). **Dev**: `npm run dev`.
- **Content rules**: 事実ベース + 景表法/薬機法コンプラ配慮。誇大・断定表現や捏造レビューを追加しない。

## Claude Code on the web
A cloud session auto-installs deps (SessionStart hook) and loads this `AGENTS.md` + `.claude/skills/`.
MCP is local-only for this repo. See `thinkyou0714/.github` → `docs/claude-code-web-readiness.md`.

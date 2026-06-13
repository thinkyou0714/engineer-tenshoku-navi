#!/usr/bin/env python3
"""affiliate_compliance_lint.py — pre-publish compliance + approval-rate linter (report-only).

Scans Japanese affiliate marketing copy (articles / LPs / SNS posts) for risky expressions across
four categories: 薬機法 / 景表法 / 特定商取引法 / ASP承認率. It REPORTS findings (category, line,
matched text, severity, rationale, safer-rephrase hint) and NEVER edits the copy.

GUIDANCE, NOT LEGAL ADVICE. Keep a human final check before publishing. stdlib only.

Implementation note: delegated to Codex 5.5 (xhigh) first; Codex hit its usage limit mid-run, so
this was implemented by the Claude Code hub against the same /goal spec and is open to a Codex
re-review once the limit resets.
"""
import argparse
import json
import os
import re
import sys
import tempfile
from pathlib import Path

DISCLAIMER = (
    "本ツールは実務ガイドであり法的助言ではありません。"
    "公開前に必ず人間が最終チェックし、各ASP規約・最新の行政ガイドラインに従ってください。"
)

SKIP_DIRS = {".git", "node_modules", "_archive", "_worktrees", "plugins", "litellm-venv"}
TEXT_SUFFIXES = {".md", ".txt", ".markdown"}

CATEGORY_ORDER = ["yakukiho", "keihyoho", "tokushoho", "approval_rate"]

CATEGORIES = {
    "yakukiho": {
        "label": "薬機法",
        "severity": "HIGH",
        "rationale": "化粧品・健康食品・雑貨で医薬品的な効果効能を断定すると薬機法違反(課徴金/行政指導)。",
        "hint": "効果の断定を避け、化粧品56効能の範囲や「サポート」等の表現へ。疾患名・身体機能への作用は記載しない。",
        "patterns": [
            r"治る", r"完治", r"治療効果", r"効果が(ある|出る|期待でき)", r"効きます",
            r"改善(する|します|される|されます)", r"予防(する|します|になる|になります)",
            r"痩せる", r"シミが消え", r"シワが消え", r"くすみが消え", r"発毛", r"育毛効果",
            r"即効性", r"副作用(がない|はありません|はない)", r"デトックス", r"血行促進",
            r"脂肪(が|を)分解", r"代謝が上が", r"コラーゲンが増え", r"腸内環境(が|を)改善",
            r"幹細胞を活性", r"ホルモンバランスを整え", r"ウイルスを除去", r"血糖値を下げ",
            r"アトピーが(治|改善)", r"花粉症に効く", r"がんの?予防", r"免疫力が上が",
            r"生まれ変わ", r"(肌|髪)が(蘇|よみがえ)", r"永久脱毛", r"医学的に(証明|裏付|実証)",
            r"完全に(治|改善)", r"バストアップ", r"細胞が再生", r"飲むだけで(痩|脂肪|改善)",
        ],
    },
    "keihyoho": {
        "label": "景表法",
        "severity": "HIGH",
        "rationale": "最上級・No.1・断定や二重価格は根拠表示がなければ優良誤認/有利誤認(景表法違反)。",
        "hint": "No.1等は調査機関・対象・時期・方法を同一画面に明記。価格比較は実販売実績のみ。断定語は避ける。",
        "patterns": [
            r"No\.?1", r"ナンバーワン", r"日本一", r"世界一", r"世界初", r"業界最高",
            r"業界No", r"最高級", r"満足度No", r"満足度[0-9０-９]+位", r"医師の[0-9０-９]+割",
            r"絶対(に)?(稼げ|痩せ|儲か|成功|安全|安心)", r"必ず(稼げ|痩せ|儲か|成功)",
            r"100[%％]", r"１００[%％]", r"誰でも(稼げ|簡単|成功|できる)",
            r"確実に(稼げ|痩せ|儲か|成功)", r"間違いなく", r"今だけ", r"期間限定",
            r"本日限定", r"通常価格", r"定価の[0-9０-９]+[%％]", r"初回限定",
            r"[0-9０-９]+倍(の効果|効果が|効く)", r"(業界|日本|地域)最安", r"最速で(稼げ|痩せ|成功)",
        ],
    },
    "tokushoho": {
        "label": "特商法/収益保証",
        "severity": "MED",
        "rationale": "誇大な収益保証・不労所得・リスク否定は特商法/景表法上の誇大広告。情報商材は重点監視対象。",
        "hint": "結果は保証しない旨と前提条件を正直に明記。実績は調査時期・母数・根拠資料つきでのみ提示。",
        "patterns": [
            r"必ず稼げ", r"不労所得", r"放置で(月収|稼|月[0-9０-９])", r"寝てい(る|て)間に稼",
            r"リスクゼロ", r"損をしない", r"誰でも稼げ", r"確実に儲か",
            r"月収[0-9０-９]+万円(達成|保証|可能)", r"何もしなくても(稼|儲)", r"楽して稼げ",
            r"スマホ(だけ|一台)で(月|稼)", r"コピペ(だけ|で)(稼|月収)", r"初期費用(0|ゼロ|無料)で稼",
        ],
    },
    "approval_rate": {
        "label": "ASP承認率リスク",
        "severity": "MED",
        "rationale": "法律違反でなくてもASP審査で否認されやすい構成(誤クリック誘発/過度な煽り/無断インセンティブ)。",
        "hint": "広告とコンテンツを分離しリンク性質を明示。煽りは根拠ある情報のみ。特典はASP/広告主の事前承認が必要。",
        "patterns": [
            r"今すぐ申し込まないと(手遅れ|後悔)", r"一生後悔", r"このチャンスを逃す(と|せば)",
            r"登録するだけで(現金|ギフト|プレゼント|もらえ|稼げ)",
            r"申し込むだけで(現金|ギフト|プレゼント)", r"クリックするだけで(稼|もらえ)",
            r"今すぐクリック", r"急が?ないと(損|なくなり)",
        ],
    },
}


def _compile():
    return {
        cat: [re.compile(p, re.IGNORECASE) for p in meta["patterns"]]
        for cat, meta in CATEGORIES.items()
    }


COMPILED = _compile()


def display_path(path, root):
    try:
        return path.relative_to(root).as_posix()
    except ValueError:
        return str(path)


def read_text(path):
    try:
        data = path.read_bytes()
    except OSError:
        return None
    if b"\x00" in data:
        return None
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        try:
            return data.decode("cp932")
        except UnicodeDecodeError:
            return None


def iter_text_files(root):
    root = Path(root)
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = sorted(d for d in dirnames if d.lower() not in SKIP_DIRS)
        for name in sorted(filenames):
            if Path(name).suffix.lower() in TEXT_SUFFIXES:
                yield Path(dirpath) / name


def scan_text(text, path, root):
    findings = []
    for line_no, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line:
            continue
        for cat in CATEGORY_ORDER:
            for pat in COMPILED[cat]:
                m = pat.search(line)
                if m:
                    meta = CATEGORIES[cat]
                    findings.append({
                        "category": cat,
                        "label": meta["label"],
                        "severity": meta["severity"],
                        "file": display_path(path, root),
                        "line": line_no,
                        "match": m.group(0),
                        "rationale": meta["rationale"],
                        "hint": meta["hint"],
                    })
                    break  # one finding per category per line
    return findings


def scan_targets(file_path, root_path):
    findings = []
    if file_path is not None:
        p = Path(file_path).resolve()
        text = read_text(p)
        if text is not None:
            findings = scan_text(text, p, p.parent)
    else:
        root = Path(root_path).resolve()
        for p in iter_text_files(root):
            text = read_text(p)
            if text is None:
                continue
            findings.extend(scan_text(text, p, root))
    order = {c: i for i, c in enumerate(CATEGORY_ORDER)}
    findings.sort(key=lambda f: (order[f["category"]], f["file"], f["line"]))
    return findings


def build_report(findings):
    lines = [
        "# アフィリエイト・コンプライアンス Lint",
        "",
        "> " + DISCLAIMER,
        "",
        "検出数: %d" % len(findings),
        "",
    ]
    if not findings:
        lines.append("検出なし。ただし機械チェックの限界があるため、人間の最終確認は必須です。")
        return "\n".join(lines) + "\n"
    for cat in CATEGORY_ORDER:
        group = [f for f in findings if f["category"] == cat]
        if not group:
            continue
        meta = CATEGORIES[cat]
        lines.append("## %s (%s, %d件)" % (meta["label"], meta["severity"], len(group)))
        lines.append("- 理由: %s" % meta["rationale"])
        lines.append("- 対策: %s" % meta["hint"])
        for f in group:
            lines.append("  - `%s:%d` — 「%s」" % (f["file"], f["line"], f["match"]))
        lines.append("")
    lines.append("---")
    lines.append(
        "> 言い換え例は `references/ng-expressions.md`"
        "(薬機法=Section1 / 景表法=Section2 / 特商法=Section3 / 承認率=Section4)を参照。"
        "機械チェックは取りこぼすため、最後に人間が30秒目視してから公開。")
    return "\n".join(lines).rstrip() + "\n"


def selftest():
    total = 6
    passed = 0

    def record(ok, name):
        nonlocal passed
        passed += 1 if ok else 0
        print(("PASS " if ok else "FAIL ") + name)

    with tempfile.TemporaryDirectory() as tmp:
        root = Path(tmp)
        dirty = root / "dirty.md"
        clean = root / "clean.md"
        dirty.write_text(
            "\n".join([
                "# サンプル",
                "このクリームでシミが消える。",            # yakukiho
                "売上No.1のサプリ、絶対に痩せる。",          # keihyoho
                "このノウハウなら不労所得が手に入る。",       # tokushoho
                "登録するだけでギフト券プレゼント。",         # approval_rate
                "",
            ]),
            encoding="utf-8",
        )
        clean.write_text(
            "\n".join([
                "# サンプル",
                "このクリームは乾燥による小じわを目立たなくするのに使えます。",
                "本記事はアフィリエイト広告を含みます。実際の収益には個人差があります。",
                "",
            ]),
            encoding="utf-8",
        )

        dirty_findings = scan_targets(str(dirty), None)
        cats = {f["category"] for f in dirty_findings}
        record(all(c in cats for c in CATEGORY_ORDER),
               "dirty draft flags all four categories")

        clean_findings = scan_targets(str(clean), None)
        record(len(clean_findings) == 0, "clean draft yields zero findings")

        report = build_report(dirty_findings)
        record("法的助言ではありません" in report,
               "report header carries the non-legal-advice disclaimer")

        empty = build_report([])
        record("検出なし" in empty and "法的助言ではありません" in empty,
               "empty report still carries the disclaimer")

        new_draft = root / "new.md"
        new_draft.write_text(
            "\n".join(["# サンプル", "このクリームで肌が生まれ変わる。", ""]),
            encoding="utf-8",
        )
        new_findings = scan_targets(str(new_draft), None)
        record(any(f["category"] == "yakukiho" for f in new_findings),
               "newly added pattern flags 「肌が生まれ変わる」 as 薬機法")

        record("ng-expressions.md" in report,
               "report footer points users to ng-expressions.md")

    print("SELFTEST: %d/%d PASS" % (passed, total))
    return 0 if passed == total else 1


def parse_args(argv):
    ap = argparse.ArgumentParser(
        description="Pre-publish compliance + approval-rate linter for JP affiliate copy (report-only).")
    ap.add_argument("--file", help="Lint a single draft file.")
    ap.add_argument("--root", help="Lint every .md/.txt under this directory.")
    ap.add_argument("--json", action="store_true", help="Emit findings as JSON.")
    ap.add_argument("--report-file", help="Also write the markdown report to this path.")
    ap.add_argument("--selftest", action="store_true", help="Run built-in fixtures.")
    return ap.parse_args(argv)


def main(argv=None):
    args = parse_args(argv if argv is not None else sys.argv[1:])
    if args.selftest:
        return selftest()

    if args.file:
        if not Path(args.file).is_file():
            print("File not found: %s" % args.file, file=sys.stderr)
            return 2
    elif args.root:
        if not Path(args.root).is_dir():
            print("Root not found: %s" % args.root, file=sys.stderr)
            return 2

    findings = scan_targets(args.file, args.root or ".")
    report = build_report(findings)
    if args.report_file:
        rp = Path(args.report_file)
        if rp.parent and str(rp.parent) != ".":
            rp.parent.mkdir(parents=True, exist_ok=True)
        rp.write_text(report, encoding="utf-8", newline="\n")

    if args.json:
        print(json.dumps(findings, ensure_ascii=False, indent=2))
    else:
        print(report, end="")
    return 0


if __name__ == "__main__":
    sys.exit(main())

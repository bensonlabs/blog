#!/usr/bin/env python3
"""Regenerate the GAMES array in projects/games/index.html from the
bl-game-meta comment block in each projects/games/<slug>/index.html.

See .github/scripts/GAME_METADATA.md for the block format and field spec.
"""
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
GAMES_DIR = REPO_ROOT / "projects" / "games"
INDEX_FILE = GAMES_DIR / "index.html"

META_BLOCK_RE = re.compile(r"<!--\s*bl-game-meta(.*?)-->", re.DOTALL)
FIELD_RE = re.compile(r"^(title|emoji|order|description):\s*(.*)$")

REQUIRED_FIELDS = ("title", "emoji", "order", "description")

START_MARKER = "// AUTO-GENERATED GAMES START -- do not hand-edit, see .github/scripts/GAME_METADATA.md"
END_MARKER = "// AUTO-GENERATED GAMES END"


def find_game_dirs():
    return sorted(
        p.parent for p in GAMES_DIR.glob("*/index.html")
    )


def parse_meta(path):
    text = path.read_text(encoding="utf-8")
    m = META_BLOCK_RE.search(text)
    if not m:
        return None, "missing <!-- bl-game-meta ... --> block"

    fields = {}
    for line in m.group(1).strip().splitlines():
        line = line.strip()
        if not line:
            continue
        fm = FIELD_RE.match(line)
        if not fm:
            return None, f"unrecognized metadata line: {line!r}"
        fields[fm.group(1)] = fm.group(2).strip()

    missing = [f for f in REQUIRED_FIELDS if f not in fields]
    if missing:
        return None, f"missing required field(s): {', '.join(missing)}"

    try:
        fields["order"] = int(fields["order"])
    except ValueError:
        return None, f"order must be an integer, got {fields['order']!r}"

    return fields, None


def build_games_array():
    errors = []
    games = []

    for game_dir in find_game_dirs():
        slug = game_dir.name
        index_html = game_dir / "index.html"
        fields, err = parse_meta(index_html)
        if err:
            errors.append(f"{index_html.relative_to(REPO_ROOT)}: {err}")
            continue
        games.append({
            "title": fields["title"],
            "description": fields["description"],
            "emoji": fields["emoji"],
            "path": f"/projects/games/{slug}/",
            "order": fields["order"],
        })

    if errors:
        print("Games registry build FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    games.sort(key=lambda g: (g["order"], g["title"]))
    for g in games:
        del g["order"]
    return games


def render_js_array(games):
    lines = [START_MARKER, "    const GAMES = ["]
    for g in games:
        lines.append("      {")
        lines.append(f"        title: {json.dumps(g['title'], ensure_ascii=False)},")
        lines.append(f"        description: {json.dumps(g['description'], ensure_ascii=False)},")
        lines.append(f"        emoji: {json.dumps(g['emoji'], ensure_ascii=False)},")
        lines.append(f"        path: {json.dumps(g['path'], ensure_ascii=False)},")
        lines.append("      },")
    lines.append("    ];")
    lines.append(f"    {END_MARKER}")
    return "\n".join(lines)


def main():
    games = build_games_array()
    new_block = render_js_array(games)

    text = INDEX_FILE.read_text(encoding="utf-8")
    pattern = re.compile(
        re.escape(START_MARKER) + r".*?" + re.escape(END_MARKER),
        re.DOTALL,
    )
    if not pattern.search(text):
        print(
            f"Could not find {START_MARKER!r} .. {END_MARKER!r} markers in "
            f"{INDEX_FILE.relative_to(REPO_ROOT)}",
            file=sys.stderr,
        )
        sys.exit(1)

    new_text = pattern.sub(lambda _: new_block, text, count=1)
    if new_text != text:
        INDEX_FILE.write_text(new_text, encoding="utf-8")
        print(f"Updated {INDEX_FILE.relative_to(REPO_ROOT)} with {len(games)} games.")
    else:
        print(f"{INDEX_FILE.relative_to(REPO_ROOT)} already up to date ({len(games)} games).")


if __name__ == "__main__":
    main()

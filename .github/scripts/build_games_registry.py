#!/usr/bin/env python3
"""Regenerate the GAMES array in projects/games/index.html from each
projects/games/<slug>/index.html.

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
TITLE_RE = re.compile(r"<title[^>]*>(.*?)</title>", re.IGNORECASE | re.DOTALL)
META_DESCRIPTION_RE = re.compile(
    r"<meta[^>]+name=[\"']description[\"'][^>]+content=[\"'](.*?)[\"'][^>]*>",
    re.IGNORECASE | re.DOTALL,
)
META_DESCRIPTION_RE_ALT = re.compile(
    r"<meta[^>]+content=[\"'](.*?)[\"'][^>]+name=[\"']description[\"'][^>]*>",
    re.IGNORECASE | re.DOTALL,
)

REQUIRED_FIELDS = ("title", "emoji", "order", "description")
DEFAULT_EMOJI = "🎮"
DEFAULT_ORDER = 999

START_MARKER = "// AUTO-GENERATED GAMES START -- do not hand-edit, see .github/scripts/GAME_METADATA.md"
END_MARKER = "// AUTO-GENERATED GAMES END"


def find_game_dirs():
    return sorted(
        p.parent for p in GAMES_DIR.glob("*/index.html")
    )


def collapse_ws(text):
    return re.sub(r"\s+", " ", text).strip()


def title_from_slug(slug):
    return " ".join(part.capitalize() for part in slug.split("-"))


def normalize_title(title):
    if not title:
        return title
    normalized = collapse_ws(title)
    normalized = re.sub(
        r"\s+(?:—|-|\|)\s+Benson\s+Labs\s*$",
        "",
        normalized,
        flags=re.IGNORECASE,
    )
    return normalized.strip()


def extract_title(text):
    m = TITLE_RE.search(text)
    if not m:
        return None
    return normalize_title(m.group(1))


def extract_meta_description(text):
    m = META_DESCRIPTION_RE.search(text) or META_DESCRIPTION_RE_ALT.search(text)
    if not m:
        return None
    return collapse_ws(m.group(1))


def parse_meta_block(text):
    m = META_BLOCK_RE.search(text)
    if not m:
        return None, None

    fields = {}
    for line in m.group(1).strip().splitlines():
        line = line.strip()
        if not line:
            continue
        fm = FIELD_RE.match(line)
        if not fm:
            return None, f"unrecognized metadata line: {line!r}"
        fields[fm.group(1)] = fm.group(2).strip()
    return fields, None


def derive_fields(slug, text):
    title = extract_title(text) or title_from_slug(slug)
    description = extract_meta_description(text) or f"Browser game: {title}."
    return {
        "title": title,
        "emoji": DEFAULT_EMOJI,
        "order": DEFAULT_ORDER,
        "description": description,
    }


def merge_fields(slug, text, fields):
    derived = derive_fields(slug, text)
    merged = {}

    for field in REQUIRED_FIELDS:
        value = fields.get(field) if fields else None
        if value is None or value == "":
            merged[field] = derived[field]
        else:
            merged[field] = value

    try:
        merged["order"] = int(merged["order"])
    except ValueError:
        return None, f"order must be an integer, got {merged['order']!r}"

    return merged, None


def build_games_array():
    errors = []
    notes = []
    games = []

    for game_dir in find_game_dirs():
        slug = game_dir.name
        index_html = game_dir / "index.html"
        text = index_html.read_text(encoding="utf-8")

        fields, err = parse_meta_block(text)
        if err:
            errors.append(f"{index_html.relative_to(REPO_ROOT)}: {err}")
            continue

        note = None
        if fields is None:
            note = (
                f"{index_html.relative_to(REPO_ROOT)}: no bl-game-meta block; "
                "using deterministic fallback values"
            )
        else:
            fallback_fields = [
                field
                for field in REQUIRED_FIELDS
                if field not in fields or fields[field] == ""
            ]
            if fallback_fields:
                note = (
                    f"{index_html.relative_to(REPO_ROOT)}: fallback for missing "
                    f"field(s): {', '.join(fallback_fields)}"
                )

        merged, err = merge_fields(slug, text, fields)
        if err:
            errors.append(f"{index_html.relative_to(REPO_ROOT)}: {err}")
            continue

        if note:
            notes.append(note)

        games.append({
            "title": merged["title"],
            "description": merged["description"],
            "emoji": merged["emoji"],
            "path": f"/projects/games/{slug}/",
            "order": merged["order"],
        })

    if errors:
        print("Games registry build FAILED:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    for note in notes:
        print(f"NOTICE: {note}", file=sys.stderr)

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

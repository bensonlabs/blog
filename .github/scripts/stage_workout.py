#!/usr/bin/env python3
"""Convert a standalone workout page into the blog's project-layout source."""
from __future__ import annotations

import argparse
import html
import re
from pathlib import Path

DOCUMENT_PART = re.compile(r"<(?P<tag>head|body)\b[^>]*>(?P<content>.*?)</(?P=tag)>", re.IGNORECASE | re.DOTALL)
TITLE = re.compile(r"<title[^>]*>(?P<title>.*?)</title>", re.IGNORECASE | re.DOTALL)


def section(document: str, tag: str) -> str:
    for match in DOCUMENT_PART.finditer(document):
        if match.group("tag").lower() == tag:
            return match.group("content").strip()
    raise SystemExit(f"Missing <{tag}> section in standalone workout page")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()

    document = args.source.read_text(encoding="utf-8")
    head = section(document, "head")
    body = section(document, "body")
    title_match = TITLE.search(head)
    title = html.unescape(title_match.group("title").strip()) if title_match else "Workout Plan"
    title = title.replace("\\", "\\\\").replace('"', '\\"')

    front_matter = "\n".join([
        "---",
        "layout: project",
        f'title: "{title}"',
        "head: |",
        *(f"  {line}" for line in head.splitlines()),
        "---",
        "",
    ])
    args.destination.parent.mkdir(parents=True, exist_ok=True)
    args.destination.write_text(front_matter + body + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()

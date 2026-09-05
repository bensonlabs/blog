#!/usr/bin/env bash
# Fails the build if navigation invariants are violated.
#   1. Every standalone app entry page under projects/ contains the canonical
#      nav marker (bl-nav:canonical).
#   2. Every marked standalone app entry page carries the byte-identical
#      canonical snippet from _includes/nav-inject.html.
#   3. No standalone app entry page has a stray "back to blog" link.
#   4. No hand-rolled site header/nav is reintroduced into Jekyll layouts.
# Portable: works on bash 3.2 (stock macOS) and Linux (CI). No mapfile.
set -u

MARKER="bl-nav:canonical"
SNIPPET_FILE="_includes/nav-inject.html"
fail=0
note(){ echo "::error::$1"; fail=1; }

is_excluded(){ case "$1" in vendor/*|_site/*|*/old/*) return 0;; *) return 1;; esac; }
is_redirect_only(){ head -40 "$1" | grep -Eqi '<meta[^>]+http-equiv=.refresh.'; }

snippet_matches(){
  python3 - "$SNIPPET_FILE" "$1" <<'PY'
from pathlib import Path
import sys

snippet_path, page_path = sys.argv[1], sys.argv[2]
marker = "<!-- bl-nav:canonical -->"
snippet = Path(snippet_path).read_text(encoding="utf-8")
page = Path(page_path).read_text(encoding="utf-8")
start = page.find(marker)
if start < 0:
    sys.exit(1)
sys.exit(0 if page.startswith(snippet, start) else 2)
PY
}

if [ ! -f "$SNIPPET_FILE" ]; then
  note "missing canonical snippet source: $SNIPPET_FILE"
fi

# App entry points that MUST carry the snippet:
#   projects/index.html, projects/*/index.html, projects/games/*/index.html
for f in projects/index.html projects/*/index.html projects/games/*/index.html; do
  [ -e "$f" ] || continue
  is_excluded "$f" && continue
  grep -qi '<body' "$f" || continue
  # to-do-app uses layout: default and inherits nav via the include.
  head -5 "$f" | grep -q 'layout:' && continue
  # Redirect-only index pages are handoff shims, not standalone app surfaces.
  is_redirect_only "$f" && continue

  if ! grep -q "$MARKER" "$f"; then
    note "missing canonical nav snippet: $f"
  elif [ -f "$SNIPPET_FILE" ]; then
    if ! snippet_matches "$f"; then
      note "canonical nav snippet differs from $SNIPPET_FILE: $f"
    fi
  fi

  if grep -Eqi 'back to blog|bensonlabs\.org' "$f"; then
    grep -qi 'class="back-link"' "$f" && note "stray back-to-blog link (remove it, nav replaces it): $f"
  fi
done

for f in projects/games/*/index.html; do
  [ -e "$f" ] || continue
  is_excluded "$f" && continue
  grep -qi '<body' "$f" || continue
  is_redirect_only "$f" && continue

  grep -Eqi '<body[^>]*class="[^"]*nav-autohide[^"]*"' "$f" \
    || note "game pages must set <body class=\"nav-autohide\">: $f"
done

# No reintroduced site nav in Jekyll layouts.
for f in _layouts/*.html; do
  [ -e "$f" ] || continue
  grep -qi 'class="site-nav"' "$f" \
    && note "site nav hardcoded in layout (use {% include nav.html %}): $f"
done

if [ "$fail" -ne 0 ]; then echo "Navigation check FAILED."; exit 1; fi
echo "Navigation check passed."

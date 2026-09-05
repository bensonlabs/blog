#!/usr/bin/env bash
# Fails the build if navigation invariants are violated.
#   1. Every standalone app entry page under projects/ contains the canonical
#      nav marker (bl-nav:canonical).
#   2. No standalone app entry page has a stray "back to blog" link.
#   3. No hand-rolled site header/nav is reintroduced into Jekyll layouts.
# Portable: works on bash 3.2 (stock macOS) and Linux (CI). No mapfile.
set -u

MARKER="bl-nav:canonical"
fail=0
note(){ echo "::error::$1"; fail=1; }

is_excluded(){ case "$1" in vendor/*|_site/*|*/old/*) return 0;; *) return 1;; esac; }
is_redirect_only(){ head -40 "$1" | grep -Eqi '<meta[^>]+http-equiv=.refresh.'; }

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

  grep -q "$MARKER" "$f" || note "missing canonical nav snippet: $f"

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

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

app_entry_files(){
  for f in projects/index.html projects/*/index.html; do
    [ -e "$f" ] || continue
    echo "$f"
  done

  if [ -d projects/games ]; then
    for d in projects/games/*; do
      [ -d "$d" ] || continue
      find "$d" -path '*/old/*' -prune -o -name index.html -type f -print
    done
  fi
}

game_entry_files(){
  if [ -d projects/games ]; then
    for d in projects/games/*; do
      [ -d "$d" ] || continue
      find "$d" -path '*/old/*' -prune -o -name index.html -type f -print
    done
  fi
}

extract_marked_snippet(){
  f="$1"
  out="$2"
  awk -v marker="$MARKER" '
    BEGIN { printing=0; found=0 }
    !printing && index($0, marker) > 0 { printing=1; found=1 }
    printing { print }
    printing && $0 ~ /<\/script>[[:space:]]*$/ { printing=0; exit }
    END {
      if (!found || printing) exit 3
    }
  ' "$f" > "$out"
}

if [ ! -f "$SNIPPET_FILE" ]; then
  note "missing canonical snippet source: $SNIPPET_FILE"
fi

targets="$(mktemp "${TMPDIR:-/tmp}/check-nav-targets.XXXXXX")" || exit 1
app_entry_files | sort -u > "$targets"

# App entry points that MUST carry the canonical snippet.
while IFS= read -r f; do
  [ -e "$f" ] || continue
  is_excluded "$f" && continue
  grep -qi '<body' "$f" || continue
  # to-do-app uses layout: default and inherits nav via the include.
  head -5 "$f" | grep -q 'layout:' && continue

  if ! grep -q "$MARKER" "$f"; then
    note "missing canonical nav snippet: $f"
  elif [ -f "$SNIPPET_FILE" ]; then
    tmp="$(mktemp "${TMPDIR:-/tmp}/check-nav-snippet.XXXXXX")" || exit 1
    if ! extract_marked_snippet "$f" "$tmp"; then
      note "unable to extract complete canonical nav snippet: $f"
    elif ! cmp -s "$SNIPPET_FILE" "$tmp"; then
      note "canonical nav snippet differs from $SNIPPET_FILE: $f"
    fi
    rm -f "$tmp"
  fi

  if grep -Eqi 'back to blog|bensonlabs\.org' "$f"; then
    grep -qi 'class="back-link"' "$f" && note "stray back-to-blog link (remove it, nav replaces it): $f"
  fi
done < "$targets"
rm -f "$targets"

game_targets="$(mktemp "${TMPDIR:-/tmp}/check-nav-games.XXXXXX")" || exit 1
game_entry_files | sort -u > "$game_targets"

while IFS= read -r f; do
  [ -e "$f" ] || continue
  is_excluded "$f" && continue
  grep -qi '<body' "$f" || continue

  grep -Eqi '<body[^>]*class="[^"]*nav-autohide[^"]*"' "$f" \
    || note "game pages must set <body class=\"nav-autohide\">: $f"
done < "$game_targets"
rm -f "$game_targets"

# No reintroduced site nav in Jekyll layouts.
for f in _layouts/*.html; do
  [ -e "$f" ] || continue
  grep -qi 'class="site-nav"' "$f" \
    && note "site nav hardcoded in layout (use {% include nav.html %}): $f"
done

if [ "$fail" -ne 0 ]; then echo "Navigation check FAILED."; exit 1; fi
echo "Navigation check passed."

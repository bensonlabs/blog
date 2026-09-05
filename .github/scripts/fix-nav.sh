#!/usr/bin/env bash
# Deterministically injects the canonical standalone-app nav snippet when missing.
# Targets the same app entry pages covered by check-nav.sh.
# Portable: works on bash 3.2 (stock macOS) and Linux (CI).
set -u

MARKER="bl-nav:canonical"
SNIPPET_FILE="_includes/nav-inject.html"
changed=0

is_excluded(){ case "$1" in vendor/*|_site/*|*/old/*) return 0;; *) return 1;; esac; }
is_redirect_only(){ head -40 "$1" | grep -Eqi '<meta[^>]+http-equiv=.refresh.'; }

if [ ! -f "$SNIPPET_FILE" ]; then
  echo "::error::missing canonical snippet source: $SNIPPET_FILE"
  exit 1
fi

insert_snippet_after_body(){
  f="$1"
  tmp="$(mktemp "${TMPDIR:-/tmp}/fix-nav.XXXXXX")" || return 1

  if ! awk -v snippet="$SNIPPET_FILE" '
    BEGIN { inserted=0 }
    {
      print
      if (!inserted && $0 ~ /<[[:space:]]*body([[:space:]>]|$)/) {
        while ((getline line < snippet) > 0) print line
        close(snippet)
        inserted=1
      }
    }
    END {
      if (!inserted) exit 3
    }
  ' "$f" > "$tmp"; then
    rm -f "$tmp"
    echo "::error::unable to insert canonical nav snippet (no <body> tag found): $f"
    return 1
  fi

  if ! cmp -s "$f" "$tmp"; then
    mv "$tmp" "$f"
    echo "fixed canonical nav snippet: $f"
    changed=1
  else
    rm -f "$tmp"
  fi
}

for f in projects/index.html projects/*/index.html projects/games/*/index.html; do
  [ -e "$f" ] || continue
  is_excluded "$f" && continue
  grep -qi '<body' "$f" || continue
  # to-do-app uses layout: default and inherits nav via the include.
  head -5 "$f" | grep -q 'layout:' && continue
  # Redirect-only index pages are handoff shims, not standalone app surfaces.
  is_redirect_only "$f" && continue

  grep -q "$MARKER" "$f" && continue
  insert_snippet_after_body "$f" || exit 1
done

if [ "$changed" -eq 0 ]; then
  echo "No canonical nav fixes needed."
else
  echo "Canonical nav fixes applied."
fi

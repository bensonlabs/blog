#!/usr/bin/env bash
# Deterministically injects or refreshes the canonical standalone-app nav snippet.
# Targets the same app entry pages covered by check-nav.sh.
# Portable: works on bash 3.2 (stock macOS) and Linux (CI).
set -u

MARKER="bl-nav:canonical"
SNIPPET_FILE="_includes/nav-inject.html"
changed=0

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

replace_marked_snippet(){
  f="$1"
  tmp="$(mktemp "${TMPDIR:-/tmp}/fix-nav.XXXXXX")" || return 1

  if ! awk -v marker="$MARKER" -v snippet="$SNIPPET_FILE" '
    BEGIN { replacing=0; replaced=0 }
    !replacing && index($0, marker) > 0 {
      while ((getline line < snippet) > 0) print line
      close(snippet)
      replacing=1
      replaced=1
      next
    }
    replacing {
      if ($0 ~ /<\/script>[[:space:]]*$/) replacing=0
      next
    }
    { print }
    END {
      if (!replaced || replacing) exit 3
    }
  ' "$f" > "$tmp"; then
    rm -f "$tmp"
    echo "::error::unable to replace marked canonical nav snippet: $f"
    return 1
  fi

  if ! cmp -s "$f" "$tmp"; then
    mv "$tmp" "$f"
    echo "refreshed canonical nav snippet: $f"
    changed=1
  else
    rm -f "$tmp"
  fi
}

targets="$(mktemp "${TMPDIR:-/tmp}/fix-nav-targets.XXXXXX")" || exit 1
app_entry_files | sort -u > "$targets"

while IFS= read -r f; do
  [ -e "$f" ] || continue
  is_excluded "$f" && continue
  grep -qi '<body' "$f" || continue
  # to-do-app uses layout: default and inherits nav via the include.
  head -5 "$f" | grep -q 'layout:' && continue

  if grep -q "$MARKER" "$f"; then
    replace_marked_snippet "$f" || { rm -f "$targets"; exit 1; }
  else
    insert_snippet_after_body "$f" || { rm -f "$targets"; exit 1; }
  fi
done < "$targets"
rm -f "$targets"

if [ "$changed" -eq 0 ]; then
  echo "No canonical nav fixes needed."
else
  echo "Canonical nav fixes applied."
fi

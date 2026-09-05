#!/usr/bin/env bash
# Compatibility entrypoint: validate an already-rendered artifact, never rewrite sources.
set -euo pipefail
python3 "$(dirname "$0")/check_rendered_pages.py" "${1:-_site}"

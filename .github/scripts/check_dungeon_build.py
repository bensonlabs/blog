#!/usr/bin/env python3
"""Verify Vite's generated entrypoint and its deployed asset references."""
from pathlib import Path
from check_rendered_pages import Page

root = Path(__file__).resolve().parents[2]
game = root / 'projects/games/dungeon-crawler'
text = (game / 'index.html').read_text()
page = Page(text)
assert page.ids.get('root') == 1, 'React mount is missing or duplicated'
assert not any(token in text for token in ('bl-nav', 'nav-autohide', '/src/main.tsx'))
assert not text.startswith('---\n')
assert any(asset.endswith('.js') for asset in page.assets), 'Missing bundled JavaScript'
assert any(asset.endswith('.css') for asset in page.assets), 'Missing bundled CSS'
for asset in page.assets:
    if asset.startswith('https://'): continue
    assert asset.startswith('/projects/games/dungeon-crawler/assets/'), asset
    assert (root / asset.lstrip('/')).is_file(), f'Missing {asset}'
print('Dungeon React mount and deployed asset paths verified.')

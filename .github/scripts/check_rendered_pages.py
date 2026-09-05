#!/usr/bin/env python3
"""Read-only checks of the actual Jekyll artifact (never inject navigation)."""
import argparse
from html.parser import HTMLParser
from pathlib import Path


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.tags = {}; self.ids = {}; self.links = []; self.in_nav = False
        self.redirect = False; self.assets = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags[tag] = self.tags.get(tag, 0) + 1
        if 'id' in attrs:
            key = attrs['id']; self.ids[key] = self.ids.get(key, 0) + 1
        if tag == 'nav' and attrs.get('id') == 'bl-nav': self.in_nav = True
        if tag == 'a' and self.in_nav: self.links.append(attrs.get('href'))
        if tag == 'meta' and attrs.get('http-equiv', '').lower() == 'refresh': self.redirect = True
        if tag == 'script' and attrs.get('src'): self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet': self.assets.append(attrs['href'])

    def handle_endtag(self, tag):
        if tag == 'nav': self.in_nav = False


def check(site):
    errors = []; checked = 0; reference = None
    required = ['index.html', 'projects/index.html', 'projects/games/index.html',
                'projects/workouts/index.html', 'projects/focus-lab/index.html',
                'projects/gravitas/index.html', 'projects/ai-trending/latest/index.html']
    for path in required:
        if not (site / path).is_file(): errors.append(f'missing rendered page: {path}')
    for path in sorted(site.rglob('*.html')):
        rel = path.relative_to(site); parts = rel.parts
        if 'old' in parts: continue
        text = path.read_text(encoding='utf-8'); page = Page(text)
        game_area = parts[:2] == ('projects', 'games') and len(parts) > 3
        source = Path(__file__).resolve().parents[2] / rel
        game = game_area and (len(parts) == 4 or source.is_file())
        # Generated Markdown documentation in game folders is not an entrypoint.
        # Never require a shared header anywhere inside a standalone game.
        if game_area and not game: continue
        if game:
            if any(token in text for token in ('bl-nav', 'nav-autohide')) or text.startswith('---\n'):
                errors.append(f'{rel}: standalone game contains site-header machinery/front matter')
            continue
        if page.redirect: continue
        checked += 1
        for tag in ('html', 'head', 'body'):
            if page.tags.get(tag) != 1: errors.append(f'{rel}: expected one {tag} shell')
        for key in ('bl-nav', 'bl-nav-toggle', 'bl-nav-links'):
            if page.ids.get(key) != 1: errors.append(f'{rel}: expected one {key}')
        if reference is None: reference = page.links
        elif page.links != reference: errors.append(f'{rel}: header links differ')
        for asset in ('/assets/css/header.css', '/assets/js/header.js'):
            if asset not in page.assets: errors.append(f'{rel}: missing {asset}')
        for href in page.links:
            if href and href.startswith('/') and not (site / href.lstrip('/') / 'index.html').exists():
                errors.append(f'{rel}: missing header link target {href}')
    if errors: raise SystemExit('\n'.join(errors))
    print(f'Rendered checks passed: {checked} normal pages; standalone games need no header.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('site', nargs='?', default='_site')
    check(Path(parser.parse_args().site))

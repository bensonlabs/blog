#!/usr/bin/env python3
"""Read-only checks of the actual Jekyll artifact (never inject navigation)."""
import argparse
import re
from html.parser import HTMLParser
from pathlib import Path

# Project folders that are intentionally static and must NOT carry the
# shared site header/nav. Pages here are hand-authored standalone HTML.
HEADER_ASSETS = ('/assets/css/header.css', '/assets/js/header.js')

STANDALONE_STATIC_DIRS = {
    ('projects', '2ndPaste'),
    ('projects', 'tracro'),
}

# 2ndPaste's and Tracro's support and privacy pages: their URLs are registered in App Store
# Connect, so every release must keep them at exactly these paths (the case counts).
APP_STORE_PAGES = ('projects/2ndPaste/index.html', 'projects/2ndPaste/privacy.html',
                   'projects/tracro/index.html', 'projects/tracro/privacy.html')

class Page(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.tags = {}; self.ids = {}; self.links = []; self.in_nav = False
        self.redirect = False; self.redirect_to = ''; self.assets = []
        # Traces of the shared site header: its elements (ids or classes starting with bl-nav,
        # or the old nav-autohide) or its CSS/JS files. A comment or string that merely
        # mentions bl-nav doesn't count.
        self.site_header = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for name in [attrs.get('id') or '', *(attrs.get('class') or '').split()]:
            if name.startswith('bl-nav') or name == 'nav-autohide':
                self.site_header.append(f'<{tag}> "{name}"')
        source = attrs.get('src') if tag == 'script' else attrs.get('href') if tag == 'link' else None
        if source and (source in HEADER_ASSETS or 'nav-autohide' in source):
            self.site_header.append(f'<{tag}> {source}')
        self.tags[tag] = self.tags.get(tag, 0) + 1
        if 'id' in attrs:
            key = attrs['id']; self.ids[key] = self.ids.get(key, 0) + 1
        if tag == 'nav' and attrs.get('id') == 'bl-nav': self.in_nav = True
        if tag == 'a' and self.in_nav: self.links.append(attrs.get('href'))
        if tag == 'meta' and (attrs.get('http-equiv') or '').lower() == 'refresh':
            self.redirect = True; self.redirect_to = redirect_target(attrs.get('content') or '')
        if tag == 'script' and attrs.get('src'): self.assets.append(attrs['src'])
        if tag == 'link' and attrs.get('rel') == 'stylesheet': self.assets.append(attrs['href'])

    def handle_endtag(self, tag):
        if tag == 'nav': self.in_nav = False


def redirect_target(content):
    """The address in a meta refresh's content ("0; url=/x/"), without its #fragment or ?query."""
    match = re.search(r'url\s*=\s*["\']?([^"\'\s]+)', content, re.IGNORECASE)
    return re.split(r'[#?]', match.group(1))[0] if match else ''


def page_exists(site, page_path, target):
    """Whether a redirect from page_path (a file in site) to target lands on a page in site.
    Addresses on other sites count as present."""
    if not target or re.match(r'[a-z][a-z0-9+.-]*:', target, re.IGNORECASE) or target.startswith('//'):
        return True
    base = site if target.startswith('/') else page_path.parent
    landing = (base / target.lstrip('/')).resolve()
    if site.resolve() not in (landing, *landing.parents):
        return False
    return (landing / 'index.html').is_file() if target.endswith('/') else (
        landing.is_file() or (landing / 'index.html').is_file())


def check(site):
    errors = []; checked = 0; reference = None
    # The home page and the site menu's targets. Other project pages come and go with their
    # component's releases; the menu and redirect checks below catch any that the site still needs.
    required = ['index.html', 'projects/index.html', 'projects/games/index.html',
                'projects/workouts/index.html', 'projects/bootstraps/index.html']
    for path in required:
        if not (site / path).is_file(): errors.append(f'missing rendered page: {path}')
    for path in APP_STORE_PAGES:
        if not (site / path).is_file():
            errors.append(f'missing App Store page: {path} (its URL is registered in App Store Connect)')
    for path in sorted(site.rglob('*.html')):
        rel = path.relative_to(site); parts = rel.parts
        if 'old' in parts: continue
        text = path.read_text(encoding='utf-8'); page = Page(text)
        game_area = parts[:2] == ('projects', 'games') and len(parts) > 3
        source = Path(__file__).resolve().parents[2] / rel
        game = game_area and (len(parts) == 4 or source.is_file())
        standalone_static = parts[:2] in STANDALONE_STATIC_DIRS
        # Generated Markdown documentation in game folders is not an entrypoint.
        # Never require a shared header anywhere inside a standalone game.
        if game_area and not game: continue
        if game:
            if page.site_header or text.startswith('---\n'):
                errors.append(f'{rel}: standalone game contains site-header machinery/front matter')
            continue
        if standalone_static:
            # Intentionally static product pages: never require or allow the
            # shared site header/nav here.
            if page.site_header or text.startswith('---\n'):
                errors.append(f'{rel}: standalone static page contains site-header machinery/front matter')
            continue
        if page.redirect:
            if not page_exists(site, path, page.redirect_to):
                errors.append(f'{rel.as_posix()}: redirects to {page.redirect_to or "nowhere"}, which is missing')
            continue
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
    print(f'Rendered checks passed: {checked} normal pages; standalone games/static pages need no header.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(); parser.add_argument('site', nargs='?', default='_site')
    check(Path(parser.parse_args().site))

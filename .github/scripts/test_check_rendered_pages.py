"""The page check: the site header found by its elements and files (not by mentions of it), the
App Store pages, and a whole small site with its menu pages and redirects."""
import contextlib
import io
import tempfile
import unittest
from pathlib import Path

from check_rendered_pages import APP_STORE_PAGES, Page, check

MENU = ['/', '/projects/', '/projects/games/', '/projects/workouts/', '/projects/bootstraps/', '/about/']


def normal_page(links=MENU, body=''):
    nav = ''.join(f'<a href="{href}">x</a>' for href in links)
    return ('<html><head><link rel="stylesheet" href="/assets/css/header.css">'
            '<script src="/assets/js/header.js"></script></head><body>'
            f'<nav id="bl-nav"><button id="bl-nav-toggle"></button><div id="bl-nav-links">{nav}</div></nav>'
            f'{body}</body></html>')


def redirect(url):
    return f'<html><head><meta http-equiv="refresh" content="0; url={url}"></head><body></body></html>'


class WholeSite(unittest.TestCase):
    """The smallest site the check accepts: the menu's pages with the header, and the App Store pages.
    The other project pages (Focus Lab, Gravitas, AI Trending, ...) may come and go."""

    def check(self, changes=None):
        pages = {(href.strip('/') + '/index.html').lstrip('/'): normal_page() for href in MENU}
        pages.update({rel: '<html><head></head><body>Support</body></html>' for rel in APP_STORE_PAGES})
        pages.update(changes or {})
        with tempfile.TemporaryDirectory() as tmp:
            site = Path(tmp)
            for rel, text in pages.items():
                if text is None:
                    continue
                (site / rel).parent.mkdir(parents=True, exist_ok=True)
                (site / rel).write_text(text, encoding='utf-8')
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    check(site)
            except SystemExit as failed:
                return str(failed.code)
            return ''

    def test_the_menu_pages_and_app_store_pages_are_enough(self):
        self.assertEqual(self.check(), '')

    def test_a_missing_menu_page_fails(self):
        self.assertIn('missing header link target /about/', self.check({'about/index.html': None}))

    def test_every_page_has_the_same_menu(self):
        self.assertIn('header links differ', self.check({'about/index.html': normal_page(MENU[:-1])}))

    def test_a_redirect_must_land_on_a_page(self):
        self.assertEqual(self.check({'bootstraps/index.html': redirect('/projects/bootstraps/')}), '')
        self.assertEqual(self.check({'projects/ai/index.html': redirect('latest/'),
                                     'projects/ai/latest/index.html': normal_page()}), '')
        self.assertIn('bootstraps/index.html: redirects to /projects/bootstraps/workstations/, which is missing',
                      self.check({'bootstraps/index.html': redirect('/projects/bootstraps/workstations/#setup')}))
        self.assertIn('projects/ai/index.html: redirects to latest/, which is missing',
                      self.check({'projects/ai/index.html': redirect('latest/')}))
        self.assertEqual(self.check({'elsewhere/index.html': redirect('https://example.com/')}), '')


class SiteHeader(unittest.TestCase):
    def test_mentions_are_not_the_header(self):
        page = ('<html><body><!-- no bl-nav here --><p>about bl-nav</p>'
                '<script>const note = "bl-nav nav-autohide";</script></body></html>')
        self.assertEqual(Page(page).site_header, [])

    def test_its_elements_and_files_are(self):
        for page in ('<nav id="bl-nav" class="bl-nav"></nav>', '<div class="x bl-nav__links"></div>',
                     '<button id="bl-nav-toggle"></button>', '<div class="nav-autohide"></div>',
                     '<link rel="stylesheet" href="/assets/css/header.css">',
                     '<script src="/assets/js/header.js"></script>'):
            with self.subTest(page=page):
                self.assertTrue(Page(page).site_header)


class AppStorePages(unittest.TestCase):
    """2ndPaste's and Tracro's support and privacy URLs are registered in App Store Connect."""

    def errors(self, pages):
        with tempfile.TemporaryDirectory() as tmp:
            site = Path(tmp)
            for rel in pages:
                (site / rel).parent.mkdir(parents=True, exist_ok=True)
                (site / rel).write_text('<html><head></head><body>Support</body></html>', encoding='utf-8')
            with self.assertRaises(SystemExit) as failed:  # the site's other pages are missing here
                check(site)
            return str(failed.exception.code)

    def test_a_missing_one_fails_the_check(self):
        message = self.errors(APP_STORE_PAGES[1:])
        self.assertIn('missing App Store page: projects/2ndPaste/index.html', message)
        self.assertEqual(message.count('missing App Store page'), 1)

    def test_all_four_present_pass(self):
        self.assertNotIn('missing App Store page', self.errors(APP_STORE_PAGES))


if __name__ == '__main__':
    unittest.main()

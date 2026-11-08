"""The page check finds the site header by its elements and files, not by mentions of it."""
import tempfile
import unittest
from pathlib import Path

from check_rendered_pages import APP_STORE_PAGES, Page, check


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

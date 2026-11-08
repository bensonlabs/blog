"""The page check finds the site header by its elements and files, not by mentions of it."""
import unittest

from check_rendered_pages import Page


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


if __name__ == '__main__':
    unittest.main()

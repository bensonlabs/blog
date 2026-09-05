"""Metadata validation and build invariants; uses fixtures, never edits game sources."""
import contextlib
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import build_games_registry as registry


class RegistryTests(unittest.TestCase):
    def test_metadata_errors(self):
        for text in ('<!-- bl-game-meta\ntitle: A\ntitle: B\n-->',
                     '<!-- bl-game-meta\nwrong: B\n-->',
                     '<!-- bl-game-meta --> <!-- bl-game-meta -->',
                     '<!-- bl-game-meta',
                     '<!-- bl-game-meta --> <!-- bl-game-meta'):
            with self.subTest(text=text): self.assertIsNotNone(registry.parse_meta_block(text)[1])
        for value in (True, 1.5, '1.2', [], {}):
            with self.subTest(order=value):
                self.assertIsNotNone(registry.merge_fields('a', '', {'order': value})[1])

    def test_fallback(self):
        meta, error = registry.merge_fields('foo-bar', '<title>Foo — Benson Labs</title>', {})
        self.assertIsNone(error)
        self.assertEqual(meta, dict(title='Foo', description='Browser game: Foo.', emoji='🎮', order=999))

    def test_compiled_precedence_and_duplicate_json(self):
        with tempfile.TemporaryDirectory() as tmp:
            game = Path(tmp)
            (game / 'index.html').write_text('<title>Generated: must never be read</title>')
            (game / 'index.source.html').write_text('<title>Authored</title><!-- bl-game-meta\ntitle: Legacy\n-->')
            sidecar = game / 'game.json'; sidecar.write_text('{"title":"Sidecar"}')
            _, text, fields = registry.read_metadata(game)
            self.assertEqual(fields['title'], 'Sidecar')
            self.assertNotIn('Generated:', text)
            sidecar.unlink()
            self.assertEqual(registry.read_metadata(game)[2]['title'], 'Legacy')
            for invalid in ('{"title":"A","title":"B"}', '[]', '{', '{"unknown":1}', '{"title":null}'):
                sidecar.write_text(invalid)
                with self.assertRaises(ValueError): registry.read_metadata(game)
            (game / 'index.source.html').unlink()
            (game / 'index.html').write_bytes(b'\xff')  # Generated output is not even opened.
            sidecar.write_text('{"title":"Sidecar"}')
            self.assertEqual(registry.read_metadata(game)[1], '')

    def test_repository_generation_is_deterministic_and_read_only(self):
        files = [p for p in registry.GAMES_DIR.rglob('*') if p.is_file()
                 and not any(part in ('node_modules', 'dist', '.git') for part in p.parts)]
        def hashes(): return {str(p): hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
        before = hashes()
        with tempfile.TemporaryDirectory() as tmp, patch.object(registry, 'OUTPUT_FILE', Path(tmp) / 'games.json'):
            with contextlib.redirect_stdout(io.StringIO()):
                registry.main()
                first_bytes = registry.OUTPUT_FILE.read_bytes()
                registry.main()
            self.assertEqual(first_bytes, registry.OUTPUT_FILE.read_bytes())
            first = json.loads(first_bytes)
            self.assertEqual(len(first), len(registry.find_game_dirs()))
            self.assertEqual(len({g['path'] for g in first}), len(first))
        self.assertEqual(before, hashes())


class ReportTests(unittest.TestCase):
    def test_generator_keeps_redirect_and_writes_latest_and_date(self):
        path = registry.REPO_ROOT / 'projects/ai-trending/fetch_trending.py'
        spec = importlib.util.spec_from_file_location('trending', path)
        trending = importlib.util.module_from_spec(spec); spec.loader.exec_module(trending)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp); (root / 'index.html').write_text('redirect sentinel')
            with patch.object(trending, 'OUTPUT_DIR', tmp), patch.object(trending, 'HTML_FILE', str(root / 'latest/index.html')):
                trending.generate_dashboard([])
            self.assertEqual((root / 'index.html').read_text(), 'redirect sentinel')
            outputs = list(root.glob('*/index.html')); self.assertEqual(len(outputs), 2)
            for output in outputs:
                text = output.read_text()
                self.assertTrue(text.startswith('---\nlayout: project\n'))
                self.assertNotIn('<html', text); self.assertNotIn('<body', text)


if __name__ == '__main__': unittest.main()

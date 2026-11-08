"""Tests for components.py: the version list, refusing bad releases, unpacking safely and wrapping pages."""
import hashlib
import io
import json
import subprocess
import tarfile
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import components

STANDALONE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
  <title>Plan &amp; More "Quoted"</title>
  <style>body { color: red; }</style>
</head>
<body class="theme-obsidian" data-x="1">
<main>
  <p>{% raw %}{{ placeholder }}{% endraw %}</p>
</main>
</body>
</html>
"""


def archive(files):
    """A .tar.gz of {name: text} (or {name: TarInfo-type override} via tuples)."""
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as tar:
        for name, content in files.items():
            if isinstance(content, tuple):  # (type, linkname) for special members
                info = tarfile.TarInfo(name)
                info.type, info.linkname = content
                tar.addfile(info)
                continue
            data = content.encode("utf-8")
            info = tarfile.TarInfo(name)
            info.size = len(data)
            tar.addfile(info, io.BytesIO(data))
    return buffer.getvalue()


def entry(**overrides):
    base = {"name": "games", "repo": "bensonlabs/games", "version": "v1.0.0", "asset": "games-{version}.tar.gz",
            "sha256": "0" * 64, "path": "projects/games", "wrap": ["index.html"]}
    base.update(overrides)
    return base


class Wrap(unittest.TestCase):
    def test_keeps_head_title_lang_and_body_attributes_and_leaves_the_body_alone(self):
        with tempfile.TemporaryDirectory() as tmp:
            page = Path(tmp) / "index.html"
            page.write_text(STANDALONE, encoding="utf-8")
            components.wrap(page)
            text = page.read_text(encoding="utf-8")
        expected = "\n".join([
            "---",
            "layout: project",
            'title: "Plan & More \\"Quoted\\""',
            'lang: "en"',
            'body_attributes: "class=\\"theme-obsidian\\" data-x=\\"1\\""',
            "head: |",
            '  <meta charset="UTF-8" />',
            "    <title>Plan &amp; More \"Quoted\"</title>",
            "    <style>body { color: red; }</style>",
            "---",
            "<main>",
            "  <p>{% raw %}{{ placeholder }}{% endraw %}</p>",
            "</main>",
            "",
        ])
        self.assertEqual(text, expected)

    def test_a_page_without_head_or_body_cannot_be_wrapped(self):
        with tempfile.TemporaryDirectory() as tmp:
            page = Path(tmp) / "index.html"
            page.write_text("<p>just a fragment</p>", encoding="utf-8")
            with self.assertRaises(components.ComponentError):
                components.wrap(page)


class Manifest(unittest.TestCase):
    def load(self, entries):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "components.json"
            path.write_text(json.dumps(entries), encoding="utf-8")
            return components.load_manifest(path)

    def test_accepts_the_real_version_list(self):
        self.assertTrue(components.load_manifest())

    def test_rejects_bad_entries(self):
        bad = [
            [entry(path="../outside")], [entry(path="/projects/games")], [entry(path="projects/./games")],
            [entry(path="projects/games/")], [entry(wrap=["../index.html"])], [entry(sha256="abc")],
            [entry(version="1.0.0")], [entry(asset="games.tar.gz")], [entry(repo="no-owner")],
            [dict(entry(), extra=1)], [entry(), entry()], [entry(), entry(name="other")],
            [entry(), entry(name="inner", path="projects/games/inner")],
        ]
        for entries in bad:
            with self.subTest(entries=entries), self.assertRaises(components.ComponentError):
                self.load(entries)


class Releases(unittest.TestCase):
    def test_a_release_with_another_sha256_is_refused(self):
        data = archive({"index.html": STANDALONE})
        with tempfile.TemporaryDirectory() as tmp, patch.object(components, "CACHE", Path(tmp)), \
                patch.object(components, "download", return_value=data):
            with self.assertRaises(components.ComponentError) as caught:
                components.fetch(entry(sha256=hashlib.sha256(b"something else").hexdigest()))
        self.assertIn("refusing", str(caught.exception))

    def test_unsafe_releases_are_refused_before_anything_is_written(self):
        unsafe = [
            {"ok.html": "x", "../evil.html": "x"},
            {"ok.html": "x", "/abs.html": "x"},
            {"ok.html": "x", "link": (tarfile.SYMTYPE, "/etc/passwd")},
            {"ok.html": "x", "hard": (tarfile.LNKTYPE, "ok.html")},
        ]
        for files in unsafe:
            with self.subTest(files=list(files)), tempfile.TemporaryDirectory() as tmp:
                with self.assertRaises(components.ComponentError):
                    components.unpack(archive(files), Path(tmp))
                self.assertEqual(list(Path(tmp).iterdir()), [])


class Assemble(unittest.TestCase):
    def test_replaces_the_folder_and_wraps_the_listed_pages(self):
        data = archive({"index.html": STANDALONE, "game/index.html": "<html><body>game</body></html>"})
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            manifest = root / "components.json"
            manifest.write_text(json.dumps([entry(sha256=hashlib.sha256(data).hexdigest())]), encoding="utf-8")
            stale = root / "projects/games/old-game/index.html"
            stale.parent.mkdir(parents=True)
            stale.write_text("from an older release", encoding="utf-8")
            with patch.object(components, "CACHE", root / "cache"), \
                    patch.object(components, "download", return_value=data) as download:
                components.assemble(root, manifest)
                components.assemble(root, manifest)  # second run comes from the cache
            self.assertEqual(download.call_count, 1)
            self.assertFalse(stale.exists())
            self.assertTrue((root / "projects/games/index.html").read_text(encoding="utf-8").startswith("---\nlayout: project\n"))
            self.assertEqual((root / "projects/games/game/index.html").read_text(encoding="utf-8"), "<html><body>game</body></html>")

    def test_refuses_a_folder_with_committed_files(self):
        data = archive({"index.html": STANDALONE})
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            subprocess.run(["git", "init", "-q"], cwd=root, check=True)
            kept = root / "projects/games/keep.html"
            kept.parent.mkdir(parents=True)
            kept.write_text("committed", encoding="utf-8")
            subprocess.run(["git", "add", "."], cwd=root, check=True)
            with self.assertRaises(components.ComponentError):
                components.place(entry(sha256=hashlib.sha256(data).hexdigest()), data, root)
            self.assertTrue(kept.exists())


class WrapFromRelease(unittest.TestCase):
    def test_the_release_lists_the_pages_and_the_list_is_not_published(self):
        data = archive({"index.html": STANDALONE, "game/index.html": "<html><body>game</body></html>",
                        components.WRAP_FILE: json.dumps(["index.html"])})
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            components.place(entry(wrap="release", sha256=hashlib.sha256(data).hexdigest()), data, root)
            folder = root / "projects/games"
            self.assertTrue((folder / "index.html").read_text(encoding="utf-8").startswith("---\nlayout: project\n"))
            self.assertEqual((folder / "game/index.html").read_text(encoding="utf-8"), "<html><body>game</body></html>")
            self.assertFalse((folder / components.WRAP_FILE).exists())

    def test_a_release_without_its_list_is_refused(self):
        data = archive({"index.html": STANDALONE})
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(components.ComponentError):
                components.place(entry(wrap="release", sha256=hashlib.sha256(data).hexdigest()), data, Path(tmp))

    def test_the_version_list_accepts_release(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "components.json"
            path.write_text(json.dumps([entry(wrap="release")]), encoding="utf-8")
            self.assertEqual(components.load_manifest(path)[0]["wrap"], "release")
            path.write_text(json.dumps([entry(wrap="everything")]), encoding="utf-8")
            with self.assertRaises(components.ComponentError):
                components.load_manifest(path)


class Bump(unittest.TestCase):
    def test_records_the_new_version_and_its_sha256(self):
        data = archive({"index.html": STANDALONE})
        digest = hashlib.sha256(data).hexdigest()
        responses = {"https://github.com/bensonlabs/games/releases/download/v1.1.0/games-v1.1.0.tar.gz": data,
                     "https://github.com/bensonlabs/games/releases/download/v1.1.0/games-v1.1.0.tar.gz.sha256":
                         f"{digest}  games-v1.1.0.tar.gz\n".encode()}
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "components.json"
            manifest.write_text(json.dumps([entry()]), encoding="utf-8")
            with patch.object(components, "download", side_effect=responses.__getitem__):
                components.bump("games", "v1.1.0", manifest)
            saved = json.loads(manifest.read_text(encoding="utf-8"))[0]
        self.assertEqual((saved["version"], saved["sha256"]), ("v1.1.0", digest))

    def test_refuses_a_release_whose_own_sha256_differs(self):
        data = archive({"index.html": STANDALONE})
        responses = {"https://github.com/bensonlabs/games/releases/download/v1.1.0/games-v1.1.0.tar.gz": data,
                     "https://github.com/bensonlabs/games/releases/download/v1.1.0/games-v1.1.0.tar.gz.sha256":
                         b"0000  games-v1.1.0.tar.gz\n"}
        with tempfile.TemporaryDirectory() as tmp:
            manifest = Path(tmp) / "components.json"
            manifest.write_text(json.dumps([entry()]), encoding="utf-8")
            with patch.object(components, "download", side_effect=responses.__getitem__):
                with self.assertRaises(components.ComponentError):
                    components.bump("games", "v1.1.0", manifest)
            self.assertEqual(json.loads(manifest.read_text(encoding="utf-8"))[0]["version"], "v1.0.0")


class Update(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.manifest = self.root / "components.json"
        self.manifest.write_text(json.dumps([entry()]), encoding="utf-8")
        data = archive({"index.html": STANDALONE})
        self.digest = hashlib.sha256(data).hexdigest()
        base = "https://github.com/bensonlabs/games/releases/download"
        self.responses = {}
        for version in ("v1.0.1", "v0.9.0"):
            self.responses[f"{base}/{version}/games-{version}.tar.gz"] = data
            self.responses[f"{base}/{version}/games-{version}.tar.gz.sha256"] = f"{self.digest}  x".encode()
        self.patches = [patch.object(components, "CACHE", self.root / "cache"),
                        patch.object(components, "download", side_effect=self.responses.__getitem__)]
        for p in self.patches:
            p.start()

    def tearDown(self):
        for p in self.patches:
            p.stop()
        self.tmp.cleanup()

    def pinned(self):
        return json.loads(self.manifest.read_text(encoding="utf-8"))[0]["version"]

    def test_pins_the_newest_release_and_leaves_a_commit_message(self):
        with patch.object(components, "latest_version", return_value="v1.0.1"):
            self.assertEqual(components.update("all", manifest=self.manifest), ["games v1.0.0 -> v1.0.1"])
        self.assertEqual(self.pinned(), "v1.0.1")
        message = (self.root / "cache" / "commit-message.txt").read_text(encoding="utf-8")
        self.assertTrue(message.startswith("Pin games v1.0.1"))

    def test_a_given_version_for_one_component(self):
        self.assertEqual(components.update("games", "v1.0.1", self.manifest), ["games v1.0.0 -> v1.0.1"])

    def test_nothing_changes_when_the_newest_is_already_pinned(self):
        with patch.object(components, "latest_version", return_value="v1.0.0"):
            self.assertEqual(components.update("all", manifest=self.manifest), [])
        self.assertEqual(self.pinned(), "v1.0.0")
        self.assertFalse((self.root / "cache" / "commit-message.txt").exists())

    def test_never_moves_a_pin_backwards(self):
        self.assertEqual(components.update("games", "v0.9.0", self.manifest), [])
        self.assertEqual(self.pinned(), "v1.0.0")

    def test_a_specific_version_needs_one_component(self):
        with self.assertRaises(components.ComponentError):
            components.update("all", "v1.0.1", self.manifest)


if __name__ == "__main__":
    unittest.main()

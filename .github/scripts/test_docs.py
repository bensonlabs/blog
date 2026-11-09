"""The docs cite only repo paths that exist (the same check bensonlabs/games and projects have).

Checks README.md, CONTRIBUTING.md, CLAUDE.md, .github/copilot-instructions.md, docs/** and
.claude/skills/**: every path in `backticks` that starts with one of this repo's folders must
exist. A path with a placeholder in it (`_posts/<yyyy-mm-dd>-<slug>.md`,
`docs/decisions/NNNN-<slug>.md`) is a pattern: the folder before its first placeholder must exist.
A decision record cited by its number (`docs/decisions/0002`) must match exactly one record. The
folders the build assembles from releases (projects/, bootstraps/) aren't in the repo, so they
aren't checked, nor is .claude/worktrees/, made when needed. The docs are Markdown, not code, so
a pattern finds the `code spans`.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ("README.md", "CONTRIBUTING.md", "CLAUDE.md", ".github/copilot-instructions.md",
        "docs/**/*.md", ".claude/skills/**/*.md")
PREFIXES = (".github/", "_layouts/", "_includes/", "_data/", "_posts/", "_sass/", "assets/", "docs/", ".claude/")
# Folders made when needed and never committed (the kickoff skill puts worktrees here).
NOT_IN_REPO = (".claude/worktrees/",)
CODE_SPAN = re.compile(r"`([^`\n]+)`")
PLACEHOLDER = re.compile(r"<[^>]*>|\*|\{|N{4}")
DECISION_NUMBER = re.compile(r"docs/decisions/(\d{4})")


def cited_paths(text: str) -> list[str]:
    """The repo paths in a Markdown text's code spans, one per word that starts like one."""
    paths = []
    for span in CODE_SPAN.findall(text):
        for word in span.split():
            word = word.strip("'\"(),:;").rstrip(".")  # keep a leading dot: .github/, .claude/
            if word.startswith(PREFIXES) and not word.startswith(NOT_IN_REPO):
                paths.append(word)
    return paths


def exists(path: str, root: Path = ROOT) -> bool:
    placeholder = PLACEHOLDER.search(path)
    if placeholder:
        return (root / path[:placeholder.start()].rpartition("/")[0]).is_dir()
    number = DECISION_NUMBER.fullmatch(path)
    if number:
        return len(list((root / "docs" / "decisions").glob(f"{number.group(1)}-*.md"))) == 1
    return (root / path).exists()


class DocPaths(unittest.TestCase):
    def test_every_repo_path_the_docs_cite_exists(self):
        docs = sorted({path for pattern in DOCS for path in ROOT.glob(pattern)})
        self.assertIn(ROOT / "README.md", docs)
        self.assertIn(ROOT / "CONTRIBUTING.md", docs)
        missing = [f"{doc.relative_to(ROOT).as_posix()}: `{path}`"
                   for doc in docs for path in cited_paths(doc.read_text(encoding="utf-8")) if not exists(path)]
        self.assertEqual(missing, [], "the docs cite paths that don't exist")

    def test_finds_paths_in_code_spans_and_judges_them(self):
        text = ("Run `python3 .github/scripts/components.py assemble`, see `_data/components.json`, and not "
                "_layouts/outside-backticks.html or `https://example.com/_data/x`.")
        self.assertEqual(cited_paths(text), [".github/scripts/components.py", "_data/components.json"])
        for path in (".github/scripts/components.py", "_posts/<yyyy-mm-dd>-<slug>.md", "docs/decisions/NNNN-<slug>.md",
                     "docs/decisions/0001", "_data/navigation.yml"):
            with self.subTest(path=path):
                self.assertTrue(exists(path))
        for path in (".github/scripts/no-such-script.py", "docs/decisions/0099", "_posts/no-such-folder/<slug>.md"):
            with self.subTest(path=path):
                self.assertFalse(exists(path))


if __name__ == "__main__":
    unittest.main()

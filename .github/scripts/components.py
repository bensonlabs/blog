#!/usr/bin/env python3
"""Put the site's components in place, and pin new releases of them.

    python3 .github/scripts/components.py assemble             # before every Jekyll build
    python3 .github/scripts/components.py bump games v1.2.0    # pin another release
    python3 .github/scripts/components.py update all           # pin each component's newest release

A component is a part of the site that another repository owns and publishes as
a GitHub release: one .tar.gz, pinned in _data/components.json by version and
sha256. `assemble` downloads each pinned release (cached in .components-cache/),
refuses it if its sha256 differs, unpacks it into its folder (nothing may land
outside it), and wraps the pages the entry lists in the `project` layout, which
adds the site header. The PR check, the deploy and local runs all use this one
script. A wrapped page's body still goes through Liquid, so its own {% raw %}
blocks keep working.

`bump` downloads a release, checks it against the release's own .sha256 file,
checks that it unpacks cleanly and has the pages to wrap, and records its
version and sha256. `update` bumps to a component's newest release (or a given
one), never backwards, and leaves a commit message for the Update components
workflow, which builds and checks the site before it commits the pin and deploys.
"""
from __future__ import annotations

import argparse
import hashlib
import html
import io
import json
import re
import shutil
import subprocess
import sys
import tarfile
import tempfile
import os
import time
import urllib.error
import urllib.request
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "_data" / "components.json"
CACHE = ROOT / ".components-cache"
FIELDS = ("name", "repo", "version", "asset", "sha256", "path", "wrap")
NAME_RE = re.compile(r"[a-z0-9][a-z0-9-]*")
REPO_RE = re.compile(r"[A-Za-z0-9-]+/[A-Za-z0-9._-]+")
VERSION_RE = re.compile(r"v\d+\.\d+\.\d+")
SHA256_RE = re.compile(r"[0-9a-f]{64}")
# With "wrap": "release", the release lists the pages to wrap in this file at its root.
WRAP_FILE = ".components-wrap.json"

# The same document parts stage_workout.py read before components existed.
DOCUMENT_PART = re.compile(
    r"<(?P<tag>head|body)\b(?P<attrs>[^>]*)>(?P<content>.*?)</(?P=tag)>", re.IGNORECASE | re.DOTALL)
HTML_TAG = re.compile(r"<html\b(?P<attrs>[^>]*)>", re.IGNORECASE)
LANG_ATTR = re.compile(r"""\blang\s*=\s*["']([^"']+)["']""", re.IGNORECASE)
TITLE = re.compile(r"<title[^>]*>(?P<title>.*?)</title>", re.IGNORECASE | re.DOTALL)


class ComponentError(Exception):
    pass


def safe_relative(path_text: str) -> PurePosixPath:
    """A relative path that stays inside its folder: no absolute paths, '..', '.' or empty parts."""
    if (not isinstance(path_text, str) or not path_text or path_text.startswith("/")
            or "\\" in path_text or ":" in path_text
            or any(part in ("", ".", "..") for part in path_text.split("/"))):
        raise ComponentError(f"unsafe path {path_text!r}")
    return PurePosixPath(path_text)


def load_manifest(path: Path = MANIFEST) -> list[dict]:
    entries = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(entries, list):
        raise ComponentError(f"{path.name}: expected a list of components")
    names: set[str] = set()
    paths: list[PurePosixPath] = []
    for entry in entries:
        if not isinstance(entry, dict) or sorted(entry) != sorted(FIELDS):
            raise ComponentError(f"{path.name}: each component needs exactly these fields: {', '.join(FIELDS)}")
        name = entry["name"]
        strings = all(isinstance(entry[field], str) for field in FIELDS if field != "wrap")
        checks = [
            (strings, "field (all but wrap are text)"),
            (strings and NAME_RE.fullmatch(name), "name"),
            (strings and REPO_RE.fullmatch(entry["repo"]), "repo"),
            (strings and VERSION_RE.fullmatch(entry["version"]), "version (like v1.2.0)"),
            (strings and "{version}" in entry["asset"] and "/" not in entry["asset"], "asset (a file name with {version})"),
            (strings and SHA256_RE.fullmatch(entry["sha256"]), "sha256"),
            (isinstance(entry["wrap"], list) or entry["wrap"] == "release",
             "wrap (a list of pages, or \"release\" to use the release's own list)"),
        ]
        for ok, field in checks:
            if not ok:
                raise ComponentError(f"{name!r}: invalid {field}")
        paths.append(safe_relative(entry["path"]))
        for page in entry["wrap"] if isinstance(entry["wrap"], list) else []:
            safe_relative(page)
        if name in names:
            raise ComponentError(f"{name}: listed twice")
        names.add(name)
    for a in paths:
        for b in paths:
            if a is not b and (a == b or a in b.parents):
                raise ComponentError(f"components overlap: {a} and {b}")
    return entries


def asset_url(entry: dict) -> str:
    asset = entry["asset"].replace("{version}", entry["version"])
    return f"https://github.com/{entry['repo']}/releases/download/{entry['version']}/{asset}"


def download(url: str) -> bytes:
    last: Exception | None = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=60) as response:
                return response.read()
        except urllib.error.HTTPError as error:
            if error.code == 404:
                raise ComponentError(f"{url}: not found (is the release published?)") from error
            last = error
        except OSError as error:
            last = error
        time.sleep(2 * (attempt + 1))
    raise ComponentError(f"could not download {url}: {last}")


def fetch(entry: dict) -> bytes:
    """The pinned release file: from the cache if its sha256 matches, otherwise downloaded."""
    cached = CACHE / f"{entry['sha256']}.tar.gz"
    if cached.is_file():
        data = cached.read_bytes()
        if hashlib.sha256(data).hexdigest() == entry["sha256"]:
            return data
    data = download(asset_url(entry))
    actual = hashlib.sha256(data).hexdigest()
    if actual != entry["sha256"]:
        raise ComponentError(
            f"{entry['name']} {entry['version']}: the release's sha256 is {actual}, but "
            f"_data/components.json pins {entry['sha256']}; refusing it")
    CACHE.mkdir(exist_ok=True)
    cached.write_bytes(data)
    return data


def unpack(data: bytes, dest: Path) -> list[str]:
    """Unpack a release into dest. Only files and folders, all inside dest; checked before writing."""
    files = []
    with tarfile.open(fileobj=io.BytesIO(data), mode="r:gz") as tar:
        members = tar.getmembers()
        for member in members:
            if not (member.isfile() or member.isdir()):
                raise ComponentError(f"{member.name}: a release may contain only files and folders")
            safe_relative(member.name.rstrip("/") if member.isdir() else member.name)
        for member in members:
            if member.isfile():
                target = dest.joinpath(*PurePosixPath(member.name).parts)
                target.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(member) as source:
                    target.write_bytes(source.read())
                files.append(member.name)
    if not files:
        raise ComponentError("the release is empty")
    return files


def yaml_string(value: str) -> str:
    return '"' + value.replace("\\", "\\\\").replace('"', '\\"') + '"'


def wrap(page: Path) -> None:
    """Turn a standalone page into a `project` layout page (the site header plus the page).

    Keeps the page's head (with its <title>), its <html lang> and its <body> attributes;
    the body itself is kept as it is and still goes through Liquid, as it always did."""
    document = page.read_text(encoding="utf-8")
    parts = {}
    for match in DOCUMENT_PART.finditer(document):
        parts.setdefault(match.group("tag").lower(), match)
    if "head" not in parts or "body" not in parts:
        raise ComponentError(f"{page}: needs a <head> and a <body> to be wrapped")
    head = parts["head"].group("content").strip()
    body = parts["body"].group("content").strip()
    title_match = TITLE.search(head)
    title = html.unescape(title_match.group("title").strip()) if title_match else "Benson Labs"

    lines = ["---", "layout: project", f"title: {yaml_string(title)}"]
    html_tag = HTML_TAG.search(document)
    lang = LANG_ATTR.search(html_tag.group("attrs")) if html_tag else None
    if lang:
        lines.append(f"lang: {yaml_string(lang.group(1))}")
    body_attributes = parts["body"].group("attrs").strip()
    if body_attributes:
        lines.append(f"body_attributes: {yaml_string(body_attributes)}")
    lines.append("head: |")
    lines += [f"  {line}" for line in head.splitlines()]
    lines += ["---", ""]
    page.write_text("\n".join(lines) + body + "\n", encoding="utf-8", newline="\n")


def pages_to_wrap(entry: dict, folder: Path, files: list[str]) -> list[str]:
    """The pages to wrap: listed in the entry, or by the release itself (and that list isn't published)."""
    if entry["wrap"] != "release":
        return entry["wrap"]
    if WRAP_FILE not in files:
        raise ComponentError(f"{entry['name']} {entry['version']} has no {WRAP_FILE} listing the pages to wrap")
    listed = json.loads((folder / WRAP_FILE).read_text(encoding="utf-8"))
    if not isinstance(listed, list):
        raise ComponentError(f"{WRAP_FILE} must be a list of pages")
    for page in listed:
        safe_relative(page)
    (folder / WRAP_FILE).unlink()
    return listed


def tracked_files(root: Path, folder: Path) -> list[str]:
    result = subprocess.run(["git", "ls-files", "--", folder.relative_to(root).as_posix()],
                            cwd=root, capture_output=True, text=True)
    return result.stdout.split() if result.returncode == 0 else []


def place(entry: dict, data: bytes, root: Path) -> list[str]:
    """Replace the component's folder with the release, then wrap the listed pages."""
    folder = root.joinpath(*safe_relative(entry["path"]).parts)
    tracked = tracked_files(root, folder)
    if tracked:
        raise ComponentError(
            f"{entry['path']}/ holds files committed to this repo ({tracked[0]}, ...); "
            f"a component's folder must be ignored by git, because assembling replaces it")
    if folder.exists():
        shutil.rmtree(folder)
    files = unpack(data, folder)
    for page in pages_to_wrap(entry, folder, files):
        if page not in files:
            raise ComponentError(f"{entry['name']} {entry['version']} has no {page} to wrap")
        wrap(folder.joinpath(*PurePosixPath(page).parts))
    return files


def assemble(root: Path = ROOT, manifest: Path = MANIFEST) -> None:
    for entry in load_manifest(manifest):
        files = place(entry, fetch(entry), root)
        print(f"{entry['name']} {entry['version']}: {len(files)} files in /{entry['path']}/, "
              f"{len(entry['wrap'])} wrapped in the site header")


def bump(name: str, version: str, manifest: Path = MANIFEST) -> None:
    entries = load_manifest(manifest)
    entry = next((e for e in entries if e["name"] == name), None)
    if entry is None:
        raise ComponentError(f"no component named {name!r} in {manifest.name}")
    if not VERSION_RE.fullmatch(version):
        raise ComponentError(f"version must look like v1.2.0, not {version!r}")
    candidate = dict(entry, version=version)
    url = asset_url(candidate)
    data = download(url)
    sha256 = hashlib.sha256(data).hexdigest()
    published = download(url + ".sha256").decode("utf-8").split()[0]
    if published != sha256:
        raise ComponentError(f"{url}: downloaded sha256 {sha256} differs from the release's own {published}")
    with tempfile.TemporaryDirectory() as tmp:
        files = unpack(data, Path(tmp))
        wanted = pages_to_wrap(candidate, Path(tmp), files)
    missing = [page for page in wanted if page not in files]
    if missing:
        raise ComponentError(f"{name} {version} has no {', '.join(missing)} to wrap")
    old = f"{entry['version']} ({entry['sha256'][:12]})"
    entry.update(version=version, sha256=sha256)
    manifest.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + "\n", encoding="utf-8", newline="\n")
    print(f"{name}: {old} -> {version} ({sha256[:12]}), {len(files)} files. Commit {manifest.name} and open a PR.")


def version_key(version: str) -> tuple[int, int, int]:
    if not VERSION_RE.fullmatch(version):
        raise ComponentError(f"version must look like v1.2.0, not {version!r}")
    major, minor, patch = (int(part) for part in version[1:].split("."))
    return major, minor, patch


def latest_version(repo: str) -> str:
    """The tag of the repo's newest release, from GitHub's API (with a token when one is set)."""
    request = urllib.request.Request(f"https://api.github.com/repos/{repo}/releases/latest",
                                     headers={"Accept": "application/vnd.github+json"})
    token = os.environ.get("GH_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if token:
        request.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            return json.load(response)["tag_name"]
    except (OSError, KeyError, ValueError) as error:
        raise ComponentError(f"could not read the newest release of {repo}: {error}") from error


def update(name: str, version: str = "latest", manifest: Path = MANIFEST) -> list[str]:
    """Pin the newest release of one component (or all), or a given version; never backwards.

    Returns what changed, and leaves a commit message in .components-cache/ when something did."""
    entries = load_manifest(manifest)
    if name == "all" and version != "latest":
        raise ComponentError("a specific version needs one component's name, not all")
    targets = entries if name == "all" else [e for e in entries if e["name"] == name]
    if not targets:
        raise ComponentError(f"no component named {name!r} in {manifest.name}")
    changes = []
    for entry in targets:
        current = entry["version"]
        wanted = latest_version(entry["repo"]) if version == "latest" else version
        if version_key(wanted) == version_key(current):
            print(f"{entry['name']}: {current} is already pinned.")
            continue
        if version_key(wanted) < version_key(current):
            print(f"{entry['name']}: {wanted} is older than the pinned {current}; left alone.")
            continue
        bump(entry["name"], wanted, manifest)
        changes.append(f"{entry['name']} {current} -> {wanted}")
    if changes:
        CACHE.mkdir(exist_ok=True)
        names = ", ".join(change.split(" -> ")[0].split(" ")[0] + " " + change.split(" -> ")[1] for change in changes)
        (CACHE / "commit-message.txt").write_text(
            f"Pin {names}\n\n" + "\n".join(changes) + "\n\n"
            "Pinned by the Update components workflow after the site built and passed its checks.\n",
            encoding="utf-8", newline="\n")
    return changes


def main() -> None:
    parser = argparse.ArgumentParser(description="Assemble the site's components, or pin a new release of one.")
    commands = parser.add_subparsers(dest="command", required=True)
    commands.add_parser("assemble", help="put every pinned component in place (before Jekyll)")
    bump_parser = commands.add_parser("bump", help="pin another release of a component")
    bump_parser.add_argument("name")
    bump_parser.add_argument("version")
    update_parser = commands.add_parser("update", help="pin the newest (or a given) release; never backwards")
    update_parser.add_argument("name", help="a component's name, or all")
    update_parser.add_argument("version", nargs="?", default="latest")
    args = parser.parse_args()
    try:
        if args.command == "assemble":
            assemble()
        elif args.command == "update":
            update(args.name, args.version)
        else:
            bump(args.name, args.version)
    except ComponentError as error:
        sys.exit(f"components: {error}")


if __name__ == "__main__":
    main()

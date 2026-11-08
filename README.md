# bensonlabs.org blog

Personal blog and projects at [bensonlabs.org](https://bensonlabs.org): troubleshooting fixes, technical notes, browser games, projects, workout plans and workstation guides.

Built with [Jekyll](https://jekyllrb.com) and hosted on [GitHub Pages](https://pages.github.com).

---

## Adding Content

| To add | Where | How |
|---|---|---|
| A blog post | this repo, `_posts/` | the `add-post` skill (`.claude/skills/add-post/`), or by hand: "Adding a New Blog Post" below |
| A game | [bensonlabs/games](https://github.com/bensonlabs/games) | its `add-game` skill |
| A project, workout plan or Bootstraps guide | [bensonlabs/projects](https://github.com/bensonlabs/projects) | its `add` skill |

A push to either of those repositories that changes what the site shows goes live by itself:
the repository publishes a release, and this repo's Update components workflow pins it, checks
the whole site and deploys (CONTRIBUTING.md, "Headers, project pages, and components").

---

## Tech Stack

- **Static Site Generator**: Jekyll (Ruby)
- **Hosting**: GitHub Pages
- **Styling**: Custom CSS with Obsidian dark theme
- **Games**: Standalone HTML/CSS/JavaScript games, one React, TypeScript and Vite game, and one Rust game compiled to WebAssembly (all in bensonlabs/games)
- **Version Control**: Git + GitHub

---

## Site Sections

Posts and About live in this repo. Everything under `/projects/` comes from two other
repositories: the games from [bensonlabs/games](https://github.com/bensonlabs/games), and the
Projects page, each project, Workouts and Bootstraps from
[bensonlabs/projects](https://github.com/bensonlabs/projects). The Projects page
([bensonlabs.org/projects/](https://bensonlabs.org/projects/)) lists them all. 2ndPaste's and
Tracro's support and privacy pages are App Store URLs, registered in App Store Connect: their
addresses must never change (CONTRIBUTING.md, "Headers, project pages, and components").

### **Blog** (`/`)
Technical troubleshooting and notes on Windows, PowerShell, networking, security, and more.

### **Games** (`/projects/games/`)
Interactive browser games. The current catalogue is maintained at [bensonlabs.org/projects/games/](https://bensonlabs.org/projects/games/).

Games are built and released in [bensonlabs/games](https://github.com/bensonlabs/games) and pinned here in `_data/components.json`; see CONTRIBUTING.md, "Headers, project pages, and components".

### **Projects, Workouts and Bootstraps** (`/projects/`)
Each project, the workout plans and the Bootstraps guides come from
[bensonlabs/projects](https://github.com/bensonlabs/projects), and each one's card there describes
it; the [Projects page](https://bensonlabs.org/projects/) lists them all. The old `/bootstraps/`
address redirects to the first guide, `/projects/bootstraps/workstations/`.

---

## Design & Styling

The site uses a custom **Obsidian dark theme** color palette for a consistent, modern aesthetic:

- **Background**: `#1e1e1e` (deep dark)
- **Surface**: `#252525` (card backgrounds)
- **Card**: `#2d2d2d` (game cards)
- **Border**: `#3a3a3a` (dividers & borders)
- **Accent**: `#7c3aed` (purple - primary actions)
- **Accent 2**: `#a78bfa` (light purple - links & hover states)
- **Text**: `#dcddde` (light gray - readable on dark)
- **Muted**: `#888` (secondary text)

The blog and project hubs use responsive layouts. Mobile controls and orientation requirements vary by game and project. Gravitas provides Controls and Telemetry buttons to access its sidebars on narrow screens.

---

## Adding a New Blog Post (Obsidian + GitHub Workflow)

### 1. Write in Obsidian

Create a new Markdown file anywhere in your Obsidian vault. Write your post using standard Markdown.

### 2. Add YAML Frontmatter

At the top of the file, add this block:

```yaml
---
layout: post
title: "Your Post Title Here"
date: YYYY-MM-DD
author: Justin Benson
categories: [category1, category2]
---
```

**Example:**

```yaml
---
layout: post
title: "Fix Windows Update stuck on 0%"
date: 2026-05-15
author: Justin Benson
categories: [windows, troubleshooting]
---
```

### 3. Rename and Move the File

Rename your file using the Jekyll naming convention:

```
YYYY-MM-DD-your-post-title.md
```

Example: `2026-05-15-fix-windows-update-stuck.md`

Place it in the `_posts/` folder of this repository.

### 4. Commit and Push

```bash
git add _posts/2026-05-15-fix-windows-update-stuck.md
git commit -m "Add post: Fix Windows Update stuck on 0%"
git push
```

Pushing to `master` triggers the **Deploy Jekyll to GitHub Pages** workflow. If you push a feature branch, merge it into `master` to publish. The site updates after the build and deployment succeed; check GitHub Actions for progress and errors.

---

## Adding a New Game

Games are built and released in [bensonlabs/games](https://github.com/bensonlabs/games); its
README and its `add-game` skill explain how to add one. A new release goes live by itself: the
games repo asks this repo's Update components workflow to pin it, check the whole site and
deploy (CONTRIBUTING.md, "Headers, project pages, and components").

---

## Headers, project pages, and components

The rules for the site header, project pages and the components (everything under
/projects/, which comes from two other repositories as pinned releases) are in
[CONTRIBUTING.md](CONTRIBUTING.md#headers-project-pages-and-components), section
"Headers, project pages, and components". Read it before changing layouts, project
pages, `_data/components.json` or `.github/scripts/components.py`. Games are built in
[bensonlabs/games](https://github.com/bensonlabs/games) and the rest of /projects/ in
[bensonlabs/projects](https://github.com/bensonlabs/projects), never here.

## Local Development (Optional)

If you want to preview the site locally before pushing:

```bash
# Install dependencies (first time only)
bundle install

# Put the components (everything under /projects/) in place, then run the local server
python3 .github/scripts/components.py assemble
bundle exec jekyll serve

# Open in browser
open http://localhost:4000
```

---

## Suggested Blog Categories

| Category | Use for |
|----------|---------|
| `windows` | Windows OS issues |
| `powershell` | PowerShell scripts |
| `macos` | macOS issues |
| `linux` | Linux / Ubuntu |
| `networking` | Network troubleshooting |
| `active-directory` | AD / domain issues |
| `security` | Malware removal, security fixes |
| `misc` | Anything else |

---

## Project Structure

```
blog/
├── _config.yml          # Jekyll configuration
├── _data/
│   ├── navigation.yml   # Shared-header links
│   └── components.json  # The projects and games releases this site pins
├── _includes/
│   ├── nav.html         # Sole shared-header markup source
│   └── blog-head.html   # Default blog head elements
├── _layouts/
│   ├── base.html        # HTML document shell and shared header
│   ├── default.html     # Blog container and footer; inherits base
│   ├── post.html        # Blog post content; inherits default
│   └── project.html     # Project content without a width wrapper; inherits base
├── _posts/              # All blog posts (Markdown)
│   └── YYYY-MM-DD-title.md
├── assets/
│   ├── css/
│   │   ├── main.css     # Blog styles (Obsidian dark theme)
│   │   └── header.css   # Shared-header styles
│   └── js/
│       └── header.js    # Shared-header mobile menu behavior
├── projects/            # Built from bensonlabs/projects (ignored by git)
│   └── games/           # Built from bensonlabs/games (ignored by git)
├── bootstraps/          # Redirects the old /bootstraps/ address to the first guide
├── about.md             # About page
├── docs/decisions/      # Why the site is built the way it is
├── index.html           # Blog homepage (post list)
├── CNAME                # Custom domain (bensonlabs.org)
├── robots.txt           # Search engine instructions
├── README.md            # This file
└── .github/
  ├── scripts/         # Component assembly, page checks and their tests
  └── workflows/       # Deploy, the PR check, and Update components (pins new releases)
```

---

## Contributing

Found an issue or have a suggestion? Feel free to open an issue or submit a PR!

---

## License

Personal project. All content is proprietary unless otherwise noted.

# bensonlabs.org blog

Personal blog, games, and fitness tracking at [bensonlabs.org](https://bensonlabs.org) — troubleshooting fixes, technical notes, interactive games, and a 12-week workout program.

Built with [Jekyll](https://jekyllrb.com) and hosted on [GitHub Pages](https://pages.github.com).

---

## Copilot Prompt — Sync New Content

After adding a new project to the repo, paste this into GitHub Copilot to keep the docs in sync (games live in [bensonlabs/games](https://github.com/bensonlabs/games)):

```
I've added new content to this repo. Check the `projects/` folder for any
projects that aren't already reflected in the site docs, and update the Site
Sections and Project Structure in README.md to reflect everything that now
exists. Games and workouts are components from their own repositories; don't
add them here.
When done, commit the changes and open a pull request.
```

---

## Tech Stack

- **Static Site Generator**: Jekyll (Ruby)
- **Hosting**: GitHub Pages
- **Styling**: Custom CSS with Obsidian dark theme
- **Games**: Standalone HTML/CSS/JavaScript games plus one React, TypeScript, and Vite game
- **Version Control**: Git + GitHub

---

## Site Sections

### **Blog** (`/`)
Technical troubleshooting and notes on Windows, PowerShell, networking, security, and more.

### **Games** (`/projects/games/`)
Interactive browser games. The current catalogue is maintained at [bensonlabs.org/projects/games/](https://bensonlabs.org/projects/games/).

Games are built and released in [bensonlabs/games](https://github.com/bensonlabs/games) and pinned here in `_data/components.json`; see CONTRIBUTING.md, "Headers, project pages, and components".

### **Focus Lab** (`/projects/focus-lab/`)
Premium productivity dashboard with Pomodoro timer, focus tasks, synthesized ambient sounds, and weekly metrics.

### **Gravitas** (`/projects/gravitas/`)
High-fidelity N-body gravity simulator with real-time orbital projection, procedural ambient audio, and a glassmorphic telemetry dashboard.

### **AI Trending** (`/projects/ai-trending/`)
Daily analysis of trending AI/ML repositories on GitHub with ranked results, category filtering, and repository scoring.

### **Neon To-Do** (external — [todo-app-l3m0.onrender.com](https://todo-app-l3m0.onrender.com))
Full-stack todo app backed by Neon Postgres. Source: [bensonlabs/database-demo](https://github.com/bensonlabs/database-demo).

### **Context Console** (`/projects/context-console/`)
Owner-only work context tracker for resuming interrupted work. Phase 1 is deployed and smoke-tested at [context-console.onrender.com](https://context-console.onrender.com), backed by Supabase project `buvlsrccvrnnbxtwiozn`. Source: [bensonlabs/context-console](https://github.com/bensonlabs/context-console).

### **Workouts** (`/projects/workouts/`)
Justin’s 12-week mesocycle strength-training plan with phase-based strength progressions, Olympic-lifting skill work, MetCon conditioning, accessory volume, and a mobile-friendly day-by-day interface.

The canonical source lives in [bensonlabs/workouts](https://github.com/bensonlabs/workouts), not this repository; it's published here as a pinned release (see CONTRIBUTING.md, "Headers, project pages, and components"). Justin's plan is at [bensonlabs.org/projects/workouts/](https://bensonlabs.org/projects/workouts/), and the separate [CL · 12-Week Strength Restart](https://bensonlabs.org/projects/workouts/cl/) at `/projects/workouts/cl/`.

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

Games are built and released in [bensonlabs/games](https://github.com/bensonlabs/games);
its README explains how to add one. Publishing a new release here is one command; see
CONTRIBUTING.md, "Headers, project pages, and components".

---

## Headers, project pages, and components

The rules for the site header, project pages and the components (the games and
workouts, which come from their own repositories as pinned releases) are in
[CONTRIBUTING.md](CONTRIBUTING.md#headers-project-pages-and-components), section
"Headers, project pages, and components". Read it before changing layouts, project
pages, `_data/components.json` or `.github/scripts/components.py`. Games are built in
[bensonlabs/games](https://github.com/bensonlabs/games), never here.

## Local Development (Optional)

If you want to preview the site locally before pushing:

```bash
# Install dependencies (first time only)
bundle install

# Put the games and workouts in place, then run the local server
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
│   └── components.json  # Releases of the games and workouts this site pins
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
├── projects/
│   ├── index.html       # Projects hub page
│   ├── games/           # Component from bensonlabs/games (ignored by git)
│   ├── ai-trending/     # AI/ML trending repositories dashboard
│   ├── focus-lab/       # Productivity dashboard
│   ├── gravitas/        # N-body gravity simulator
│   ├── to-do-app/       # Neon Postgres todo app
│   ├── context-console/  # Owner-only work context tracker
│   └── workouts/        # Component from bensonlabs/workouts (ignored by git)
├── about.md             # About page
├── docs/decisions/      # Why the site is built the way it is
├── index.html           # Blog homepage (post list)
├── CNAME                # Custom domain (bensonlabs.org)
├── robots.txt           # Search engine instructions
├── README.md            # This file
└── .github/
  ├── scripts/         # Component assembly, page checks and their tests
  └── workflows/       # Pages deployment and the PR check
```

---

## Contributing

Found an issue or have a suggestion? Feel free to open an issue or submit a PR!

---

## License

Personal project. All content is proprietary unless otherwise noted.

# bensonlabs.org blog

Personal blog, games, and fitness tracking at [bensonlabs.org](https://bensonlabs.org) — troubleshooting fixes, technical notes, interactive games, and a 12-week workout program.

Built with [Jekyll](https://jekyllrb.com) and hosted on [GitHub Pages](https://pages.github.com).

---

## Tech Stack

- **Static Site Generator**: Jekyll (Ruby)
- **Hosting**: GitHub Pages
- **Styling**: Custom CSS with Obsidian dark theme
- **Games**: Vanilla HTML5, CSS3, and JavaScript
- **Version Control**: Git + GitHub

---

## Site Sections

### **Blog** (`/`)
Technical troubleshooting and notes on Windows, PowerShell, networking, security, and more.

### **Games** (`/projects/games/`)
Interactive browser games built with vanilla HTML/CSS/JavaScript. Extensible hub featuring:
- **2048** — Classic tile-merging puzzle game with undo, score tracking, and mobile support
- **not-Wordle** — 5-letter word guessing game with statistics tracking
- **Brick Break** — Classic brick-breaker with 3 difficulty levels, angle-based paddle physics, level progression, and high-score tracking
- **Orbit Bloom** — Harvest glowing motes as your shield and survive an ever-faster comet swarm
- **The Last Signal** — Text-based sci-fi adventure with three acts and two endings

Adding a new game: Add one entry to the `GAMES` array in `/projects/games/index.html` and drop the game folder in `/projects/games/`.

### **Focus Lab** (`/projects/focus-lab/`)
Premium productivity dashboard with Pomodoro timer, focus tasks, synthesized ambient sounds, and weekly metrics.

### **Gravitas** (`/projects/gravitas/`)
High-fidelity N-body gravity simulator with real-time orbital projection, procedural ambient audio, and a glassmorphic telemetry dashboard.

### **Neon To-Do** (external — [todo-app-l3m0.onrender.com](https://todo-app-l3m0.onrender.com))
Full-stack todo app backed by Neon Postgres. Source: [bensonlabs/database-demo](https://github.com/bensonlabs/database-demo).

### **Workouts** (`/projects/workouts/`)
12-week mesocycle strength training program with detailed day-by-day breakdowns including:
- Strength progressions (Hypertrophy, Strength, Peaking phases)
- Olympic lifting skill work
- MetCon conditioning
- Accessory volume and core training
- Mobile-friendly collapsible sections

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

All pages are fully responsive and optimized for mobile devices with touch-friendly interactions.

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

GitHub Actions will automatically build and deploy the site within ~60 seconds.

---

## Adding a New Game

Games are stored in `/projects/games/` with a hub at `/projects/games/index.html`.

### 1. Create Game Folder

```
projects/games/your-game/
├── index.html
├── styles.css (optional, can be inline)
└── script.js (optional, can be inline)
```

### 2. Register in Games Hub

Edit `/projects/games/index.html` and add your game to the `GAMES` array:

```javascript
const GAMES = [
  {
    title: "Your Game",
    emoji: "🎮",
    description: "Brief description of gameplay.",
    path: "/projects/games/your-game/"
  },
  // ... existing games
];
```

### 3. Commit and Push

The game card will automatically appear on the games hub once deployed.

---

## Local Development (Optional)

If you want to preview the site locally before pushing:

```bash
# Install dependencies (first time only)
bundle install

# Run local server
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
├── _layouts/
│   ├── default.html     # Base HTML layout
│   └── post.html        # Blog post layout
├── _posts/              # All blog posts (Markdown)
│   └── YYYY-MM-DD-title.md
├── assets/
│   └── css/
│       └── main.css     # Site styles (Obsidian dark theme)
├── projects/
│   ├── index.html       # Projects hub page
│   ├── games/           # Interactive games hub
│   │   ├── index.html
│   │   ├── 2048/
│   │   ├── not-wordle/
│   │   ├── breakout/
│   │   ├── orbit-bloom/
│   │   └── last-signal/
│   ├── focus-lab/       # Productivity dashboard
│   ├── gravitas/        # N-body gravity simulator
│   ├── to-do-app/       # Neon Postgres todo app
│   └── workouts/        # 12-week training program
├── about.md             # About page
├── index.html           # Blog homepage (post list)
├── CNAME                # Custom domain (bensonlabs.org)
├── robots.txt           # Search engine instructions
├── README.md            # This file
└── .github/workflows/
    └── jekyll.yml       # Auto-deploy on push
```

---

## Contributing

Found an issue or have a suggestion? Feel free to open an issue or submit a PR!

---

## License

Personal project. All content is proprietary unless otherwise noted.

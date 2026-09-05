# Contributing to Benson Labs Blog

This blog uses **Jekyll** and is hosted on **GitHub Pages** at [bensonlabs.org](https://bensonlabs.org).

## Publishing a New Post

### Workflow Option 1: Obsidian → GitHub Web UI (Recommended)

1. **Write your post in Obsidian**
   - Create a new note in your vault
   - Write in Markdown (no frontmatter needed yet)
   - When ready to publish, keep it handy

2. **Go to GitHub Issues**
   - Visit: https://github.com/bensonlabs/blog/issues/new/choose
   - Select **"New Blog Post"** template
   - Fill in:
     - `title` - Your post title
     - `date` - Publication date (YYYY-MM-DD format)
     - `categories` - Tags/categories (comma-separated, e.g., `windows, powershell, active-directory`)
   - Paste your Markdown content below the frontmatter

3. **Create the post file**
   - Copy the entire issue content (frontmatter + content)
   - Go to your repo: https://github.com/bensonlabs/blog/blob/master/_posts
   - Click **"Add file"** → **"Create new file"**
   - Name it: `YYYY-MM-DD-your-post-title.md`
   - Paste the content with frontmatter
   - Commit with message: `Add post: Your Post Title`

4. **Site updates automatically**
   - GitHub Pages builds Jekyll in ~60 seconds
   - Your post appears at: `https://bensonlabs.org/your-post-title/`
   - RSS feed updates automatically at `/feed.xml`

### Workflow Option 2: Local Git + Text Editor (Advanced)

1. Clone the repo locally:
   ```bash
   git clone https://github.com/bensonlabs/blog.git
   cd blog
   ```

2. Create a new post file in `_posts/`:
   ```bash
   touch _posts/2026-05-15-my-post.md
   ```

3. Add frontmatter and content:
   ```markdown
   ---
   layout: post
   title: "My Troubleshooting Fix"
   date: 2026-05-15
   author: Justin Benson
   categories: [windows, powershell]
   ---

   # Your post content here

   Write in Markdown...
   ```

4. Commit and push:
   ```bash
   git add _posts/2026-05-15-my-post.md
   git commit -m "Add post: My Troubleshooting Fix"
   git push origin master
   ```

5. Site updates in ~60 seconds

## Post Frontmatter Reference

Every post must start with YAML frontmatter:

```yaml
---
layout: post                          # Always "post"
title: "Your Post Title"              # The post title
date: 2026-05-15                      # Publication date (YYYY-MM-DD)
author: Justin Benson                 # Your name
categories: [tag1, tag2, tag3]        # Optional tags/categories
---
```

**Fields:**
- `layout` - Always set to `post`
- `title` - Post title (required)
- `date` - Date in YYYY-MM-DD format (required)
- `author` - Author name (required)
- `categories` - Array of tags (optional, but recommended for organization)

## Markdown Tips

### Code Blocks
Use triple backticks with language:
````markdown
```powershell
Get-Process | Where-Object { $_.Name -eq "explorer" }
```
````

### Ordered Lists
```markdown
1. Step one
2. Step two
3. Step three
```

### Unordered Lists
```markdown
- Item one
- Item two
- Item three
```

### Bold and Italic
```markdown
**bold text**
*italic text*
***bold italic***
```

### Links
```markdown
[Link text](https://example.com)
```

### Images
```markdown
![Alt text](../media/image.png)
```

## Directory Structure

```
blog/
├── _posts/                    # Blog posts (Markdown files)
├── _layouts/                  # HTML templates
│   ├── base.html
│   ├── project.html
│   ├── default.html
│   └── post.html
├── assets/
│   └── css/
│       └── main.css
├── media/                     # Images and other assets
├── projects/workouts/         # Layout-backed project fragment
│   └── index.html
├── _config.yml                # Jekyll configuration
├── CNAME                       # Custom domain (bensonlabs.org)
├── Gemfile                     # Ruby dependencies
└── README.md
```

## Headers, project pages, and standalone games

`_includes/nav.html` is the only site-header markup source; `_data/navigation.yml`
is the only source of its links. Header styling and behavior live in
`assets/css/header.css` and `assets/js/header.js`.

Blog pages inherit `default → base`; posts inherit `post → default → base`.
Normal project pages use `layout: project` (which inherits `base`) and contain
only body content after front matter. Preserve their original head elements in
the YAML `head: |` literal (metadata, CSP, fonts, styles, scripts), and any body
attributes in `body_attributes`. The project layout adds no content-width wrapper.
Never put a complete HTML document inside a layout. Keep Workouts' Liquid raw
blocks and JavaScript template placeholders intact.

Games at `projects/games/<slug>/` are complete standalone documents without front
matter, a site header, copied snippets, canonical markers, or auto-hide code.
Their controls, body layout, fullscreen, audio, and storage belong to the game;
no corner needs to be reserved for a site menu. Game-owned navigation and an
optional back-to-games link are fine. Choose CSP for the game's own assets.

Run `python3 .github/scripts/build_games_registry.py` **before** Jekyll. It validates
authored metadata and creates ignored `_data/games.json`; the catalogue fragment
reads that data without changing its presentation. Neither the generator nor CI
edits game files or commits generated catalogue data. The Pages job generates
this data in the same build that renders and uploads the site.

See `.github/scripts/GAME_METADATA.md` for metadata precedence and fallbacks.
For Dungeon Crawler, edit `game.json` for the catalogue and `index.source.html`
for the Vite shell; keep the existing Vite input, base path, and hashed assets.
Its unrelated `metadata.json` is not catalogue input. After `npm ci && npm run build`
in its directory, copy `dist/assets` to `assets` and `dist/index.source.html` to
`index.html`, without injecting anything. Treat `index.html` as generated output.

Validate with `python3 -m unittest discover -s .github/scripts -p 'test_*.py'`,
`python3 .github/scripts/check_dungeon_build.py`, and, after Jekyll,
`bash .github/scripts/check-nav.sh _site`. The last check is read-only and checks
rendered normal pages; it never requires a site header inside a game.

AI Trending's generator writes `latest/index.html` and a dated `YYYY-MM-DD/index.html`
fragment. The root `projects/ai-trending/index.html` stays a redirect to `latest/`.

## Viewing Your Site Locally

To preview changes before publishing:

1. Install Jekyll:
   ```bash
   gem install jekyll bundler
   ```

2. Navigate to repo and install dependencies:
   ```bash
   cd blog
   bundle install
   ```

3. Start local server:
   ```bash
   python3 .github/scripts/build_games_registry.py
   bundle exec jekyll serve
   ```

4. Visit: `http://localhost:4000`

## Troubleshooting

### Post not appearing after 5 minutes?
- Check the filename format: `YYYY-MM-DD-title.md`
- Verify frontmatter is valid YAML (proper spacing, quotes)
- Check GitHub Actions: https://github.com/bensonlabs/blog/actions

### Want to edit an existing post?
- Edit the `.md` file directly on GitHub or locally
- Commit and push
- Site rebuilds automatically

### Need to add images?
- Upload to `media/` folder
- Reference in post: `![description](../media/image.png)`

### Static page not showing?
- Standalone games have no front matter; normal project fragments use `layout: project`
- Check the file path matches the URL structure
- Rebuild with `bundle exec jekyll serve` locally

## Resources

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Pages with Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll)
- [Markdown Guide](https://www.markdownguide.org/)
- [YAML Syntax Reference](https://yaml.org/spec/1.2/spec.html)

---

**Questions?** Check the [README.md](README.md) or review existing posts in `_posts/` for examples.

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
   - A push or merge into `master` triggers **Deploy Jekyll to GitHub Pages** in GitHub Actions. The site updates after the build and deployment succeed; check the workflow for progress and errors.
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

5. Check **Deploy Jekyll to GitHub Pages** in GitHub Actions. The site updates after the build and deployment succeed. If you work on a feature branch, push that branch and merge it into `master` to publish.

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
├── projects/                 # From bensonlabs/projects at build time (ignored by git)
├── _config.yml                # Jekyll configuration
├── CNAME                       # Custom domain (bensonlabs.org)
├── Gemfile                     # Ruby dependencies
└── README.md
```

## Headers, project pages, and components

`_includes/nav.html` is the only site-header markup source; `_data/navigation.yml`
is the only source of its links. Header styling and behavior live in
`assets/css/header.css` and `assets/js/header.js`.

Blog pages inherit `default → base`; posts inherit `post → default → base`.
Normal project pages use `layout: project` (which inherits `base`) and contain
only body content after front matter. Preserve their original head elements in
the YAML `head: |` literal (metadata, CSP, fonts, styles, scripts), and any body
attributes in `body_attributes`. The project layout adds no content-width wrapper.
Never put a complete HTML document inside a layout.

### Components: everything under /projects/

Everything under `/projects/` (the Projects page, Games, Workouts, Bootstraps and
each project) comes from [bensonlabs/projects](https://github.com/bensonlabs/projects),
as a release pinned by version and sha256 in `_data/components.json`. The release
itself lists the pages to wrap in the site header (`"wrap": "release"`), so a new
page there needs no change here. Posts and About stay in this repo; add a post with
the `add-post` skill (`.claude/skills/add-post/`).

`python3 .github/scripts/components.py assemble` puts them in place before every
Jekyll build; the PR check, the deploy and local previews all run it. It
downloads each pinned release, refuses it if the sha256 doesn't match, unpacks it
into its folder, and wraps the listed pages in `layout: project`, keeping their
head, title, language and body attributes. Those folders are ignored by git:
never edit them here; change the component's own repository. A wrapped page's
body still goes through Liquid, so the workout plans' `{% raw %}` blocks keep working.

New releases are pinned by the **Update components** workflow
(`.github/workflows/update-components.yml`). The games repo starts it right after
each release; it also runs daily, and by hand from the Actions tab for any
component. It runs `components.py update` (the newest release, never backwards),
builds the whole site with it and runs the page checks; only if they pass does it
commit the pin and start the deploy. A failed run leaves the site on the previous
release. By hand: `python3 .github/scripts/components.py bump <name> <version>`
and a PR. `bump` checks the download against the release's own sha256, checks
that it unpacks cleanly and has the pages to wrap, and records the new version.
Why it works this way: `docs/decisions/0001` and `0002`.

Games are complete standalone documents without front matter, a site header,
copied snippets, canonical markers, or auto-hide code; their controls, layout,
audio and storage belong to the game. How to add one: the
[bensonlabs/projects](https://github.com/bensonlabs/projects) README (its add skill).

Validate with `python3 -m unittest discover -s .github/scripts -p 'test_*.py'`
and, after Jekyll, `bash .github/scripts/check-nav.sh _site`. The last check is
read-only and checks rendered normal pages; it never requires a site header
inside a game, and it fails if a game has one.

AI Trending's generator, now in the archived
[bensonlabs/ai-trending](https://github.com/bensonlabs/ai-trending), wrote
`latest/index.html` and dated `YYYY-MM-DD/index.html` fragments here. The root
`projects/ai-trending/index.html` stays a redirect to `latest/`.

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
   python3 .github/scripts/components.py assemble
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
- Normal project fragments use `layout: project`; games and workouts come from their own
  repositories (see "Headers, project pages, and components")
- Check the file path matches the URL structure
- Rebuild with `bundle exec jekyll serve` locally

## Resources

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Pages with Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll)
- [Markdown Guide](https://www.markdownguide.org/)
- [YAML Syntax Reference](https://yaml.org/spec/1.2/spec.html)

---

**Questions?** Check the [README.md](README.md) or review existing posts in `_posts/` for examples.

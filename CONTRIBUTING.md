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
├── projects/                 # Built from bensonlabs/projects, games/ from bensonlabs/games (ignored by git)
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

Everything under `/projects/` comes from two other repositories, each as a release
pinned by version and sha256 in `_data/components.json`:

| Component | Repository | Folder | Holds |
|---|---|---|---|
| `projects` | [bensonlabs/projects](https://github.com/bensonlabs/projects) | `projects/` | the Projects page, each project, Workouts and Bootstraps |
| `games` | [bensonlabs/games](https://github.com/bensonlabs/games) | `projects/games/` | the games and their catalogue |

The games folder sits inside the projects folder: `assemble` places the outer
component first, and a projects release may not contain anything under `games/`.
The projects release lists the pages to wrap in the site header itself
(`"wrap": "release"`), so a new page there needs no change here; the games
component wraps only its catalogue (`"wrap": ["index.html"]`). Posts and About stay
in this repo; add a post with the `add-post` skill (`.claude/skills/add-post/`).

`python3 .github/scripts/components.py assemble` puts them in place before every
Jekyll build; the PR check, the deploy and local previews all run it. It
downloads each pinned release, refuses it if the sha256 doesn't match, unpacks it
into its folder, and wraps the listed pages in `layout: project`, keeping their
head, title, language and body attributes. Those folders are ignored by git:
never edit them here; change the component's own repository. A wrapped page's
body still goes through Liquid, so the workout plans' `{% raw %}` blocks keep working.

New releases are pinned by the **Update components** workflow
(`.github/workflows/update-components.yml`). The games and projects repos start it
right after each release (their Release workflows, with the dispatch token below);
it also runs daily at 13:17 UTC, and by hand from the Actions tab for any component.
Its jobs:

1. **Look for new releases** reads master as it is when the run starts (a run that
   waited behind another sees that run's pin) and runs `components.py update` (the
   newest release, never backwards). It also checks that the live site serves master:
   the deploy publishes the commit it built as `/deployed-commit.txt`.
2. **Check the site and pin**, only when something is new, builds the whole site with
   the new pins and runs the page checks. Only if they pass does it commit the pin and
   push it; if master moved meanwhile, it puts the pin on top and tries again.
3. **Deploy** runs `jekyll.yml` inside the same run, so a failed deploy turns the
   Update components run red. It also runs when the live site isn't serving master,
   so the next run (the daily one at the latest) repairs a deploy that failed.
4. A component whose newest release can't be read or pinned doesn't hold up the
   others: they are pinned and deployed, then the run turns red, and the log of
   "Look for new releases" says which component failed and why.

A failed check leaves the site on the previous release. By hand:
`python3 .github/scripts/components.py bump <name> <version>` and a PR. `bump` checks
the download against the release's own sha256, checks that it unpacks cleanly, stays
within the size limits and has the pages to wrap, and records the new version. A
release whose page sets `permalink` (or `redirect_from`) in its front matter is
refused: a component's pages stay in its own folder. Why it works this way:
`docs/decisions/0001` to `0004`.

#### The dispatch token

The games and projects Release workflows start Update components with
`BLOG_DISPATCH_TOKEN`, a fine-grained personal access token:

- resource owner bensonlabs, repository access **only** bensonlabs/blog;
- one permission, **Actions: read and write** (it can start, rerun and cancel this
  repo's workflows, and nothing else);
- an expiry date you choose;
- saved as a repository secret in **both** bensonlabs/games and bensonlabs/projects.

When it expires or is revoked, a Release run goes red at "Tell the blog to publish
it", but the release is already published, and the daily Update components run
pins it. To renew it, create a new token with the same settings (github.com →
Settings → Developer settings → Personal access tokens → Fine-grained tokens), then
replace `BLOG_DISPATCH_TOKEN` in both repos (Settings → Secrets and variables →
Actions).

Games are complete standalone documents without front matter, a site header,
copied snippets, canonical markers, or auto-hide code; their controls, layout,
audio and storage belong to the game. How to add one: the
[bensonlabs/games](https://github.com/bensonlabs/games) README (its `add-game` skill);
for a project, workout plan or Bootstraps guide, the
[bensonlabs/projects](https://github.com/bensonlabs/projects) README (its `add` skill).

Four pages are App Store URLs, registered in App Store Connect as 2ndPaste's and
Tracro's support and privacy pages: `/projects/2ndPaste/`, `/projects/2ndPaste/privacy.html`,
`/projects/tracro/` and `/projects/tracro/privacy.html` (the case counts). The page
check requires all four (`APP_STORE_PAGES` in `check_rendered_pages.py`), so a release
that moves, renames or drops one never deploys and the site keeps the previous release.
Besides those, the page check requires only the home page and the menu's pages, and
that every redirect lands on a page (`/bootstraps/` needs
`/projects/bootstraps/workstations/`). Other project pages may come and go with the
projects releases.

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

### A new game or project isn't live yet?
- Its repo's Actions tab: the Release run publishes it. Red at "Tell the blog to publish
  it" means the dispatch token was refused ("The dispatch token" above); the release is
  out and the daily run pins it.
- This repo's Actions tab: the Update components run pins and deploys it. Red there means
  a check failed or a component couldn't be read; the site keeps the previous release.

### Want to edit an existing post?
- Edit the `.md` file directly on GitHub or locally
- Commit and push
- Site rebuilds automatically

### Need to add images?
- Upload to `media/` folder
- Reference in post: `![description](../media/image.png)`

### Static page not showing?
- Everything under `/projects/` comes from bensonlabs/projects or bensonlabs/games (see
  "Headers, project pages, and components"): change it there, not here
- Check the file path matches the URL structure
- Rebuild with `bundle exec jekyll serve` locally

## Resources

- [Jekyll Documentation](https://jekyllrb.com/docs/)
- [GitHub Pages with Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll)
- [Markdown Guide](https://www.markdownguide.org/)
- [YAML Syntax Reference](https://yaml.org/spec/1.2/spec.html)

---

**Questions?** Check the [README.md](README.md) or review existing posts in `_posts/` for examples.

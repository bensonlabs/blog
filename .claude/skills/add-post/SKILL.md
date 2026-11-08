---
name: add-post
description: Add a blog post to bensonlabs.org in one step - write it as Markdown in _posts/ with its front matter and push; the site deploys by itself. Use whenever Justin hands over a post (text, notes, a draft or an HTML page) or asks to publish, change or remove one. Games, projects, workouts and bootstrap guides are not posts - they go in bensonlabs/projects (its add skill).
---

# Add a post

Posts are Markdown files in `_posts/`; the home page lists them by itself, and every push to
`master` deploys the site (owner decision, 2026-11-08: posts go straight to `master`).

1. **Write the post** as `_posts/YYYY-MM-DD-<slug>.md` (today's date unless Justin gives one; the
   slug is short, lowercase, words joined by hyphens). It is published at `/<slug>/`.
2. **Front matter** (README.md, "Adding a New Blog Post"):

   ```yaml
   ---
   layout: post
   title: "Its title"
   date: YYYY-MM-DD
   author: Justin Benson
   categories: [windows, powershell]
   ---
   ```

   Pick categories from the README's list. Keep Justin's words; fix only what he asks. A post
   that arrives as HTML keeps its HTML body under the front matter (Markdown allows it).
3. **Images** go in `media/` and are linked as `/media/<file>`. Never a person's photo or details
   without Justin saying so.
4. **Check**: `python3 -m unittest discover -s .github/scripts -p 'test_*.py'`. There is no local
   Jekyll; the deploy builds the site and runs the page checks, and stops before publishing if one
   fails.
5. **Commit and push** only the post (and its images): a commit "Post: <title>", `git push` to
   `master`.
6. **Confirm it went live**: watch the deploy run (`gh run watch`), then check
   `https://bensonlabs.org/<slug>/` answers 200 and the home page lists it. Report the link.

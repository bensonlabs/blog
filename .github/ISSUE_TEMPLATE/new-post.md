---
name: New Blog Post
about: Create a new blog post with frontmatter template
title: "[POST] "
labels: post
---

---
layout: post
title: "Your Post Title Here"
date: YYYY-MM-DD
author: Justin Benson
categories: [tag1, tag2]
---

# Your post content here

## Instructions:
1. Fill in the frontmatter above (title, date, categories)
2. Write your post content below the second `---`
3. Copy the entire content (frontmatter + content)
4. Create a new file in `_posts/` folder named: `YYYY-MM-DD-your-title.md`
5. Paste the content and commit
6. Push or merge the post into `master`. It goes live after the **Deploy Jekyll to GitHub Pages** workflow succeeds; check GitHub Actions for progress and errors.

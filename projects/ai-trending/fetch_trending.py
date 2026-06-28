#!/usr/bin/env python3
"""
Fetch GitHub AI trending repos, calculate composite scores, and generate
the HTML dashboard at projects/ai-trending/index.html.

Usage: python3 fetch_trending.py
"""

import json
import os
import re
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime, timezone
from html import escape as html_escape

# ── Config ──────────────────────────────────────────────────────────────────
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(OUTPUT_DIR, "data.json")
HTML_FILE = os.path.join(OUTPUT_DIR, "index.html")

# Rate-limit guard
DELAY = 0.3  # seconds between GitHub API calls

# ── GitHub API helpers ──────────────────────────────────────────────────────

def github_get(url, auth=True):
    """GET request to GitHub API with rate-limit protection."""
    headers = {"Accept": "application/vnd.github.v3+json"}
    if auth and GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 403 and "rate limit" in (e.read().decode() if e.read else ""):
            print(f"Rate limited, waiting 60s...", file=sys.stderr)
            import time
            time.sleep(60)
            return github_get(url, auth)
        print(f"HTTP {e.code}: {url}", file=sys.stderr)
        return None
    except Exception as e:
        print(f"Error fetching {url}: {e}", file=sys.stderr)
        return None

def fetch_trending_python():
    """Fetch today's trending Python repos from GitHub's trending page."""
    url = "https://github.com/trending/python?since=daily"
    headers = {"Accept": "text/html,application/xhtml+xml"}
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode()
        return parse_trending_html(html)
    except Exception as e:
        print(f"Failed to fetch trending page: {e}", file=sys.stderr)
        return []

def parse_trending_html(html):
    """Extract repo info from GitHub trending page HTML."""
    repos = []
    # Match repo rows: <h2 class="h3 lh-condensed"> ... </h2>
    repo_pattern = re.compile(
        r'<h2\s+class="h3\s+lh-condensed".*?>\s*'
        r'<a\s+href="/([^/]+/[^"]+)"[^>]*>\s*'
        r'<span[^>]*>([^<]+)</span>/\s*'
        r'<span[^>]*>([^<]+)</span>\s*'
        r'</a>',
        re.DOTALL
    )
    desc_pattern = re.compile(
        r'<p\s+class="col-9\s+color-fg-muted\s+mt-1">\s*(.*?)\s*</p>',
        re.DOTALL
    )
    star_pattern = re.compile(
        r'<a[^>]*class="[^{]*stargazers[^"]*"[^>]*>\s*'
        r'<svg[^>]*>\s*</svg>\s*'
        r'([\d,]+)\s*</a>',
        re.DOTALL
    )
    
    for repo_m in repo_pattern.finditer(html):
        owner, name, full_path = repo_m.groups()
        repo_id = f"{owner}/{name}"
        
        # Find description
        desc = ""
        desc_m = desc_pattern.search(html[repo_m.start():repo_m.start()+500])
        if desc_m:
            desc = re.sub(r'<[^>]+>', '', desc_m.group(1)).strip()
        
        # Find stars
        stars_str = ""
        star_m = star_pattern.search(html[repo_m.start():repo_m.start()+800])
        if star_m:
            stars_str = star_m.group(1)
        
        if stars_str and desc:
            repos.append({
                "full_name": repo_id,
                "description": desc,
                "language": "Python",
                "stars_today": stars_str,
            })
    
    return repos

def fetch_repo_details(repo_id):
    """Get full repo details from GitHub API."""
    time.sleep(DELAY)
    url = f"https://api.github.com/repos/{repo_id}"
    data = github_get(url)
    if not data:
        return None
    
    # Get contributor count
    time.sleep(DELAY)
    contrib_url = f"https://api.github.com/repos/{repo_id}/contributors?per_page=1"
    contrib_headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        contrib_headers["Authorization"] = f"token {GITHUB_TOKEN}"
    req = urllib.request.Request(contrib_url, headers=contrib_headers)
    contributors = 0
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            # Check link header for total count
            link_header = resp.headers.get("Link", "")
            m = re.search(r'&page=(\d+)">', link_header)
            if m:
                contributors = int(m.group(1))
            else:
                contributors = 1  # at least 1
    except:
        contributors = 0
    
    return {
        "stars": data.get("stargazers_count", 0),
        "forks": data.get("forks_count", 0),
        "open_issues": data.get("open_issues_count", 0),
        "language": data.get("language", ""),
        "created_at": data.get("created_at", ""),
        "updated_at": data.get("pushed_at", data.get("updated_at", "")),
        "topics": data.get("topics", []),
        "watchers": data.get("watchers_count", 0),
        "license": data.get("license", {}).get("spdx_id", "") if data.get("license") else "",
        "contributors": contributors,
        "archived": data.get("archived", False),
        "default_branch": data.get("default_branch", "main"),
    }

def fetch_28d_growth(repo_id):
    """Get approximate star growth over 28 days from GitHub API (if available).
    
    For repos with activity data, we can estimate growth. The GitHub API
    doesn't give historical star counts directly, but we can look at
    the 'created_at' and recent activity to infer momentum.
    """
    # Use the GitHub events API or just estimate from repo age + star rate
    # For more accurate data, we'd need a service like ossinsight, but for now
    # we'll calculate growth rate based on repo age and current star count
    time.sleep(DELAY)
    
    # Actually, let's try to get the commit activity which correlates with momentum
    time.sleep(DELAY)
    commits_url = f"https://api.github.com/repos/{repo_id}/commits?per_page=1"
    commits_headers = {"Accept": "application/vnd.github.v3+json"}
    if GITHUB_TOKEN:
        commits_headers["Authorization"] = f"token {GITHUB_TOKEN}"
    req = urllib.request.Request(commits_url, headers=commits_headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            commit_data = json.loads(resp.read().decode())
            if commit_data:
                return commit_data[0]
    except:
        pass
    
    return None

# ── Metrics ──────────────────────────────────────────────────────────────────

def calculate_metrics(repo):
    """Calculate composite score for a repo."""
    stars = repo["stars"]
    forks = repo["forks"]
    contributors = repo["contributors"]
    language = repo["language"] or ""
    topics = repo["topics"] or []
    
    # Repo age in days
    try:
        created = datetime.fromisoformat(repo["created_at"].replace("Z", "+00:00"))
        repo_age_days = (datetime.now(timezone.utc) - created).days
    except:
        repo_age_days = 999
    
    # Velocity: stars per day (estimate based on repo age)
    # We can't get historical star counts from the API, but we can use
    # current stars / age as a proxy for average daily growth
    if stars > 0 and repo_age_days > 0:
        avg_stars_per_day = stars / repo_age_days
    else:
        avg_stars_per_day = 0
    
    # Recent activity (last 30 days commits)
    # We'll use open issues as a proxy for active development
    open_issues_ratio = repo["open_issues"] / max(stars, 1) * 100
    
    # Health score (0-100)
    health = 0
    # Contributors (more = healthier)
    if contributors >= 20:
        health += 30
    elif contributors >= 10:
        health += 20
    elif contributors >= 5:
        health += 10
    
    # Not archived
    if not repo.get("archived", False):
        health += 30
    
    # Active push date
    days_since_push = 999  # default: stale
    try:
        pushed = datetime.fromisoformat(repo["updated_at"].replace("Z", "+00:00"))
        days_since_push = (datetime.now(timezone.utc) - pushed).days
        if days_since_push <= 7:
            health += 25  # Very active
        elif days_since_push <= 30:
            health += 20  # Active
        elif days_since_push <= 90:
            health += 10  # Moderately active
        else:
            health += 0  # Stale
    except:
        health += 0
    
    # Adoption score (0-100)
    adoption = 0
    # Fork to star ratio (healthy is 2-10%)
    fork_ratio = forks / max(stars, 1) * 100
    if 2 <= fork_ratio <= 10:
        adoption += 40  # Healthy fork ratio
    elif fork_ratio < 2:
        adoption += 20  # Low forks (could be niche or very popular)
    else:
        adoption += 10  # High fork ratio (fork farm?)
    
    # Star count tiers
    if stars >= 10000:
        adoption += 40
    elif stars >= 1000:
        adoption += 30
    elif stars >= 100:
        adoption += 20
    else:
        adoption += 10
    
    # Watcher ratio (higher = more maintained)
    watcher_ratio = repo["watchers"] / max(stars, 1) * 100
    if watcher_ratio > 1:
        adoption += 20
    
    # Velocity score (0-100)
    # Normalized: repos getting 10+ stars/day at small size = very hot
    # Repos getting 1 star/day at large size = cooling
    if repo_age_days < 30:
        # New repo - raw stars matter more
        if stars >= 100:
            velocity = 80
        elif stars >= 50:
            velocity = 60
        elif stars >= 10:
            velocity = 40
        else:
            velocity = 20
    else:
        # Mature repo - relative growth matters
        if avg_stars_per_day > 10:
            velocity = 90
        elif avg_stars_per_day > 5:
            velocity = 70
        elif avg_stars_per_day > 1:
            velocity = 50
        else:
            velocity = 30
    
    # Normalize velocity to 0-100
    velocity_score = min(100, velocity)
    
    # Penalty factors
    penalty = 0
    if repo.get("archived", False):
        penalty += 40
    if contributors < 2:
        penalty += 20
    if days_since_push > 90:
        penalty += 30
    
    # AI/ML topic bonus
    ai_keywords = ["ai", "ml", "machine-learning", "deep-learning", "llm", "nlp", "computer-vision", "transformer", "gpt", "llama", "huggingface"]
    has_ai_topic = any(any(kw in t.lower() for kw in ai_keywords) for t in topics)
    is_ai_language = language.lower() in ["python", "julia", "r"]
    ai_bonus = 15 if (has_ai_topic or is_ai_language) else 0
    
    # Final composite score
    composite = velocity_score * 2.5 + health * 1.5 + adoption * 1.2 + ai_bonus - penalty
    composite = max(0, composite)  # Floor at 0
    
    return {
        "velocity_score": round(velocity_score, 1),
        "health_score": round(health, 1),
        "adoption_score": round(adoption, 1),
        "composite_score": round(composite, 1),
        "avg_stars_per_day": round(avg_stars_per_day, 2),
        "repo_age_days": repo_age_days,
        "is_ai_related": has_ai_topic or is_ai_language,
    }

def categorize_repo(repo, metrics):
    """Assign a category based on topics and description."""
    topics_lower = [t.lower() for t in (repo.get("topics") or [])]
    desc_lower = (repo.get("description") or "").lower()
    
    categories = {
        "Coding Agent": ["code", "agent", "coding", "dev", "ide", "editor", "cursor", "copilot", "claude", "codex"],
        "AI Agent": ["agent", "agent-framework", "autonomous", "multi-agent", "planning", "reasoning"],
        "Inference": ["inference", "llama.cpp", "vllm", "llm", "serve", "serving", "quantize", "gguf"],
        "LLM Tools": ["llm", "prompt", "chatbot", "gpt", "transformer", "fine-tune", "training"],
        "RAG": ["rag", "retrieval", "document", "pdf", "knowledge", "graph", "vector"],
        "MCP Server": ["mcp", "model-context-protocol", "server"],
        "Vector DB": ["vector", "chroma", "qdrant", "milvus", "pinecone", "faiss"],
        "AI Tools": ["ai", "machine-learning", "deep-learning", "computer-vision", "nlp"],
    }
    
    for category, keywords in categories.items():
        if any(any(kw in t for t in topics_lower) or kw in desc_lower for kw in keywords):
            return category
    
    # Default category based on language
    if repo.get("language") == "Python":
        return "AI Tools"
    
    return "Other"

# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    print("🔍 Fetching GitHub trending repos...", file=sys.stderr)
    
    # 1. Fetch trending repos
    trending_repos = fetch_trending_python()
    if not trending_repos:
        print("⚠️ No trending repos found", file=sys.stderr)
        return
    
    print(f"  Found {len(trending_repos)} trending repos", file=sys.stderr)
    
    # 2. Enrich with API data
    results = []
    for i, repo_data in enumerate(trending_repos):
        repo_id = repo_data["full_name"]
        print(f"  [{i+1}/{len(trending_repos)}] Enriching {repo_id}...", file=sys.stderr)
        
        details = fetch_repo_details(repo_id)
        if not details:
            print(f"    ⚠️ Failed to fetch details for {repo_id}", file=sys.stderr)
            continue
        
        # Merge
        repo = {**repo_data, **details}
        
        # Calculate metrics
        metrics = calculate_metrics(repo)
        
        # Categorize
        category = categorize_repo(repo, metrics)
        metrics["category"] = category
        
        repo["metrics"] = metrics
        results.append(repo)
    
    # Sort by composite score (descending)
    results.sort(key=lambda x: x["metrics"]["composite_score"], reverse=True)
    
    print(f"\n✅ Processed {len(results)} repos", file=sys.stderr)
    
    # 3. Save data
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(DATA_FILE, "w") as f:
        json.dump({
            "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            "repos": results,
            "total": len(results),
        }, f, indent=2)
    
    print(f"💾 Saved to {DATA_FILE}", file=sys.stderr)
    
    # 4. Generate HTML dashboard
    generate_dashboard(results)
    print(f"🌐 Dashboard generated at {HTML_FILE}", file=sys.stderr)

def generate_dashboard(repos):
    """Generate the HTML dashboard."""
    date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    # Top repos for the "featured" section
    top_repos = repos[:10]
    
    # All repos for the detailed table
    all_repos = repos
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Trending — Benson Labs</title>
  <style>
    /* ── OBSIDIAN DARK THEME ── */
    :root {{
      --bg: #1e1e1e;
      --surface: #252525;
      --card: #2d2d2d;
      --border: #3a3a3a;
      --text: #dcddde;
      --muted: #888;
      --accent: #7c3aed;
      --accent2: #a78bfa;
    }}

    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    html, body {{
      min-height: 100%;
      background: var(--bg);
      color: var(--text);
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }}

    body {{
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 16px 60px;
    }}

    /* ── HEADER ── */
    .page-header {{
      width: 100%;
      max-width: 900px;
      margin-bottom: 40px;
    }}

    .page-title {{
      font-size: 2rem;
      font-weight: 700;
      color: var(--accent2);
      margin-bottom: 8px;
    }}

    .page-subtitle {{
      font-size: 1rem;
      color: var(--muted);
    }}

    .page-subtitle a {{
      color: var(--accent2);
      text-decoration: none;
    }}

    .page-subtitle a:hover {{
      text-decoration: underline;
    }}

    /* ── STATS ROW ── */
    .stats-row {{
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-bottom: 40px;
      max-width: 900px;
      width: 100%;
    }}

    .stat-card {{
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px 20px;
      flex: 1;
      min-width: 150px;
      text-align: center;
    }}

    .stat-value {{
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--accent2);
    }}

    .stat-label {{
      font-size: 0.85rem;
      color: var(--muted);
      margin-top: 4px;
    }}

    /* ── SECTION ── */
    .section {{
      width: 100%;
      max-width: 900px;
      margin-bottom: 40px;
    }}

    .section-title {{
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--accent2);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
    }}

    /* ── REPO CARDS (featured) ── */
    .repo-grid {{
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }}

    .repo-card {{
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      transition: border-color 0.2s;
    }}

    .repo-card:hover {{
      border-color: var(--accent);
    }}

    .repo-card a {{
      color: var(--accent2);
      text-decoration: none;
      font-weight: 600;
      font-size: 1.05rem;
    }}

    .repo-card a:hover {{
      text-decoration: underline;
    }}

    .repo-card .desc {{
      color: var(--muted);
      font-size: 0.9rem;
      line-height: 1.4;
      flex-grow: 1;
    }}

    .repo-card .meta {{
      display: flex;
      gap: 12px;
      font-size: 0.8rem;
      color: var(--muted);
      flex-wrap: wrap;
    }}

    .repo-card .badge {{
      background: var(--accent);
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }}

    .repo-card .score {{
      font-weight: 600;
      color: var(--accent2);
    }}

    /* ── TABLE ── */
    .table-wrap {{
      overflow-x: auto;
    }}

    table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
    }}

    thead {{
      background: var(--surface);
    }}

    th {{
      text-align: left;
      padding: 10px 12px;
      font-weight: 600;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
      white-space: nowrap;
    }}

    td {{
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
    }}

    td a {{
      color: var(--accent2);
      text-decoration: none;
    }}

    td a:hover {{
      text-decoration: underline;
    }}

    .rank {{
      font-weight: 700;
      color: var(--accent2);
      text-align: center;
      width: 40px;
    }}

    .score-bar {{
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      overflow: hidden;
      min-width: 80px;
    }}

    .score-fill {{
      height: 100%;
      background: var(--accent);
      border-radius: 3px;
    }}

    /* ── FOOTER ── */
    .footer {{
      color: var(--muted);
      font-size: 0.8rem;
      text-align: center;
      max-width: 900px;
      width: 100%;
      padding-top: 20px;
      border-top: 1px solid var(--border);
    }}

    .footer a {{
      color: var(--accent2);
    }}

    /* ── FILTERS ── */
    .filters {{
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 16px;
    }}

    .filter-btn {{
      background: var(--surface);
      color: var(--muted);
      border: 1px solid var(--border);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }}

    .filter-btn:hover, .filter-btn.active {{
      background: var(--accent);
      color: white;
      border-color: var(--accent);
    }}

    .table-row {{
      display: table-row;
    }}

    .table-row.hidden {{
      display: none;
    }}
  </style>
</head>
<body>
  <div class="page-header">
    <h1 class="page-title">🤖 AI Trending Repos</h1>
    <p class="page-subtitle">
      Daily analysis of trending AI/ML repositories on GitHub
      <a href="https://github.com/bensonlabs/blog/tree/master/projects/ai-trending">[Source]</a>
    </p>
  </div>

  <!-- Stats row -->
  <div class="stats-row">
    <div class="stat-card">
      <div class="stat-value">{len(repos)}</div>
      <div class="stat-label">Repositories analyzed</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{len(set(r.get("category") for r in repos))}</div>
      <div class="stat-label">Categories</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{max((r["metrics"]["composite_score"] for r in repos), default=0):.0f}</div>
      <div class="stat-label">Top composite score</div>
    </div>
    <div class="stat-card">
      <div class="stat-value">{date}</div>
      <div class="stat-label">Last analyzed</div>
    </div>
  </div>

  <!-- Featured repos -->
  <div class="section">
    <h2 class="section-title">🔥 Top Repositories</h2>
    <div class="repo-grid">
"""
    
    for i, repo in enumerate(top_repos):
        metrics = repo["metrics"]
        html += f"""      <div class="repo-card" data-category="{metrics["category"]}">
        <a href="https://github.com/{repo["full_name"]}" target="_blank">{repo["full_name"]}</a>
        <p class="desc">{html_escape(repo.get("description") or "")}</p>
        <div class="meta">
          <span class="badge">{html_escape(metrics["category"])}</span>
          <span class="score">Score: {metrics["composite_score"]}</span>
          <span>⭐ {repo["stars"]:,}</span>
          <span>🍴 {repo["forks"]:,}</span>
        </div>
      </div>
"""
    
    html += """    </div>
  </div>

  <!-- Filters -->
  <div class="section">
    <h2 class="section-title">📊 Full Rankings</h2>
    <div class="filters" id="filters"></div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Repository</th>
            <th>Category</th>
            <th>Stars</th>
            <th>Forks</th>
            <th>Velocity</th>
            <th>Health</th>
            <th>Composite</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody id="repo-table">
"""
    
    # Build filter buttons
    categories = sorted(set(r["metrics"]["category"] for r in repos))
    html += "        <button class=\"filter-btn active\" data-category=\"all\">All</button>\n"
    for cat in categories:
        html += f'        <button class=\"filter-btn\" data-category="{html_escape(cat)}">{html_escape(cat)}</button>\n'
    
    html += "      </div>\n"
    
    for i, repo in enumerate(all_repos):
        metrics = repo["metrics"]
        html += f"""          <tr class="table-row" data-category="{html_escape(metrics["category"])}">
            <td class="rank">{i+1}</td>
            <td><a href="https://github.com/{repo["full_name"]}" target="_blank">{repo["full_name"]}</a></td>
            <td>{html_escape(metrics["category"])}</td>
            <td>{repo["stars"]:,}</td>
            <td>{repo["forks"]:,}</td>
            <td>{metrics["avg_stars_per_day"]:.1f}/day</td>
            <td>{metrics["health_score"]:.0f}</td>
            <td>{metrics["composite_score"]:.1f}</td>
            <td>
              <div class="score-bar"><div class="score-fill" style="width: {metrics["composite_score"]:.0f}%"></div></div>
            </td>
          </tr>
"""
    
    html += f"""        </tbody>
      </table>
    </div>
  </div>

  <div class="footer">
    <p>Powered by <a href="https://github.com/bensonlabs/blog/tree/master/projects/ai-trending" target="_blank">bensonlabs/blog</a> · 
    Data sourced from GitHub Trending & GitHub API · 
    <a href="https://github.com/bensonlabs/blog/issues/new" target="_blank">Report an issue</a></p>
  </div>

  <script>
    // Filter buttons
    const filters = document.getElementById('filters');
    const rows = document.querySelectorAll('.table-row');
    
    filters.addEventListener('click', (e) => {{
      if (e.target.classList.contains('filter-btn')) {{
        // Update active state
        filters.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        const category = e.target.dataset.category;
        
        // Filter rows
        rows.forEach(row => {{
          if (category === 'all' || row.dataset.category === category) {{
            row.classList.remove('hidden');
          }} else {{
            row.classList.add('hidden');
          }}
        }});
      }}
    }});
  </script>
</body>
</html>"""
    
    with open(HTML_FILE, "w") as f:
        f.write(html)

if __name__ == "__main__":
    main()
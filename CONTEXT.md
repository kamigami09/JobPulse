# CONTEXT.md — JobPulse Full Project Context

## The user
A job seeker who finds most jobs on LinkedIn. Not a web developer. Wants to paste job URLs during the week, save them, then sit down every Sunday and apply to everything saved. Wants AI to handle all technical decisions — he provides direction, Claude Code builds.

## The problem being solved
Manual job tracking with bookmarks or spreadsheets is unmanageable. The user needs one place where:
- Pasting a URL extracts all the important info automatically
- Jobs are displayed in a clean Excel-like table
- Status is tracked per job (Saved → Applied etc.)
- Every Sunday: open app, review the week's jobs, apply manually

## Existing codebase
- Repo is on GitHub (JobPulse)
- Stack: React + Vite frontend, Python Flask backend, SQLite locally / PostgreSQL for production
- Current scraping: BeautifulSoup only extracts `<title>` tag — completely insufficient
- Kanban pipeline view exists but user wants a data grid (Excel-like table) instead
- The existing models, routes structure can be reused but the scraper must be fully rewritten

## What to keep from existing code
- Flask app structure and SQLAlchemy setup
- React + Vite setup
- PostgreSQL config (already in the codebase for production)

## What to throw away / rewrite
- The entire scraper (rewrite using JobSpy + fallback chain)
- The Kanban UI (replace with TanStack Table grid)
- SQLite usage (PostgreSQL only, always)

## Infrastructure
- Hostinger KVM2 VPS
- OS: Ubuntu 26
- No domain — access via raw IP address
- No Docker — direct install everything on the VPS
- No SSL for now
- Single user — no authentication needed

## The fields that matter (minimal, user's exact request)
The user explicitly wants only these extracted per job:
1. **Job title** — what the role is called
2. **Company** — who's hiring
3. **Domain** — field/industry of the job (e.g. Software Engineering, Design, Marketing)
4. **Required skills** — tech stack or competencies listed in the post
5. **Contact email** — if one exists anywhere in the post

Plus system fields the app manages:
- URL (source link)
- Status (Saved / Applied / Interviewing / Offer / Rejected)
- Notes (user types manually)
- Source platform (linkedin, indeed, other)
- Date saved
- Date applied

## LinkedIn scraping is the priority
Most jobs come from LinkedIn. LinkedIn is JS-rendered and actively blocks scrapers.
Strategy (in order):
1. JobSpy — handles LinkedIn URLs natively, returns structured JSON
2. spinlud/py-linkedin-jobs-scraper — headless Chromium, authenticated via LI_AT_COOKIE
3. BeautifulSoup fallback — fetch raw HTML; extract via JSON-LD (`JobPosting` schema) + regex/keyword matching against a curated skills vocabulary. No AI.
4. Manual fallback — record saved with `status='needs_review'`; user fills in missing fields inline in the grid

## The Sunday workflow (manual for now)
- User opens app on Sunday
- Sees all jobs with status "Saved" from the past week
- Reviews each one, clicks through to the original URL to apply
- Updates status to "Applied" when done
- No automation yet — cover letters, emails, auto-apply are future features

## Key technical decisions already made
- TanStack Table v8 for the grid (not AG Grid — too heavy)
- Tailwind CSS for styling (AI writes it fast)
- Gunicorn for serving Flask in production
- Nginx as reverse proxy
- No Redux — useState only
- JavaScript not TypeScript
- PostgreSQL not SQLite

## Layer 3 extraction (no AI)
- Implemented in `backend/app/scraper.py` and `backend/app/utils/parsing.py`
- Strategy: parse the page with BeautifulSoup, prefer JSON-LD (`<script type="application/ld+json">` with `JobPosting` schema), fall back to meta tags + heuristics
- Skills: word-boundary regex against a curated `SKILLS_VOCABULARY` constant (~150 entries, easy to extend)
- Domain: keyword → domain mapping (e.g. {"engineer", "developer"} → "Software Engineering")
- Contact email: regex `[\w.+-]+@[\w-]+\.[\w.-]+`, first non-noreply match
- No paid API calls. No external service dependency for this layer.

## What success looks like
User can:
1. Paste any LinkedIn (or other) job URL
2. See extracted fields appear in the table within ~10 seconds
3. Edit any field inline if scraping missed something
4. Change status via dropdown
5. Add notes
6. Sunday: filter by "Saved", review, apply manually, mark as Applied

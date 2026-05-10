# CLAUDE.md — JobPulse Upgraded
> This file is read automatically by Claude Code on every session. Always follow these rules.

## What this project is
A personal job tracker web app. The user pastes a LinkedIn (or any job site) URL → the backend scrapes it → extracts structured fields → saves to database. The user reviews saved jobs weekly (Sunday) and applies manually.

## Repo
GitHub: https://github.com/kamigami09/JobPulse

## Hard rules — never break these
- Never use TypeScript. JavaScript only on the frontend.
- Never use SQLite in production. PostgreSQL only.
- Never use Docker. The repo has docker-compose.yml and Dockerfiles — ignore and delete them. Direct install on VPS only.
- Never touch render.yaml — it's irrelevant, the app deploys to Hostinger VPS not Render.
- Never invent fields not listed in the schema. Ask before adding columns.
- Never delete database migrations. Always create new ones.
- Always add error handling to every scraping function — scrapers fail silently without it.
- Comments in English only.
- Keep the frontend simple. No complex state management (no Redux). React useState is enough.
- When in doubt about a feature, do the simpler version first and leave a TODO comment.

## Stack — locked, do not change
| Layer | Technology |
|---|---|
| Backend | Python 3.11 + Flask + Flask-SQLAlchemy |
| Scraping - primary | JobSpy (`jobspy` pip package) |
| Scraping - fallback | selenium + `linkedin-jobs-scraper` (spinlud) |
| Scraping - last resort | BeautifulSoup + JSON-LD (`JobPosting` schema) + regex/keyword extraction (no AI) |
| Database | PostgreSQL (production) |
| Frontend | React + Vite (JavaScript, not TypeScript) |
| Data grid | TanStack Table v8 |
| Styling | Tailwind CSS |
| Web server | Nginx (reverse proxy) |
| Process manager | Gunicorn (Flask) |
| VPS OS | Ubuntu 26.04 (Hostinger KVM2) |
| Deployment | No Docker. Direct install on VPS. |

## VPS — exact details
- IP: 187.127.229.82
- SSH: `ssh root@187.127.229.82`
- Hostname: srv1646189.hstgr.cloud
- Location: France - Paris
- CPU: 2 cores | RAM: 8 GB | Disk: 100 GB
- OS: Ubuntu 26.04
- No domain, no SSL for now — access via raw IP on port 80

## Database schema — exact fields, nothing more
```sql
CREATE TABLE jobs (
    id              SERIAL PRIMARY KEY,
    url             TEXT NOT NULL UNIQUE,
    title           TEXT,
    company         TEXT,
    domain          TEXT,          -- e.g. "Software Engineering", "Marketing"
    skills          TEXT[],        -- array of required skills/stack
    contact_email   TEXT,          -- extracted if present in the job post
    status          TEXT DEFAULT 'Saved',  -- Saved | Applied | Interviewing | Offer | Rejected
    notes           TEXT,          -- user's manual notes
    source          TEXT,          -- e.g. "linkedin", "indeed", "other"
    scraped_at      TIMESTAMP DEFAULT NOW(),
    applied_at      TIMESTAMP
);
```

## Scraping strategy — layered, in this exact order
```
1. Try JobSpy          → handles URL, returns structured JSON automatically
         ↓ fails or returns empty?
2. Try spinlud scraper → headless Chromium, uses LI_AT_COOKIE env var for LinkedIn auth
         ↓ fails?
3. Try raw HTML        → fetch page with requests + BeautifulSoup
         → extract via JSON-LD (JobPosting schema) + regex/keyword matching
         → no AI — uses a curated SKILLS_VOCABULARY and DOMAIN_KEYWORDS map
         ↓ fails?
4. Graceful fallback   → return partial data, mark status as "needs_review",
                         frontend shows manual fill form to user
```

## Environment variables required
```
DATABASE_URL=postgresql://jobpulse:jobpulse@localhost:5432/jobpulse
LI_AT_COOKIE=...        # LinkedIn li_at session cookie for authenticated scraping
FLASK_ENV=production
SECRET_KEY=...
```

## Project structure (keep this layout)
```
jobpulse/
├── CLAUDE.md               ← this file
├── CONTEXT.md              ← full project context
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── models.py       ← SQLAlchemy models
│   │   ├── routes.py       ← Flask API routes
│   │   ├── scraper.py      ← layered scraping logic (JobSpy → spinlud → BS4+JSON-LD → manual)
│   │   └── utils/
│   │       ├── parsing.py  ← JSON-LD parser, SKILLS_VOCABULARY, DOMAIN_KEYWORDS, email regex
│   │       └── url_utils.py ← clean_url, validate_url
│   ├── migrations/         ← Flask-Migrate files
│   ├── requirements.txt
│   └── run.py
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JobGrid.jsx     ← TanStack Table data grid
│   │   │   ├── AddJobModal.jsx ← URL paste → scrape → save
│   │   │   └── StatusBadge.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
└── deploy/
    ├── nginx.conf          ← Nginx config for the VPS
    └── setup.sh            ← Full VPS install script (run once on fresh server)
```

## API endpoints (build exactly these)
```
POST   /api/jobs/scrape     → body: {url} → scrapes and saves job, returns job object
GET    /api/jobs            → returns all jobs, supports ?status= filter
PATCH  /api/jobs/:id        → update any field (status, notes, contact_email, etc.)
DELETE /api/jobs/:id        → delete a job
GET    /api/jobs/export     → returns all "Saved" jobs as CSV for Sunday review
```

## Frontend behavior
- Main view: TanStack Table with columns: Title, Company, Domain, Skills, Contact Email, Status, Date Saved, Notes, Actions
- Top bar: single URL input field + "Add Job" button → opens AddJobModal
- AddJobModal: paste URL → click Scrape → shows extracted data preview → Save button
- Status column: inline dropdown (Saved / Applied / Interviewing / Offer / Rejected)
- Notes column: inline editable text cell
- All edits auto-save via PATCH /api/jobs/:id on blur
- No pagination needed (personal use, under 500 jobs)

## VPS deployment notes
- Nginx listens on port 80, proxies /api/* to Gunicorn on 127.0.0.1:5000
- React build output served as static files from /var/www/jobpulse/
- PostgreSQL runs locally on the VPS (localhost:5432)
- Gunicorn command: `gunicorn -w 4 -b 127.0.0.1:5000 run:app`
- Chromium for selenium: `apt install -y chromium-browser` or `playwright install chromium --with-deps`
- Keep Flask running with systemd service, not PM2

## What to keep from existing repo
- Flask app structure and SQLAlchemy setup in backend/
- React + Vite project setup in frontend/
- PostgreSQL connection config (already in codebase)

## What to delete / rewrite immediately
- docker-compose.yml → DELETE (no Docker on VPS)
- render.yaml → DELETE (not deploying to Render)
- infra/ → DELETE or repurpose for Nginx config only
- backend scraper → FULL REWRITE with JobSpy + fallback chain
- Any Kanban/drag-drop UI → REPLACE with TanStack Table grid
- SQLite references anywhere → REPLACE with PostgreSQL

## Build order — follow this sequence
1. Clean repo (delete Docker/Render files)
2. Rewrite backend/app/models.py with schema above
3. Set up Flask-Migrate, run first migration
4. Rewrite scraper.py with full layered strategy
5. Test scraper on real LinkedIn URL before touching frontend
6. Build Flask API routes (routes.py)
7. Build React TanStack Table grid (JobGrid.jsx)
8. Build AddJobModal with scrape flow
9. Add inline editing + auto-save
10. Add CSV export endpoint
11. Write deploy/setup.sh and deploy/nginx.conf
12. Deploy to VPS: clone repo, run setup.sh, done

## What NOT to build yet
- Cover letter generation
- Email sending / automation
- User authentication (single user app)
- Multiple resume tracking
- Notifications or reminders

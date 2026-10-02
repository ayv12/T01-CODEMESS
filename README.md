# T01-CODEMESS
 # SkillProof — Prove What You Can Do

> Resumes claim skills. SkillProof proves them. An evidence-based skill verification platform that cross-checks resume claims against live GitHub evidence and returns Proven / Partial / Claimed-only verdicts — with proof, gaps, salary estimates, and fix-it tasks.

---

## Project Overview

Recruiters drown in keyword-matched resumes and can't tell claimed skills from real ones. Students don't know which of their claims they can actually defend in an interview.

**SkillProof** closes that gap. A user logs in, picks a role (**Student** or **Recruiter** — chosen once at login, each role gets its own exclusive workspace), enters a GitHub username (plain `ayv12` or a full profile URL both work) plus a resume PDF and a target job description. The app then:

1. Parses the resume **locally in the browser** (PDF.js — the file never uploads anywhere).
2. Fetches **live public repositories** via the GitHub REST API — languages, file trees, READMEs, Dockerfiles, CI workflows, tests, push dates, and collaboration events.
3. Scores every skill with a **transparent rule set**: resume claim +1 · code files +3 · recent activity +2 · README +1 · tests +1 · deployment +1. **Proven ≥ 7 · Partial 3–6 · Claimed-only ≤ 2.**
4. Renders an evidence report: animated job-match ring, per-skill **"Show me the proof"** slide-over (real file paths + latest commits), hidden-skill discovery, collaboration + recency signals, salary band, alternative roles, and gap → micro-task coaching.
5. Recruiter workspaces add risk flags, evidence-generated interview questions, and browser-local private notes — plus one-click **Report-as-PDF** export on both dashboards.

No backend, no fake data: every verdict traces to live evidence, and limits (rate caps, coverage, authorship caveats) are shown, not hidden.

---

## Setup & Installation Instructions

**Prerequisites:** Node.js 18+ and any modern browser (Chrome recommended).

```bash
# 1. Open the project folder
cd "C:\Users\Ayushi\Documents\Default Project"

# 2. Install dependencies (one time)
npm install

# 3. Run the dev server
npx vite --port 5173
```

Then open **http://localhost:5173/** in your browser.

**No-server option:** double-click `index.html` in the project folder — the app runs fully from local files (internet needed only for fonts + CDN libraries).

**Production build (for hosting):**

```bash
npx vite build   # outputs a host-ready site into /dist
```

Drag the `dist` folder onto `app.netlify.com/drop` (or any static host) to go live. No build command or redirects needed — all routes are hash-based.

---

## Key Features

- **Role-gated login** — Student / Recruiter picked once at login (Apple-dock style selector); each role sees only its own Sage-green (student) or Clay (recruiter) workspace.
- **Claim vs Code Detector** — resume skills extracted locally, cross-checked against real repo evidence.
- **Show Me the Proof** — every skill expands into repos, file hits, push dates, and live latest commits.
- **Hidden Skill Discovery** — strong code evidence for skills missing from the resume, surfaced as free wins.
- **Job Fit Analysis** — JD skill extraction, weighted match %, required-skill split.
- **Salary Estimate + Other Eligible Roles** — rule-based bands labeled as estimates, ranked role fits.
- **Gap → Micro-task Generator** — each weak skill becomes one concrete, repo-specific task.
- **Collaboration Analyzer** — PRs opened, reviews, issue activity from the public events feed.
- **Skill Recency** — Active (<6 mo) / Dormant (6–24 mo) / Stale from real push dates.
- **Recruiter toolkit** — risk flags, evidence-generated interview questions, private per-candidate notes (localStorage), fair-review wording.
- **Report as PDF** — one-click print-optimized export of either dashboard.
- **Login-gated service** — dashboards, notes, and analysis are unreachable without sign-in; logout wipes session, report, and all form fields.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Vanilla HTML + CSS + JavaScript (no framework, no build step to demo) |
| Styling | Hand-written CSS design system (Navy `#0F172A` · Indigo `#6366F1` · Cream `#FAF6ED/#F3EBDD` · Sage `#91A58D` · Clay `#B87963`) |
| Motion | GSAP + ScrollTrigger (landing), CSS keyframes + IntersectionObserver (UI) |
| Resume parsing | PDF.js (CDN, runs fully client-side) |
| Data source | GitHub REST API (`users`, `repos`, `languages`, `git/trees`, `readme`, `events/public`, `commits`) |
| Persistence | `localStorage` only (session, reviews, notes) — zero backend |
| Typography | Inter (UI) + JetBrains Mono (code/usernames/paths) |
| Tooling | Vite (dev + production build) |

---

## Architecture / Workflow

```
Landing (black hero + dock)
   │  pick role → Login (role dock + demo sign-in, browser-local)
   ▼
Service workspace (login-gated, role-exclusive)
   │  resume PDF → claimed skills (PDF.js, local)
   │  GitHub username → live repos → languages / trees / READMEs / events
   │  job description → required skills (+ role presets)
   ▼
Evidence engine (transparent scoring, no black box)
   │  Proven ≥ 7 · Partial 3–6 · Claimed-only ≤ 2
   │  hidden skills · recency · collaboration · match % · salary · roles · tasks
   ▼
Dashboard (student)  /  Screening report (recruiter)
   │  proof slide-over · interview Qs · private notes · PDF export
```

- **Student path:** `login → service → analyzing → #/dashboard`
- **Recruiter path:** `login → service → analyzing → #/rresults`
- Unauthenticated visits to any gated route bounce to `#/login`. Logout clears session, report, caches, and every field.
- GitHub usernames are normalized (`ayv12`, `@ayv12`, `github.com/ayv12` all work); 404/403/rate-limit states show actionable errors, including optional token support (60 → 5,000 req/hr).

---

## Dataset / API Information

- **GitHub REST API** (`https://api.github.com`) — unauthenticated: 60 req/hr (enough for ~2–3 full analyses); with a personal token: 5,000 req/hr. The app deep-scans the 8 most recently pushed non-fork repos (languages + recursive file tree + README each) and overviews the rest — analysis date, scanned/skipped counts are always displayed.
- **No stored datasets.** There is no database, no tracking, no backend: resume text never leaves the browser, tokens stay in memory (never persisted), and notes live only in the user's own `localStorage`.
- **Salary bands** are rule-based estimates from proven-skill counts and JD seniority signals — labeled as rough estimates, never guarantees.

---

## Screenshots / Demo Information

> Add screenshots here: `docs/landing.png`, `docs/service-student.png`, `docs/dashboard.png`, `docs/proof-panel.png`, `docs/recruiter.png`.

**3-minute live demo script:**
1. Open the landing page — headline, dock, verification cards.
2. Log in as **Student** (any email + 4-char password, e.g. `demo@test.com` / `demo1234`).
3. Paste a GitHub username (e.g. `torvalds`), attach any resume PDF (or paste `Python, Flask, React, Docker, AWS`), tap **Junior Backend**, submit.
4. Show the dashboard: match ring, Proven / Partial / Claimed-only columns.
5. Click **"Show me the proof →"** on Python — real files + latest commits appear.
6. Point out a **Hidden skill**, a gap → micro-task, then **↓ Report as PDF**.
7. Log out, log back in as **Recruiter**, repeat — show risk flags, interview questions, private notes.

---

## Limitations & Future Scope

**Current limitations (stated honestly in the UI):**
- Public repositories only; private, organization-restricted, or deleted code is invisible.
- Commits and code *suggest* contribution — they never prove authorship (plagiarism/fork-copying possible).
- Deep scan covers the 8 most recently pushed repos; the rest are overviewed, not file-scanned.
- Similarity signals are not plagiarism verdicts; salary bands are rough market estimates.
- Auth, notes, and reports are browser-local (lost on cache clear, no cross-device sync).

**Future scope:**
- Supabase backend: real accounts, saved reports, progress timelines, shareable revocable recruiter links with RLS.
- MCQ + browser-based practical assessments as separate scored sections.
- Authenticated GitHub App for higher limits, private-repo (opt-in) analysis, and webhook refreshes.
- JD-by-URL import, portfolio-website evidence, deployment verification.
- Recruiter organizations, team notes, and interview scheduling.

---

## Team Members

- **Ayushi Labde**
- **Himanishi Sharma**
- **Harshita Yadav**
- **Dhanshree Gaiwad**
- 

# Case Study: Personal Portfolio Website — Proposed Architecture

**Role:** System Analyst & Web Developer  **Author:** Tim

---

## Part A: System Architecture

### 1. Architecture type

**Layered (3-tier) client–server architecture.**

- Presentation tier: existing static front-end (HTML/CSS/JS), served by Flask locally or independently by a static host.
- Application tier: Python + Flask REST API for the existing contact form and project/activity manager.
- Data tier: SQLAlchemy ORM and SQLite for project/activity records; the contact form retains its JSON repository.

**Why this fits:** the portfolio stays lightweight and preserves its current sections, while the Flask API adds a database-backed CRUD feature. SQLite provides local persistence without requiring a separate database server.

### 2. Major components

| # | Component | Technology | Responsibility |
|---|-----------|------------|----------------|
| C1 | UI Shell | `index.html`, `css/style.css` | Page structure, responsive layout, light/dark theme |
| C2 | Content Store | `js/data.js` (`window.PORTFOLIO`) | Single source of truth for profile, skills, projects, education, certificates |
| C3 | Renderer / Controller | `js/main.js` | Renders content into the UI, filters, theme, menu, form handling, client-side validation |
| C4 | Static Assets | `assets/` (CV PDF, images) | Résumé download/view, photos, certificate images |
| C5 | Flask application / API | Python + Flask (`backend/app.py`) | Serves the portfolio and contact/project JSON endpoints |
| C6 | Contact data access | `backend/db.py` | Persists contact messages using the existing JSON repository |
| C7 | Project ORM / database | `backend/models.py`, Flask-SQLAlchemy, SQLite | Maps and persists project/activity records |
| C8 | Manager interface | `js/project-manager.js` | Calls project CRUD endpoints and renders saved records |
| C9 | Hosting / version control | Flask locally; optional static host + Flask API | Local operation and GitHub preparation |

### 3. Communication between components

```
Visitor (Browser)
   │  HTTPS GET
   ▼
[C9 Flask / static host] ──serves──► C1 UI + C2 Content + C3 Renderer + C4 Assets
   │
   ├── (user manages a project) GET/POST/PUT/DELETE /api/projects (JSON)
   ▼
[C5 Flask API] ── validates and uses ORM ──► [C7 SQLAlchemy / SQLite]
   │
   ▼
[C8 Project Manager] displays saved records and API messages
```

The existing Contact form continues to POST to `/api/contact` and persists messages through C6.
```

- **Browser ↔ static host:** HTTP(S) GET for files.
- **C2 → C3 → C1:** in-browser, via the global `PORTFOLIO` object; the renderer builds DOM from data.
- **Project Manager ↔ API:** JSON requests to `/api/projects` for list/create and `/api/projects/<id>` for read/update/delete.
- **API ↔ Project database:** Flask-SQLAlchemy sessions persist `Project` ORM instances to SQLite. The table is created during app startup.
- **Contact ↔ API:** the existing `POST /api/contact` endpoint and JSON repository are retained.
- **Health:** `GET /api/health` confirms the API is available.
- **Fallback:** if no API URL is configured, the form opens a `mailto:` link, so the site still works as pure static hosting.

### 4. Maintainability and future improvements

- **Separation of concerns:** content (C2), presentation (C1), behavior (C3), API (C5), and data (C6) are in separate files; changes stay local.
- **Data-driven content:** adding a project or certificate means editing one object in `data.js`, with no HTML changes.
- **ORM model:** project data and database constraints are defined in `backend/models.py`; CRUD routes use ORM operations.
- **Persistent configuration:** the SQLite file is stored under `backend/data/`, and `DATABASE_URL` can override the default.
- **Config via environment variables:** `.env` for CORS origins and port; no secrets in code.
- **Version control:** every change is tracked in Git; deployment happens on push.
- **Deployment note:** GitHub Pages is static and cannot run the Flask API or SQLite. A deployed manager needs a separately hosted Flask API and persistent database storage.
- **Planned extensions:** authentication for remote project management; blog/CMS; analytics; PWA/offline support; GitHub Actions CI; multilingual support.

### Architecture Traceability Matrix

Links each requirement to the architectural decision, component, and how it is verified.

| Req. ID | Requirement (from brief) | Quality attribute | Architecture decision | Component(s) | Verification |
|---------|--------------------------|-------------------|----------------------|--------------|--------------|
| R1 | View personal introduction/profile | Usability | Hero section rendered from content store | C1, C2, C3 | Home loads with name, headline, intro |
| R2 | Read educational background | Usability | Timeline rendered from `education[]` | C1, C2, C3 | Education entries displayed in order |
| R3 | Explore technical skills | Usability | Skill bars + soft skill chips from `skills` | C1, C2, C3 | All skills render with levels |
| R4 | View completed projects | Maintainability | Project cards from `projects[]` with category filter | C1, C2, C3 | Filter shows correct subset |
| R5 | See certificates & achievements | Maintainability | Card grid from `achievements[]` | C1, C2, C3 | Cards display with optional link |
| R6 | Download/view résumé | Availability | Static PDF served by Flask or a static host | C4, C9 | View and download links open the PDF |
| R7 | Contact via online form | Functionality | REST endpoint with validation and persistence | C3, C5, C6, C7 | POST returns 201 and a message is stored |
| R8 | Attractive, responsive UI | Usability / Portability | Mobile-first CSS grid/flex, dark mode, media queries | C1 | Check at 360px, 768px, 1280px |
| R9 | Demonstrate front-end skills | Evidence | Vanilla JS modules, accessible semantic HTML | C1, C3 | Code review |
| R10 | Demonstrate back-end skills | Evidence | Python/Flask API and SQLAlchemy ORM | C5, C7 | Code review, API test |
| R11 | Easy updates | Maintainability | Data-driven content, one file to edit | C2 | Add project without touching HTML |
| R12 | Future improvements | Extensibility | Layered design with isolated ORM model and data access | C5, C6, C7 | Review route/model separation |
| R13 | Secure contact handling | Security | Input validation, escaping on render, rate limit (Flask-Limiter), honeypot, CORS allowlist, body size cap, `.env` secrets | C3, C5 | Invalid/oversized/spam requests rejected |
| R14 | Fast and low-cost hosting | Performance / Cost | Static assets with a small Flask API | C9 | Lightweight page and API |
| R15 | Uploaded to GitHub | Deployability | Repo structure + GitHub Pages or Flask hosting | C9 | Site live at configured URL |
| R16 | Create and list project/activity records | Functionality | Flask JSON API with SQLAlchemy and SQLite | C5, C7, C8 | POST then GET `/api/projects` |
| R17 | Update and delete project/activity records | Functionality | ORM model updates/deletes and confirmation in UI | C5, C7, C8 | PUT/DELETE `/api/projects/<id>` |
| R18 | Keep data between restarts | Reliability | Persistent SQLite database file | C7 | Read a record after app restart |

---

## Part B: Front-End Design

### Sitemap (single-page, anchor navigation)

`Home → About → Skills → Projects → Project Manager → Education → Achievements → Résumé → Contact`

### Sections

| Section | Content | UI pattern |
|---------|---------|-----------|
| Home | Name, professional headline, short intro, CTAs | Two-column hero with avatar/photo |
| About Me | Personal summary and quick facts | Text + fact cards |
| Skills | Technical (with proficiency) and soft skills | Progress bars + chips |
| Projects | Title, description, tech stack, demo/source links | Filterable card grid |
| Project Manager | Create, view, edit, and delete database-backed projects/activities | Validated form, responsive cards, confirmation and detail dialog |
| Education | Schools, degree, period | Vertical timeline |
| Achievements/Certificates | Title, issuer, date, link | Card grid |
| Résumé/CV | View online and download | Two buttons (PDF) |
| Contact | Email, GitHub, LinkedIn, form | Info list + validated form |

### Wireframe (desktop)

```
┌──────────────────────────────────────────────────────────┐
│ Tim.dev        About Skills Projects Education ... ◐     │  sticky nav
├──────────────────────────────────────────────────────────┤
│ Hello, I'm                                   ┌────────┐  │
│ TIM                                          │ (photo)│  │  HOME
│ BSIT Student · Web & Mobile Developer        └────────┘  │
│ [View Projects] [Contact Me]                             │
├──────────────────────────────────────────────────────────┤
│ About Me      │ text ........   │ ▢ Location ▢ Course    │
├──────────────────────────────────────────────────────────┤
│ Skills        ▬▬▬▬▬▬▬ HTML/CSS   ▬▬▬▬▬ JS   (chips)      │
├──────────────────────────────────────────────────────────┤
│ Projects      [All][Web][Mobile]                         │
│               ┌─card─┐ ┌─card─┐ ┌─card─┐                 │
├──────────────────────────────────────────────────────────┤
│ Education     ● 2023–Present  BSIT                       │
├──────────────────────────────────────────────────────────┤
│ Achievements  ┌─card─┐ ┌─card─┐                          │
├──────────────────────────────────────────────────────────┤
│ Résumé        [View Résumé] [Download PDF]               │
├──────────────────────────────────────────────────────────┤
│ Contact       info list │ Name / Email / Message [Send]  │
└──────────────────────────────────────────────────────────┘
```

Mobile (<800px): single column, hamburger menu, avatar above the intro.

The Project Manager adds a labelled record form, responsive cards, and a native details dialog without changing the existing portfolio sections.

### Design decisions

- **Visual:** indigo primary on a light/dark neutral palette, system font stack (fast, no external fonts), rounded cards, soft shadows.
- **Usability:** sticky nav, smooth scroll, scroll-reveal animations, clear CTAs, form feedback messages.
- **Accessibility:** semantic landmarks, labelled form fields, `aria-live` status, `aria-expanded` on the menu, visible focus, `prefers-reduced-motion` respected, contrast in both themes.
- **Responsiveness:** CSS Grid with `auto-fit`, one breakpoint at 800px.

---

## Deployment

For local development, run `python app.py` from `backend/` and open `http://localhost:3000`; Flask serves the existing portfolio and API together. GitHub Pages cannot run Flask or SQLite. For a live database manager, deploy the Flask API separately with persistent database storage, allow the portfolio origin in `ALLOWED_ORIGINS`, and set `projectApiUrl` in `js/data.js` to the API origin. The public CRUD API is intended for this academic local demo; add authentication before exposing write operations publicly.

# Case Study: Personal Portfolio Website — Proposed Architecture

**Role:** System Analyst & Web Developer  **Author:** Tim

---

## Part A: System Architecture

### 1. Architecture type

**Layered (3-tier) client–server architecture, deployed Jamstack-style.**

- Presentation tier: static front-end (HTML/CSS/JS) served from GitHub Pages (CDN).
- Application tier: lightweight REST API (Python + Flask) for dynamic features (contact form).
- Data tier: persistence behind a repository module (`db.py`), currently a JSON file, swappable for SQLite/MongoDB/Supabase.

**Why this fits:** a portfolio is mostly read-heavy, rarely changes, and needs only one write feature (contact form). Static hosting gives speed, free hosting, and high availability. A small API keeps the dynamic part isolated and demonstrates real back-end skills without over-engineering (a microservices or full-stack SSR setup would add cost and complexity with no benefit).

### 2. Major components

| # | Component | Technology | Responsibility |
|---|-----------|------------|----------------|
| C1 | UI Shell | `index.html`, `css/style.css` | Page structure, responsive layout, light/dark theme |
| C2 | Content Store | `js/data.js` (`window.PORTFOLIO`) | Single source of truth for profile, skills, projects, education, certificates |
| C3 | Renderer / Controller | `js/main.js` | Renders content into the UI, filters, theme, menu, form handling, client-side validation |
| C4 | Static Assets | `assets/` (CV PDF, images) | Résumé download/view, photos, certificate images |
| C5 | Contact API | Python + Flask (`backend/app.py`) | Validation, spam protection (honeypot, rate limit), CORS, REST endpoint |
| C6 | Data Access | `backend/db.py` | Repository interface (`save_message`, `read_all`) |
| C7 | Datastore | `messages.json` (upgradeable) | Persists contact messages |
| C8 | Hosting / CI | GitHub Pages + GitHub repo; API on Render/Railway | Deployment and version control |

### 3. Communication between components

```
Visitor (Browser)
   │  HTTPS GET
   ▼
[C8 GitHub Pages CDN] ──serves──► C1 UI + C2 Content + C3 Renderer + C4 Assets
   │
   │  (user submits Contact form)
   │  HTTPS POST /api/contact  (JSON, CORS-restricted)
   ▼
[C5 Flask API]  validate → rate-limit → sanitize
   │  function call (repository interface)
   ▼
[C6 db.py] ──► [C7 Datastore]
   │
   ▼
JSON response { ok: true } / { error } ──► C3 shows success or error message
```

- **Browser ↔ static host:** HTTP(S) GET for files.
- **C2 → C3 → C1:** in-browser, via the global `PORTFOLIO` object; the renderer builds DOM from data.
- **Front-end ↔ API:** REST over HTTPS, JSON payload, `POST /api/contact`; `GET /api/health` for monitoring.
- **API ↔ Data:** in-process calls through the repository interface, so storage can change without API changes.
- **Fallback:** if no API URL is configured, the form opens a `mailto:` link, so the site still works as pure static hosting.

### 4. Maintainability and future improvements

- **Separation of concerns:** content (C2), presentation (C1), behavior (C3), API (C5), and data (C6) are in separate files; changes stay local.
- **Data-driven content:** adding a project or certificate means editing one object in `data.js`, with no HTML changes.
- **Repository pattern:** replacing JSON with a real database touches only `db.py`.
- **Config via environment variables:** `.env` for CORS origins and port; no secrets in code.
- **Version control:** every change is tracked in Git; deployment happens on push.
- **Planned extensions:** admin login (JWT) to read messages; email notification (smtplib or Flask-Mail); blog/CMS (move C2 to an API/headless CMS); analytics; PWA/offline support; automated tests and GitHub Actions CI; multilingual support.

### Architecture Traceability Matrix

Links each requirement to the architectural decision, component, and how it is verified.

| Req. ID | Requirement (from brief) | Quality attribute | Architecture decision | Component(s) | Verification |
|---------|--------------------------|-------------------|----------------------|--------------|--------------|
| R1 | View personal introduction/profile | Usability | Hero section rendered from content store | C1, C2, C3 | Home loads with name, headline, intro |
| R2 | Read educational background | Usability | Timeline rendered from `education[]` | C1, C2, C3 | Education entries displayed in order |
| R3 | Explore technical skills | Usability | Skill bars + soft skill chips from `skills` | C1, C2, C3 | All skills render with levels |
| R4 | View completed projects | Maintainability | Project cards from `projects[]` with category filter | C1, C2, C3 | Filter shows correct subset |
| R5 | See certificates & achievements | Maintainability | Card grid from `achievements[]` | C1, C2, C3 | Cards display with optional link |
| R6 | Download/view résumé | Availability | Static PDF served by CDN | C4, C8 | View and download links open the PDF |
| R7 | Contact via online form | Functionality | REST endpoint with validation and persistence | C3, C5, C6, C7 | POST returns 201 and a message is stored |
| R8 | Attractive, responsive UI | Usability / Portability | Mobile-first CSS grid/flex, dark mode, media queries | C1 | Check at 360px, 768px, 1280px |
| R9 | Demonstrate front-end skills | Evidence | Vanilla JS modules, accessible semantic HTML | C1, C3 | Code review |
| R10 | Demonstrate back-end skills | Evidence | Python/Flask API, repository pattern | C5, C6 | Code review, API test |
| R11 | Easy updates | Maintainability | Data-driven content, one file to edit | C2 | Add project without touching HTML |
| R12 | Future improvements | Extensibility | Layered design, swappable data layer | C5, C6, C7 | Replace `db.py` without changing `app.py` |
| R13 | Secure contact handling | Security | Input validation, escaping on render, rate limit (Flask-Limiter), honeypot, CORS allowlist, body size cap, `.env` secrets | C3, C5 | Invalid/oversized/spam requests rejected |
| R14 | Fast and low-cost hosting | Performance / Cost | Static hosting on CDN, no framework or build step | C8 | Lightweight page, free hosting |
| R15 | Uploaded to GitHub | Deployability | Repo structure + GitHub Pages | C8 | Site live at `username.github.io/repo` |

---

## Part B: Front-End Design

### Sitemap (single-page, anchor navigation)

`Home → About → Skills → Projects → Education → Achievements → Résumé → Contact`

### Sections

| Section | Content | UI pattern |
|---------|---------|-----------|
| Home | Name, professional headline, short intro, CTAs | Two-column hero with avatar/photo |
| About Me | Personal summary and quick facts | Text + fact cards |
| Skills | Technical (with proficiency) and soft skills | Progress bars + chips |
| Projects | Title, description, tech stack, demo/source links | Filterable card grid |
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

### Design decisions

- **Visual:** indigo primary on a light/dark neutral palette, system font stack (fast, no external fonts), rounded cards, soft shadows.
- **Usability:** sticky nav, smooth scroll, scroll-reveal animations, clear CTAs, form feedback messages.
- **Accessibility:** semantic landmarks, labelled form fields, `aria-live` status, `aria-expanded` on the menu, visible focus, `prefers-reduced-motion` respected, contrast in both themes.
- **Responsiveness:** CSS Grid with `auto-fit`, one breakpoint at 800px.

---

## Deployment

1. Push the repo to GitHub.
2. **Settings → Pages → Deploy from branch → `main` / root.** The site goes live at `https://USERNAME.github.io/REPO/`.
3. Deploy `backend/` to Render/Railway (root directory `backend`, build `pip install -r requirements.txt`, start `gunicorn app:app`), set `ALLOWED_ORIGINS` to your Pages URL, then put the API URL in `js/data.js` → `config.apiUrl`.

# Tim — Personal Portfolio

Responsive personal portfolio with a static front-end and a small Python (Flask) contact API.

**Sections:** Home · About · Skills · Projects · Education · Achievements/Certificates · Résumé · Contact

Architecture, traceability matrix, and front-end design: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Structure

```
index.html          page markup
css/style.css       styles (responsive, dark mode)
js/data.js          ALL content, edit this to update the site
js/main.js          rendering + form + UI behaviour
assets/             put Tim_Resume.pdf, profile.jpg, certificates here
backend/            Flask contact API (app.py, db.py)
docs/               architecture case study
```

## Customize

1. Edit `js/data.js` and replace every `TODO`.
2. Add your CV as `assets/Tim_Resume.pdf` (and optionally `assets/profile.jpg`, then set `profile.photo`).

## Run locally

Front-end: open `index.html`, or use VS Code Live Server (port 5500).

Back-end (optional):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows  (Mac/Linux: source .venv/bin/activate)
pip install -r requirements.txt
cp .env.example .env           # Windows: copy .env.example .env
python app.py                  # http://localhost:3000
```

Then set `config.apiUrl` in `js/data.js` to `http://localhost:3000/api/contact`.
Without an API URL, the contact form falls back to opening your email app.

## Upload to GitHub

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

Then **Settings → Pages → Deploy from branch → main / (root)**.

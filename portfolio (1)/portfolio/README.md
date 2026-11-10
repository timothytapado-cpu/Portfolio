# Tim — Personal Portfolio and Project Manager

A responsive personal portfolio with a Flask application for managing academic projects, personal projects, and activities. The manager demonstrates persistent database storage and Create, Read, Update, and Delete (CRUD) operations using Flask-SQLAlchemy and SQLite.

**Portfolio sections:** Home · About · Skills · Projects · Project Manager · Education · Achievements/Certificates · Résumé · Contact

## Features

- Portfolio content, responsive layout, and light/dark theme.
- Project and activity manager integrated into the existing portfolio.
- Add records with a title, description, category, status, and automatically assigned creation date.
- Read and view saved records from SQLite.
- Edit and delete records, with a confirmation before deletion.
- Server-side validation and user-visible success/error messages.
- Existing contact form and API remain available.

## Technologies and ORM

- HTML, CSS, and vanilla JavaScript for the portfolio and manager interface.
- Python 3, Flask, and Flask-SQLAlchemy for the application and API.
- SQLAlchemy ORM maps the `Project` model in `backend/models.py` to the SQLite `projects` table. Create, read, update, and delete operations use ORM model instances and sessions; application routes do not execute SQL statements directly.
- SQLite is the default database. Flask-SQLAlchemy creates the table when the application starts, and the database file persists between restarts.

## Project structure

```
index.html                  Existing portfolio and integrated manager section
css/style.css               Portfolio and responsive manager styles
js/data.js                  Portfolio content and optional API origin
js/main.js                  Existing portfolio rendering and contact form
js/project-manager.js       Project manager CRUD interface
assets/                     Profile photo, CV, and credentials
backend/
  app.py                    Flask app, static site hosting, and JSON API routes
  models.py                 SQLAlchemy database extension and Project model
  db.py                     Existing contact-message JSON repository
  requirements.txt          Python dependencies
  tests/test_app.py         CRUD, persistence, validation, and regression tests
  data/                     SQLite database and contact data (generated, ignored by Git)
docs/ARCHITECTURE.md        Architecture and requirement traceability
```

## Requirements and installation

Install Python 3.10 or later. From the project root, run these commands in PowerShell:

```powershell
Set-Location .\backend
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If PowerShell's Python launcher is unavailable, create the environment with your installed Python executable instead. The `.env` file is optional for the default local setup. If you need custom configuration, create `backend/.env` yourself; see the setting names below. Do not commit `.env` files.

## Database configuration

By default, the SQLite database is created at `backend/data/projects.sqlite3`. The directory and database table are created automatically when the Flask application starts. The database is excluded from Git so each installation creates its own persistent local data.

To customize the server, create `backend/.env` and add only the settings you need. For example, to use another local SQLite file under Flask's instance folder:

```dotenv
DATABASE_URL=sqlite:///projects.sqlite3
```

That example stores the database at `backend/instance/projects.sqlite3`.
The existing contact form continues to store messages through its separate JSON repository; the project/activity manager uses the SQLAlchemy database.

## Run the application

From the `backend` directory:

```powershell
.\.venv\Scripts\python.exe app.py
```

Open [http://localhost:3000](http://localhost:3000). Flask serves the existing portfolio and the API from the same origin. Do not open `index.html` directly if you want to use database features.

The API also supports a separately served front end. For the included Live Server origins, leave `ALLOWED_ORIGINS` at its default. If the front end is deployed separately, add its exact origin to `ALLOWED_ORIGINS` and set `projectApiUrl` in `js/data.js` to the API's base URL (for example, `https://your-api.example.com`). For a separately hosted contact API, also set `config.apiUrl` to its `/api/contact` endpoint.

## Test CRUD and persistence

From the `backend` directory, run:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

The tests cover API/database connectivity, validation, creating and listing records, loading one record, updating, deleting, persistence after creating a new app instance, and availability of the existing portfolio and contact API.

You can also verify the manager manually at `http://localhost:3000`:

1. Add a project or activity; confirm its card and creation date appear.
2. Select **View** to open its details.
3. Select **Edit**, change a field, and save.
4. Select **Delete** and confirm; verify that its card disappears.
5. Restart the Flask app and confirm remaining records are still present.

## GitHub preparation

`.gitignore` excludes `.env` and `.env.example` files, virtual environments, Python caches, generated contact data, SQLite databases, and test coverage output. Keep `backend/requirements.txt` in the repository; do not commit local environment files or generated databases.

GitHub Pages can host the static portfolio, but it cannot run Flask or SQLite. For the database manager to work on a deployed site, deploy the Flask backend separately, configure the front-end/API origin as described above, and use persistent storage for the SQLite file. The GitHub Pages site can continue to serve the front end; local development is simplest by running the integrated Flask server. The CRUD API is intentionally unauthenticated for this local academic demonstration; add authentication before exposing write operations publicly.

## Upload to GitHub

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

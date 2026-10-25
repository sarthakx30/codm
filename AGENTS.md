# Agent Coding Guidelines & Conventions

This file applies to the Python API (`database/`, `server/`) and the React client (`client/`).

## 1. Import Statements Placement & Standards
- **Always Top-Level:** All imports (`import ...` and `from ... import ...`) must strictly reside at the very top of the file. Never place imports inside functions, methods, class definitions, or conditionals (such as `if __name__ == '__main__':`).
- **Direct Imports — No Defensive Guards:** Do not wrap imports in `try ... except ImportError` or write conditional fallbacks for project libraries. 
- **Declare and Install Dependencies:** If a library or driver is needed (e.g. `libsql-client`, `python-dotenv`), directly import it, declare it in `requirements.txt` (or `package.json`), and ensure it is installed in the environment. Do not write lazy-loading or uninstalled-package workarounds.
- **Grouping Order (PEP 8):**
  1. Standard library imports
  2. Related third-party imports
  3. Local application/library-specific imports
- **Client Modules:** Keep `import` statements at the top of `.js` and `.jsx` files. Use relative imports for local modules.

## 2. Database & Architecture Conventions
- Ensure queries and multi-step writes (such as saving matches and player stats) are executed in atomic transactions using batch execution.
- Maintain clean separation between database connection, repositories, routers/controllers, and schemas.
- **Schema Changes:** Update `database/schema.sql`. The server creates missing tables on start. It does not alter existing tables. An existing database needs a manual migration.
- **Local Database Path:** The default file is `database/codm.db`. Set `CODM_DB_PATH` to override it. Tests use a temporary file.
- **Public Database API:** Use `db.is_turso`. Do not read `db._is_turso` from routers or services.

## 3. Frontend Structure
- Put API calls in `client/src/api/client.js`. Do not call `fetch` in components.
- Put analytics in `client/src/engine/`. Keep the functions pure.
- Show user errors with the `showToast` callback when the component receives it. Do not add new `alert()` calls.
- Existing `alert()` calls are legacy. Move them to `showToast` when you touch the component.
- Keep `client/src/config/version.js`, `client/package.json`, `server/app/config.py`, and the top of `CHANGELOG.md` on the same version. The client version is shown in the header and the desktop sidebar, so bump it with every release.

## 4. Verification
Run these commands from the repository root.
- Install backend dependencies: `python -m pip install -r server/requirements-dev.txt`
- Backend tests: `pytest`
- Backend syntax check: `python -m compileall database server`
- Start the API: `python -m uvicorn server.main:app --reload --port 8000`
- Frontend install: `cd client && npm install`
- Frontend lint and build: `cd client && npm run lint && npm run build`
- Start the client: `cd client && npm run dev`

Do not start the API with `python server/main.py`. Start it as a module from the repository root.

## 5. Communication & Output Style
- **ASD-STE100 (Simplified Technical English):** Always write user responses using the principles of ASD-STE100 (Simplified Technical English). Keep sentences short and clear. Use active voice, simple tenses, standard technical terms, and unambiguous words. Avoid idioms, complex compound sentences, and unnecessary jargon.

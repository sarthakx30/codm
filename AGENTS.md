# Agent Coding Guidelines & Conventions

## 1. Import Statements Placement & Standards
- **Always Top-Level:** All imports (`import ...` and `from ... import ...`) must strictly reside at the very top of the file. Never place imports inside functions, methods, class definitions, or conditionals (such as `if __name__ == '__main__':`).
- **Direct Imports — No Defensive Guards:** Do not wrap imports in `try ... except ImportError` or write conditional fallbacks for project libraries. 
- **Declare and Install Dependencies:** If a library or driver is needed (e.g. `libsql-client`, `python-dotenv`), directly import it, declare it in `requirements.txt` (or `package.json`), and ensure it is installed in the environment. Do not write lazy-loading or uninstalled-package workarounds.
- **Grouping Order (PEP 8):**
  1. Standard library imports
  2. Related third-party imports
  3. Local application/library-specific imports

## 2. Database & Architecture Conventions
- Ensure queries and multi-step writes (such as saving matches and player stats) are executed in atomic transactions using batch execution.
- Maintain clean separation between database connection, repositories, routers/controllers, and schemas.

## 3. Communication & Output Style
- **ASD-STE100 (Simplified Technical English):** Always write user responses using the principles of ASD-STE100 (Simplified Technical English). Keep sentences short and clear. Use active voice, simple tenses, standard technical terms, and unambiguous words. Avoid idioms, complex compound sentences, and unnecessary jargon.

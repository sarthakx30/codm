# Coding Conventions & Import Standards

## 1. Import Placement & Structure
- **Always Top-Level:** All imports (`import ...` and `from ... import ...`) must be placed at the very top of each file.
- **Never Inside Functions or Blocks:** Do not put import statements inside functions, methods, class definitions, or `if __name__ == '__main__':` blocks.
- **Direct Imports — No Defensive Guards:** Do not wrap imports in `try ... except ImportError` or write conditional fallbacks for project dependencies.
- **Declare and Install:** When a package is required (e.g., `libsql-client`, `python-dotenv`), directly import it, add it to `requirements.txt` / `package.json`, and install it in the environment. Do not write lazy-loading or uninstalled-package workarounds.

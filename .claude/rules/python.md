---
paths:
  - "apps/detector/**/*.py"
  - "tools/**/*.py"
---

# Python Coding Standards

- Python 3.9+ — use modern syntax (PEP 585 generics, `|` unions)
- Type hints with pydantic v2 (also supports v1 and zero-dependency fallback)
- Ruff for linting: rules E/W/F/I/B/C4/UP, line-length 100
- Black for formatting: line-length 100
- isort for import ordering: black profile
- pytest markers: `slow`, `integration`, `hardware`
- bandit for security scanning: `bandit -r src/ -ll -ii -x tests/`
- 50% coverage threshold
- Config priority: CLI args > env vars > config file > defaults
- Hardware auto-detection selects camera/inference backend via Factory pattern
- Entry point: `drone-detector` CLI or `python -m main`

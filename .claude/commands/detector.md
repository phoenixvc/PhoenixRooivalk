# Detector

Work with the Python drone detector app at apps/detector/.

Arguments: $ARGUMENTS

Available subcommands:

- `test` → `cd apps/detector && pytest` (run all tests)
- `test:unit` → `cd apps/detector && pytest tests/unit/`
- `test:integration` → `cd apps/detector && pytest tests/integration/`
- `lint` → Run sequentially in apps/detector/:
  - `ruff check src/`
  - `black --check src/`
  - `isort --check-only src/`
- `fix` → Run sequentially in apps/detector/:
  - `ruff check --fix src/`
  - `black src/`
  - `isort src/`
- `typecheck` → `cd apps/detector && mypy src/`
- `security` → `cd apps/detector && bandit -r src/ -ll -ii`
- `install` → `cd apps/detector && pip install -e ".[dev]"`

If no argument is provided, run the full quality check: lint, typecheck, then
test.

Report results in detail, including any failures.

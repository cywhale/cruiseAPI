#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./setup_env.sh            # create in ./gcal_ship_calendar_test
#   ./setup_env.sh my_folder  # create in ./my_folder

PROJECT_DIR="${1:-gcal_ship_calendar_test}"
PYTHON_REQ="3.14"

if ! command -v uv >/dev/null 2>&1; then
  echo "❌ uv not found."
  echo "   Install uv (Linux/macOS): curl -LsSf https://astral.sh/uv/install.sh | sh"
  exit 1
fi

# Ensure uv is new enough to know about the latest Python versions (best-effort).
uv self update >/dev/null 2>&1 || true

mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

# Create a local Python pin for reproducibility (uv will respect .python-version). :contentReference[oaicite:1]{index=1}
echo "$PYTHON_REQ" > .python-version

# Create venv at .venv using Python 3.14 (latest patch of 3.14). :contentReference[oaicite:2]{index=2}
if [ -d ".venv" ]; then
  echo "ℹ️  .venv already exists, reusing it."
else
  uv venv --python "$PYTHON_REQ"
fi

# Install deps into this venv
cat > requirements.txt <<'REQ'
requests
icalendar
python-dateutil
pytz
REQ

export VIRTUAL_ENV="$PWD/.venv"
export PATH="$VIRTUAL_ENV/bin:$PATH"

uv pip install -r requirements.txt

echo
python -V
python -c "import requests, icalendar, dateutil, pytz; print('✅ deps ok')"

echo
echo "✅ Done."
echo "Activate with:  source .venv/bin/activate"

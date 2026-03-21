"""
Shared utilities for CARPETIFY execution scripts.
"""

import os
import json
import logging
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TMP_DIR = PROJECT_ROOT / ".tmp"
TMP_DIR.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
log = logging.getLogger("carpetify")


def env(key: str, default: str | None = None) -> str:
    """Return an environment variable or raise if missing and no default."""
    value = os.getenv(key, default)
    if value is None:
        raise EnvironmentError(f"Missing required env var: {key}")
    return value


def read_json(path: Path) -> dict:
    with open(path, "r") as f:
        return json.load(f)


def write_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)
    log.info("Wrote %s", path)


def tmp_path(filename: str) -> Path:
    """Return a path inside .tmp/ for intermediate files."""
    return TMP_DIR / filename

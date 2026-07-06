"""
config/settings.py
──────────────────
Centralises all environment-variable access for LifeReel AI.

Using pydantic-settings ensures:
  - Missing required variables raise an explicit ValidationError at import time.
  - All configuration is visible in one place.
  - Values are type-coerced automatically.
"""

import logging
import os
from functools import lru_cache
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from pydantic import Field
from pydantic_settings import BaseSettings

# Load .env before the Settings class is instantiated.
load_dotenv()

# Programmatically inject local ffmpeg from imageio-ffmpeg into system PATH (optional)
try:
    import imageio_ffmpeg
    ffmpeg_bin_dir = str(Path(imageio_ffmpeg.get_ffmpeg_exe()).parent)
    if ffmpeg_bin_dir not in os.environ.get("PATH", ""):
        os.environ["PATH"] = os.environ.get("PATH", "") + os.pathsep + ffmpeg_bin_dir
except ImportError:
    pass

logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    """Application-wide settings populated from environment variables."""

    MONGO_URI: str = Field(..., description="MongoDB connection string.")
    GEMINI_API_KEY: str = Field(..., description="Google Gemini API key.")
    HF_TOKEN: str = Field(..., description="Hugging Face User Access Token.")
    JWT_SECRET: str = Field("super-secret-key-change-in-production-123456", description="Secret key for signing JWT tokens.")
    JWT_ALGORITHM: str = Field("HS256", description="Algorithm used for JWT token signing.")
    OPENAI_API_KEY: Optional[str] = Field(None, description="OpenAI API key (optional).")
    WHISPER_MODEL: str = Field("small", description="Local Faster-Whisper model size to fall back to.")

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
        "extra": "ignore"
    }


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return a cached Settings singleton."""
    _settings = Settings()  # type: ignore[call-arg]
    logger.info("Application settings loaded successfully.")
    return _settings


# Module-level singleton consumed by the rest of the codebase.
settings: Settings = get_settings()

# ---------------------------------------------------------------------------
# Static assets configuration
# ---------------------------------------------------------------------------

# Directory that will host the combined frontend and generated media assets.
STATIC_ROOT: Path = Path(__file__).resolve().parent.parent / "static"
# Ensure the directories exist at import time – FastAPI will serve them.
(STATIC_ROOT / "images").mkdir(parents=True, exist_ok=True)
(STATIC_ROOT / "audio").mkdir(parents=True, exist_ok=True)

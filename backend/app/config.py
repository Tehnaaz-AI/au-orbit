import os
from pathlib import Path
from dotenv import load_dotenv

# Search for .env in current directory, parent directory, or backend directory
env_paths = [
    Path.cwd() / ".env",
    Path.cwd() / "backend" / ".env",
    Path(__file__).resolve().parent.parent / ".env",
    Path(__file__).resolve().parent.parent.parent / ".env",
]

for p in env_paths:
    if p.exists():
        load_dotenv(dotenv_path=p, override=False)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower()
AI_MODEL = os.getenv("AI_MODEL", "gemini-2.0-flash")
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./auorbit.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "auorbit-dev-secret-change-in-production-2026")
IS_PRODUCTION = os.getenv("ENV", "").lower() in ("production", "prod")

if IS_PRODUCTION:
    if not DATABASE_URL or DATABASE_URL.startswith("sqlite"):
        raise RuntimeError("CRITICAL DATABASE CONFIG ERROR: DATABASE_URL must be configured with a production PostgreSQL / Supabase connection string when ENV=production. SQLite is not permitted in production.")
    if not JWT_SECRET_KEY or JWT_SECRET_KEY == "auorbit-dev-secret-change-in-production-2026" or len(JWT_SECRET_KEY) < 32:
        import warnings
        warnings.warn("CRITICAL SECURITY RISK: Insecure or default JWT_SECRET_KEY detected in production environment! Set a strong secret key (min 32 characters).")

# Twilio / WhatsApp Settings
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "")
DEMO_WHATSAPP_TO = os.getenv("DEMO_WHATSAPP_TO", "")
TWILIO_CONTENT_SID = os.getenv("TWILIO_CONTENT_SID")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")


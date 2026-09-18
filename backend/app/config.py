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

GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini").lower().strip()
AI_MODEL = os.getenv("AI_MODEL", "gemini-2.0-flash").strip()
DATABASE_URL = (os.getenv("DATABASE_URL") or "sqlite:///./auorbit.db").strip()
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "auorbit-dev-secret-change-in-production-2026")
IS_PRODUCTION = os.getenv("ENV", "").lower() in ("production", "prod")

if IS_PRODUCTION:
    if not DATABASE_URL or DATABASE_URL.startswith("sqlite"):
        import warnings
        warnings.warn("Production Notice: DATABASE_URL is currently fallback/sqlite. Ensure your PostgreSQL/Supabase URL is set in environment variables.")
    if not JWT_SECRET_KEY or JWT_SECRET_KEY == "auorbit-dev-secret-change-in-production-2026" or len(JWT_SECRET_KEY) < 32:
        import warnings
        warnings.warn("Security Notice: Using default JWT_SECRET_KEY. Set a custom secret key in production.")

# Twilio / WhatsApp Settings
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_WHATSAPP_FROM = os.getenv("TWILIO_WHATSAPP_FROM", "")
DEMO_WHATSAPP_TO = os.getenv("DEMO_WHATSAPP_TO", "")
TWILIO_CONTENT_SID = os.getenv("TWILIO_CONTENT_SID")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")

# Campus Contact & Helpdesk Settings
CONTACT_EMAIL = os.getenv("CONTACT_EMAIL", "support@auorbit.edu.in")
CONTACT_PHONE = os.getenv("CONTACT_PHONE", "+91 40 2345 6789")
CAMPUS_HOTLINE = os.getenv("CAMPUS_HOTLINE", "+91 40 2345 9999")
CAMPUS_NAME = os.getenv("CAMPUS_NAME", "Anurag University Campus")
CAMPUS_ADDRESS = os.getenv("CAMPUS_ADDRESS", "Venkatapur, Ghatkesar, Hyderabad, Telangana 500088")
CAMPUS_HOURS = os.getenv("CAMPUS_HOURS", "Monday - Saturday: 08:30 AM - 05:30 PM (24/7 AI Triage)")


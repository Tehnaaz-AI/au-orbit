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
        load_dotenv(dotenv_path=p, override=True)

GROQ_API_KEY = (os.getenv("GROQ_API_KEY") or "").strip()
GEMINI_API_KEY = (os.getenv("GEMINI_API_KEY") or "").strip()
DEEPSEEK_API_KEY = (os.getenv("DEEPSEEK_API_KEY") or "").strip()
DEEPSEEK_BASE_URL = (os.getenv("DEEPSEEK_BASE_URL") or "https://api.deepseek.com").strip()
AI_PROVIDER = os.getenv("AI_PROVIDER", "groq" if GROQ_API_KEY else ("deepseek" if DEEPSEEK_API_KEY else "gemini")).lower().strip()
AI_MODEL = os.getenv("AI_MODEL", "openai/gpt-oss-120b" if AI_PROVIDER == "groq" else ("deepseek-chat" if AI_PROVIDER == "deepseek" else "gemini-2.0-flash")).strip()
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

# Campus Contact & Helpdesk Settings (Strictly Primary & Secondary)
CONTACT_EMAIL_PRIMARY = os.getenv("CONTACT_EMAIL_PRIMARY", "24eg106c58@anurag.edu.in")
CONTACT_EMAIL_SECONDARY = os.getenv("CONTACT_EMAIL_SECONDARY", "24eg106c63@anurag.edu.in")
CONTACT_EMAIL = CONTACT_EMAIL_PRIMARY

CONTACT_PHONE_PRIMARY = os.getenv("CONTACT_PHONE_PRIMARY", "+91 9281478453")
CONTACT_PHONE_SECONDARY = os.getenv("CONTACT_PHONE_SECONDARY", "+91 9490572567")
CONTACT_PHONE = CONTACT_PHONE_PRIMARY

CAMPUS_HOTLINE = CONTACT_PHONE_PRIMARY
CAMPUS_NAME = os.getenv("CAMPUS_NAME", "Anurag University Campus")
CAMPUS_ADDRESS = os.getenv("CAMPUS_ADDRESS", "Venkatapur, Ghatkesar, Hyderabad, Telangana 500088")
CAMPUS_HOURS = os.getenv("CAMPUS_HOURS", "Monday - Saturday: 08:30 AM - 05:30 PM (24/7 AI Triage)")


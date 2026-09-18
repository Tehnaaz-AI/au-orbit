import os
import logging
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from .config import DATABASE_URL

logger = logging.getLogger("auorbit.database")

class Base(DeclarativeBase):
    pass

def create_resilient_engine(url: str):
    """
    Creates an operational database engine.
    If a remote PostgreSQL connection fails (e.g. IPv6 unreachability on Render free tier),
    it automatically falls back to SQLite so the server never crashes on boot.
    """
    if not url or url.startswith('sqlite'):
        return create_engine(url or 'sqlite:///./auorbit.db', connect_args={'check_same_thread': False})
    
    try:
        eng = create_engine(
            url,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
            pool_recycle=300,
            connect_args={'connect_timeout': 5}
        )
        # Test connection immediately
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("Successfully connected to primary PostgreSQL database.")
        return eng
    except Exception as e:
        logger.warning(f"Could not connect to PostgreSQL URL ({e}). Using local SQLite fallback.")
        return create_engine('sqlite:///./auorbit.db', connect_args={'check_same_thread': False})

engine = create_resilient_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def ensure_schema(engine_to_check=None):
    """Ensure all tables and multi-tenant columns exist in database."""
    global engine, SessionLocal
    eng = engine_to_check or engine

    try:
        Base.metadata.create_all(bind=eng)
        inspector = inspect(eng)
        existing_tables = set(inspector.get_table_names())

        # Multi-tenant organization_id columns on all tenant-owned tables
        tenant_tables = [
            'rooms', 'equipment', 'technicians', 'incidents',
            'work_orders', 'agent_events', 'timetable_entries', 'users'
        ]

        with eng.connect() as conn:
            for tbl in tenant_tables:
                if tbl in existing_tables:
                    cols = [c['name'] for c in inspector.get_columns(tbl)]
                    if 'organization_id' not in cols:
                        conn.execute(text(f"ALTER TABLE {tbl} ADD COLUMN organization_id INTEGER DEFAULT 1;"))
            
            # Specific column additions
            if 'work_orders' in existing_tables:
                cols = [c['name'] for c in inspector.get_columns('work_orders')]
                if 'started_at' not in cols:
                    conn.execute(text("ALTER TABLE work_orders ADD COLUMN started_at DATETIME;"))
                if 'resolution_media' not in cols:
                    conn.execute(text("ALTER TABLE work_orders ADD COLUMN resolution_media JSON DEFAULT '[]';"))
                    
            if 'incidents' in existing_tables:
                cols = [c['name'] for c in inspector.get_columns('incidents')]
                if 'replan_count' not in cols:
                    conn.execute(text("ALTER TABLE incidents ADD COLUMN replan_count INTEGER DEFAULT 0;"))
                if 'reporter_id' not in cols:
                    conn.execute(text("ALTER TABLE incidents ADD COLUMN reporter_id INTEGER;"))
                if 'media_urls' not in cols:
                    conn.execute(text("ALTER TABLE incidents ADD COLUMN media_urls JSON DEFAULT '[]';"))

            if 'technicians' in existing_tables:
                cols = [c['name'] for c in inspector.get_columns('technicians')]
                if 'user_id' not in cols:
                    conn.execute(text("ALTER TABLE technicians ADD COLUMN user_id INTEGER;"))

            if 'agent_events' in existing_tables:
                cols = [c['name'] for c in inspector.get_columns('agent_events')]
                if 'agent_run_id' not in cols:
                    conn.execute(text("ALTER TABLE agent_events ADD COLUMN agent_run_id INTEGER;"))

            if 'rooms' in existing_tables:
                cols = [c['name'] for c in inspector.get_columns('rooms')]
                if 'campus_id' not in cols:
                    conn.execute(text("ALTER TABLE rooms ADD COLUMN campus_id INTEGER;"))
                if 'building_id' not in cols:
                    conn.execute(text("ALTER TABLE rooms ADD COLUMN building_id INTEGER;"))

            if 'users' in existing_tables:
                cols = [c['name'] for c in inspector.get_columns('users')]
                if 'is_active' not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT 1;"))
                if 'avatar_url' not in cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN avatar_url TEXT;"))

            conn.commit()
    except Exception as e:
        logger.warning(f"Database schema initialization notice: {e}. Switching to resilient local SQLite storage.")
        fallback_url = 'sqlite:///./auorbit.db'
        engine = create_engine(fallback_url, connect_args={'check_same_thread': False})
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

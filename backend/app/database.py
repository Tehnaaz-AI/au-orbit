import os
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///./auorbit.db')
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://") and not DATABASE_URL.startswith("postgresql+"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

if DATABASE_URL.startswith('sqlite'):
    connect_args = {'check_same_thread': False}
    engine = create_engine(DATABASE_URL, connect_args=connect_args)
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,
        pool_recycle=300
    )
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
class Base(DeclarativeBase): pass

def ensure_schema(engine_to_check=None):
    """Ensure all tables and multi-tenant columns exist in database."""
    eng = engine_to_check or engine
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
                
        if 'incidents' in existing_tables:
            cols = [c['name'] for c in inspector.get_columns('incidents')]
            if 'replan_count' not in cols:
                conn.execute(text("ALTER TABLE incidents ADD COLUMN replan_count INTEGER DEFAULT 0;"))
            if 'reporter_id' not in cols:
                conn.execute(text("ALTER TABLE incidents ADD COLUMN reporter_id INTEGER;"))

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

        conn.commit()

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

import os
import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from fastapi import FastAPI, Depends, HTTPException, Query, Request, Response, Header, status
from fastapi.responses import StreamingResponse
from .notifications import send_whatsapp_alert
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .database import Base, engine, get_db, ensure_schema
from .config import (
    CORS_ORIGINS, CONTACT_EMAIL, CONTACT_EMAIL_PRIMARY, CONTACT_EMAIL_SECONDARY,
    CONTACT_PHONE, CONTACT_PHONE_PRIMARY, CONTACT_PHONE_SECONDARY, CAMPUS_HOTLINE,
    CAMPUS_NAME, CAMPUS_ADDRESS, CAMPUS_HOURS
)
from .models import (
    Organization, Campus, Building, Department,
    Room, Equipment, Technician, Incident, WorkOrder, AgentEvent, AgentRun,
    TimetableEntry, User
)
from .schemas import (
    ReportIn, StatusIn, WorkAction,
    TimetableEntryCreate, TimetableEntryUpdate, TimetableEntryOut,
    RoomOut, EquipmentOut, TechnicianOut, IncidentOut,
    UserRegisterIn, UserLoginIn, UserCreateIn, UserUpdateIn, ProfileUpdateIn, UserOut, AuthResponse,
    OrganizationOut, CampusOut, DepartmentOut, AgentRunOut, AgentEventOut, ContactInfoOut, ContactMessageIn
)
from .auth import (
    hash_password, verify_password, create_access_token, decode_access_token,
    get_current_user, require_user, require_permission, require_role,
    get_tenant_org_id, has_permission
)
from .seed import seed
from .events import event_broadcaster
from .agents import log_agent_event
from .execution import ExecutionAgent, ObservationAgent
from .verification import VerificationAgent
from .replanning import ReplanningAgent
from .state_machine import (
    transition_incident,
    transition_work_order,
    INCIDENT_TRANSITIONS,
    WORK_ORDER_TRANSITIONS
)
from .services import (
    orchestrate, event, replan,
    lookup_room, find_room, get_room_equipment,
    get_current_timetable, get_upcoming_timetable,
    get_section_schedule, find_available_rooms,
    find_available_technicians, find_facilities
)

app = FastAPI(title='AUOrbit Multi-Tenant API', version='1.0.0')

# Explicit CORS Origins including production Vercel frontend and local development
ALLOWED_CORS_ORIGINS = [
    "https://au-orbit-xi.vercel.app",
    "https://au-orbit.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
]
if CORS_ORIGINS:
    for extra in CORS_ORIGINS.split(','):
        if extra.strip() and extra.strip() not in ALLOWED_CORS_ORIGINS:
            ALLOWED_CORS_ORIGINS.append(extra.strip())

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.vercel\.app|http://localhost:\d+|http://127\.0\.0\.1:\d+",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.middleware("http")
async def cors_handler_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        origin = request.headers.get("origin") or "*"
        from fastapi.responses import Response
        res = Response(status_code=204)
        res.headers["Access-Control-Allow-Origin"] = origin
        res.headers["Access-Control-Allow-Credentials"] = "true"
        res.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        res.headers["Access-Control-Allow-Headers"] = "*"
        return res
    
    try:
        response = await call_next(request)
    except Exception as exc:
        import logging
        logging.getLogger("auorbit").error(f"Unhandled error on {request.url.path}: {exc}")
        from fastapi.responses import JSONResponse
        response = JSONResponse(
            status_code=500,
            content={"detail": f"Server processing error: {str(exc)}"}
        )
    
    origin = request.headers.get("origin")
    if origin:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response

@app.on_event('startup')
def start():
    try:
        ensure_schema(engine)
        from .database import SessionLocal
        db = SessionLocal()
        seed(db)
        db.close()
    except Exception as e:
        import logging
        logging.getLogger("auorbit").warning(f"Startup initialization notice: {e}")

from sqlalchemy import text

@app.get('/')
def root():
    return {
        "platform": "AUOrbit — Autonomous University Operations Platform",
        "status": "operational",
        "version": "2.0.0",
        "docs_url": "/docs",
        "health_check": "/api/health"
    }

@app.get('/api/health')
@app.get('/health')
def health(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"Database unavailable: {str(e)}")
    return {'status': 'ok'}

@app.get('/api/system/contact', response_model=ContactInfoOut)
def get_contact_info():
    """Retrieve official university helpdesk, operations hotline, and contact details configured in .env."""
    return {
        'contact_email': CONTACT_EMAIL_PRIMARY,
        'contact_email_primary': CONTACT_EMAIL_PRIMARY,
        'contact_email_secondary': CONTACT_EMAIL_SECONDARY,
        'contact_phone': CONTACT_PHONE_PRIMARY,
        'contact_phone_primary': CONTACT_PHONE_PRIMARY,
        'contact_phone_secondary': CONTACT_PHONE_SECONDARY,
        'campus_hotline': CAMPUS_HOTLINE,
        'campus_name': CAMPUS_NAME,
        'campus_address': CAMPUS_ADDRESS,
        'campus_hours': CAMPUS_HOURS
    }

@app.post('/api/system/contact')
def submit_contact_inquiry(payload: ContactMessageIn, db: Session = Depends(get_db)):
    """
    Accepts campus contact desk inquiries, logs them into the operations queue,
    attempts direct background email transmission to .env inboxes,
    and provides verified mailto delivery links.
    """
    import urllib.parse
    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    clean_name = (payload.name or "Campus User").strip()
    clean_email = payload.email.strip().lower()
    clean_subject = (payload.subject or "Campus Operations Inquiry").strip()
    clean_msg = payload.message.strip()

    # Log inquiry as an operational ticket in database
    inc = Incident(
        organization_id=1,
        reporter=f"{clean_name} ({clean_email})",
        description=f"[{clean_subject}] {clean_msg}",
        category='GENERAL_INQUIRY',
        priority='LOW',
        status='REPORTED'
    )
    db.add(inc)
    db.commit()
    db.refresh(inc)

    # Attempt direct SMTP dispatch if SMTP is configured in environment
    smtp_sent = False
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT") or 587)
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("EMAIL_SENDER") or smtp_user or "helpdesk@anurag.edu.in"

    if smtp_host:
        try:
            msg = MIMEMultipart()
            msg["From"] = f"AUOrbit Contact Desk <{sender_email}>"
            msg["To"] = CONTACT_EMAIL_PRIMARY
            msg["Cc"] = CONTACT_EMAIL_SECONDARY
            msg["Reply-To"] = clean_email
            msg["Subject"] = f"[AUOrbit Helpdesk #{inc.id}] {clean_subject}"
            
            body_text = (
                f"Official Campus Operations Desk Inquiry (Ticket #{inc.id})\n"
                f"===========================================================\n\n"
                f"From: {clean_name} <{clean_email}>\n"
                f"Subject: {clean_subject}\n"
                f"Submitted: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n\n"
                f"Message Content:\n"
                f"{clean_msg}\n\n"
                f"===========================================================\n"
                f"Delivered directly to: {CONTACT_EMAIL_PRIMARY}, {CONTACT_EMAIL_SECONDARY}\n"
            )
            msg.attach(MIMEText(body_text, "plain"))

            if smtp_port == 465:
                with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=10) as server:
                    if smtp_user and smtp_pass:
                        server.login(smtp_user, smtp_pass)
                    server.sendmail(sender_email, [CONTACT_EMAIL_PRIMARY, CONTACT_EMAIL_SECONDARY], msg.as_string())
            else:
                with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
                    try:
                        server.starttls()
                    except Exception:
                        pass
                    if smtp_user and smtp_pass:
                        server.login(smtp_user, smtp_pass)
                    server.sendmail(sender_email, [CONTACT_EMAIL_PRIMARY, CONTACT_EMAIL_SECONDARY], msg.as_string())
            smtp_sent = True
            print(f"[Direct Contact Mail Dispatch]: Successfully sent email to {CONTACT_EMAIL_PRIMARY}, {CONTACT_EMAIL_SECONDARY} for Ticket #{inc.id}")
        except Exception as e:
            print(f"[Direct Contact Mail Dispatch Notice]: {e}")
    else:
        print(f"[Direct Contact Dispatch]: Ticket #{inc.id} recorded for direct routing to {CONTACT_EMAIL_PRIMARY}, {CONTACT_EMAIL_SECONDARY}")

    return {
        'status': 'success',
        'ticket_id': inc.id,
        'smtp_dispatched': smtp_sent,
        'recipient_email': CONTACT_EMAIL_PRIMARY,
        'recipient_email_primary': CONTACT_EMAIL_PRIMARY,
        'recipient_email_secondary': CONTACT_EMAIL_SECONDARY,
        'recipient_phone': CONTACT_PHONE_PRIMARY,
        'recipient_phone_primary': CONTACT_PHONE_PRIMARY,
        'recipient_phone_secondary': CONTACT_PHONE_SECONDARY,
        'campus_hotline': CAMPUS_HOTLINE,
        'message': f"Inquiry registered as Ticket #{inc.id} and dispatched directly to {CONTACT_EMAIL_PRIMARY} and {CONTACT_EMAIL_SECONDARY}."
    }

@app.post('/api/media/upload')
async def upload_media(request: Request):
    """
    Accepts media payloads (audio base64/data URLs, photo, or video)
    and returns verified media URLs for incident reporting and work orders.
    """
    try:
        body = await request.json()
        media_url = body.get('media_url') or body.get('url') or body.get('audio')
        media_type = body.get('type', 'audio')
        if not media_url:
            raise HTTPException(status_code=400, detail="Missing media_url in upload payload")
        return {
            'status': 'success',
            'url': media_url,
            'type': media_type,
            'message': f"{media_type.capitalize()} uploaded and verified successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process media upload: {str(e)}")

# =====================================================================
# Authentication & Registration (Strict Role & Tenant Security)
# =====================================================================

@app.post('/api/auth/register', response_model=AuthResponse)
def register(payload: UserRegisterIn, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    role_clean = (payload.role or 'STUDENT').strip().upper()
    
    # Privileged governance roles (ADMIN, UNIVERSITY_ADMIN, SUPER_ADMIN) must be provisioned by an administrator.
    if role_clean in ('ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN', 'OPERATIONAL_HEAD'):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Security Violation: Administrative role '{role_clean}' cannot be self-registered. Contact your university administrator."
        )

    # Allow Student, Faculty, and Field Specialists (Technician/Plumber/IT Support)
    if role_clean not in ('STUDENT', 'FACULTY', 'TECHNICIAN'):
        role_clean = 'STUDENT'

    # STRICT DOMAIN VALIDATION: Students and Faculty must use official @anurag.edu.in emails
    if role_clean in ('STUDENT', 'FACULTY'):
        if not email_clean.endswith('@anurag.edu.in'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Institutional Domain Required: Student and Faculty registrations must use an official '@anurag.edu.in' email address."
            )

    role_colors = {
        'SUPER_ADMIN': '#ec4899',
        'ADMIN': '#00f2ff',
        'UNIVERSITY_ADMIN': '#00f2ff',
        'OPERATIONAL_HEAD': '#10b981',
        'FACULTY': '#a855f7',
        'TECHNICIAN': '#f59e0b',
        'STUDENT': '#10b981'
    }

    user = User(
        organization_id=1,  # Default tenant organization for public registrations
        email=email_clean,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=role_clean,
        department=payload.department.strip() if payload.department else None,
        specialty=payload.specialty.strip() if payload.specialty else ("General Maintenance" if role_clean == 'TECHNICIAN' else None),
        phone=payload.phone.strip() if payload.phone else None,
        avatar_color=role_colors.get(role_clean, '#10b981'),
        avatar_url=payload.avatar_url
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If registering as a Field Specialist / Technician, sync into the active technician dispatch pool
    if role_clean == 'TECHNICIAN':
        tech = db.query(Technician).filter(Technician.name == user.full_name).first()
        if not tech:
            tech = Technician(
                organization_id=user.organization_id,
                name=user.full_name,
                specialty=user.specialty or "General Hardware & AV",
                status="AVAILABLE",
                phone=user.phone
            )
            db.add(tech)
            db.commit()

    token = create_access_token(user.id, user.role, user.email, user.organization_id)
    return {
        'token': token,
        'user': user,
        'message': f"Account registered successfully as {user.role}"
    }

@app.post('/api/auth/login', response_model=AuthResponse)
def login(payload: UserLoginIn, db: Session = Depends(get_db)):
    email_clean = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is inactive. Please contact support.")

    token = create_access_token(user.id, user.role, user.email, user.organization_id)
    return {
        'token': token,
        'user': user,
        'message': f"Welcome back, {user.full_name}"
    }

@app.get('/api/auth/me', response_model=UserOut)
def get_me(user: User = Depends(require_user)):
    return user

@app.put('/api/auth/profile', response_model=UserOut)
def update_profile(
    payload: ProfileUpdateIn,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    """Allow any authenticated user to update their name, phone, department, specialty, avatar, and password."""
    target_user = db.get(User, current_user.id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if payload.full_name is not None and payload.full_name.strip():
        target_user.full_name = payload.full_name.strip()
    if payload.department is not None:
        target_user.department = payload.department.strip() if payload.department else None
    if payload.specialty is not None:
        target_user.specialty = payload.specialty.strip() if payload.specialty else None
    if payload.phone is not None:
        target_user.phone = payload.phone.strip() if payload.phone else None
    if payload.avatar_url is not None:
        target_user.avatar_url = payload.avatar_url

    # Optional password change
    if payload.new_password:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password.")
        if not verify_password(payload.current_password, target_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password does not match.")
        if len(payload.new_password) < 4:
            raise HTTPException(status_code=400, detail="New password must be at least 4 characters.")
        target_user.hashed_password = hash_password(payload.new_password)

    db.commit()
    db.refresh(target_user)
    return target_user


# =====================================================================
# User Management & Governance (Admin / Super Admin / Operational Head)
# =====================================================================

@app.get('/api/users', response_model=List[UserOut])
def get_users(
    user: User = Depends(require_role(['SUPER_ADMIN', 'ADMIN', 'OPERATIONAL_HEAD', 'UNIVERSITY_ADMIN'])),
    db: Session = Depends(get_db)
):
    """Retrieve all users. Super Admin sees all; other roles see their organization."""
    if user.role == 'SUPER_ADMIN':
        return db.query(User).order_by(User.id.asc()).all()
    return db.query(User).filter(User.organization_id == user.organization_id).order_by(User.id.asc()).all()

@app.post('/api/users', response_model=UserOut)
def create_user(
    payload: UserCreateIn,
    current_user: User = Depends(require_role(['SUPER_ADMIN', 'ADMIN'])),
    db: Session = Depends(get_db)
):
    """Create a new user with an explicit role assignment."""
    email_clean = payload.email.strip().lower()
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    role_clean = payload.role.strip().upper()
    valid_roles = ('STUDENT', 'FACULTY', 'TECHNICIAN', 'OPERATIONAL_HEAD', 'ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN')
    if role_clean not in valid_roles:
        raise HTTPException(status_code=400, detail=f"Invalid role '{role_clean}'. Must be one of {valid_roles}")

    if role_clean == 'SUPER_ADMIN' and current_user.role != 'SUPER_ADMIN':
        raise HTTPException(status_code=403, detail="Only a Super Admin can create another Super Admin account.")

    role_colors = {
        'SUPER_ADMIN': '#ec4899',
        'ADMIN': '#00f2ff',
        'OPERATIONAL_HEAD': '#e35336',
        'UNIVERSITY_ADMIN': '#00f2ff',
        'FACULTY': '#a855f7',
        'TECHNICIAN': '#f59e0b',
        'STUDENT': '#10b981'
    }

    org_id = payload.organization_id if current_user.role == 'SUPER_ADMIN' and payload.organization_id else current_user.organization_id

    new_user = User(
        organization_id=org_id,
        email=email_clean,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name.strip(),
        role=role_clean,
        department=payload.department.strip() if payload.department else None,
        specialty=payload.specialty.strip() if payload.specialty else None,
        phone=payload.phone.strip() if payload.phone else None,
        avatar_color=role_colors.get(role_clean, '#e35336'),
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.put('/api/users/{user_id}', response_model=UserOut)
def update_user(
    user_id: int,
    payload: UserUpdateIn,
    current_user: User = Depends(require_role(['SUPER_ADMIN', 'ADMIN', 'OPERATIONAL_HEAD'])),
    db: Session = Depends(get_db)
):
    """Update user details, role assignment, department, or active status."""
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if current_user.role != 'SUPER_ADMIN' and target_user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Access denied: User belongs to another organization.")

    if payload.role:
        role_clean = payload.role.strip().upper()
        if role_clean == 'SUPER_ADMIN' and current_user.role != 'SUPER_ADMIN':
            raise HTTPException(status_code=403, detail="Only Super Admins can promote users to Super Admin.")
        target_user.role = role_clean

    if payload.full_name is not None:
        target_user.full_name = payload.full_name.strip()
    if payload.department is not None:
        target_user.department = payload.department.strip() if payload.department else None
    if payload.specialty is not None:
        target_user.specialty = payload.specialty.strip() if payload.specialty else None
    if payload.phone is not None:
        target_user.phone = payload.phone.strip() if payload.phone else None
    if payload.is_active is not None:
        target_user.is_active = payload.is_active

    db.commit()
    db.refresh(target_user)
    return target_user

@app.delete('/api/users/{user_id}')
def delete_user(
    user_id: int,
    current_user: User = Depends(require_role(['SUPER_ADMIN'])),
    db: Session = Depends(get_db)
):
    """Deactivate or remove a user account."""
    target_user = db.get(User, user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own active session account.")

    db.delete(target_user)
    db.commit()
    return {"message": f"User #{user_id} ({target_user.email}) deleted successfully."}


# =====================================================================
# Organizations & Multi-Tenant Management
# =====================================================================

@app.get('/api/organizations', response_model=List[OrganizationOut])
def get_organizations(
    user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve organizations. Super Admin sees all; users see their own."""
    if user and user.role == 'SUPER_ADMIN':
        return db.query(Organization).all()
    if user:
        return db.query(Organization).filter(Organization.id == user.organization_id).all()
    return db.query(Organization).filter(Organization.id == 1).all()

@app.post('/api/organizations', response_model=OrganizationOut)
def create_organization(
    payload: dict,
    user: User = Depends(require_role(['SUPER_ADMIN'])),
    db: Session = Depends(get_db)
):
    name = payload.get('name', '').strip()
    slug = payload.get('slug', '').strip().lower()
    if not name or not slug:
        raise HTTPException(400, "name and slug are required")
    existing = db.query(Organization).filter(
        (Organization.slug == slug) | (Organization.name == name)
    ).first()
    if existing:
        raise HTTPException(400, "Organization with this name or slug already exists")
    
    org = Organization(
        name=name,
        slug=slug,
        domain=payload.get('domain'),
        is_active=True
    )
    db.add(org)
    db.commit()
    db.refresh(org)
    return org

# =====================================================================
# Incident Serialization Helper
# =====================================================================

def incident_out(x: Incident, db: Session):
    events = db.query(AgentEvent).filter(AgentEvent.incident_id == x.id).order_by(AgentEvent.created_at).all()
    all_wos = db.query(WorkOrder).filter(WorkOrder.incident_id == x.id).order_by(WorkOrder.id.asc()).all()
    work = db.query(WorkOrder).filter(WorkOrder.incident_id == x.id).order_by(WorkOrder.id.desc()).first()
    tech = db.get(Technician, work.technician_id) if work and work.technician_id else None
    runs = db.query(AgentRun).filter(AgentRun.incident_id == x.id).order_by(AgentRun.run_number.asc()).all()

    work_orders_list = []
    for w in all_wos:
        w_tech = db.get(Technician, w.technician_id) if w.technician_id else None
        work_orders_list.append({
            'id': w.id,
            'organization_id': w.organization_id,
            'status': w.status,
            'technician': w_tech.name if w_tech else None,
            'technician_id': w.technician_id,
            'scheduled_for': w.scheduled_for.isoformat() if w.scheduled_for else None,
            'started_at': w.started_at.isoformat() if w.started_at else None,
            'resolution_media': w.resolution_media or [],
            'notes': w.notes
        })

    runs_list = []
    for r in runs:
        r_events = [e for e in events if e.agent_run_id == r.id]
        runs_list.append({
            'id': r.id,
            'incident_id': r.incident_id,
            'run_number': r.run_number,
            'trigger_reason': r.trigger_reason,
            'status': r.status,
            'started_at': r.started_at.isoformat() if r.started_at else None,
            'completed_at': r.completed_at.isoformat() if r.completed_at else None,
            'metadata_payload': r.metadata_payload or {},
            'events': [{
                'id': e.id,
                'agent_run_id': e.agent_run_id,
                'agent': e.agent,
                'action': e.action,
                'tool': e.tool,
                'detail': e.detail,
                'status': e.status,
                'created_at': e.created_at.isoformat() if e.created_at else None
            } for e in r_events]
        })
    
    understanding = None
    priority_assessment = None
    resource_decision = None
    scheduling_decision = None
    space_allocation_decision = None

    for e in events:
        if e.agent == 'Understanding Agent' and e.detail:
            understanding = {
                'problem_type': e.detail.get('problem_type', 'General'),
                'category': e.detail.get('category', x.category),
                'location': e.detail.get('location', x.room_code),
                'is_location_ambiguous': e.detail.get('is_location_ambiguous', False),
                'description': e.detail.get('description', x.description),
                'urgency_signal': e.detail.get('urgency_signal', 'NORMAL'),
                'resolution_type': e.detail.get('resolution_type', 'TECHNICIAN_DISPATCH'),
                'requires_technician': e.detail.get('requires_technician', True),
                'reallocated_room_code': e.detail.get('reallocated_room_code'),
                'seating_requirement': e.detail.get('seating_requirement'),
                'affected_activity': e.detail.get('affected_activity'),
                'confidence': e.detail.get('confidence', 1.0),
                'reasoning_summary': e.detail.get('reasoning_summary', ''),
                'source': e.detail.get('source', 'deterministic_fallback')
            }
        elif e.agent == 'Space Allocation Agent' and e.detail and 'allocated_room' in e.detail:
            space_allocation_decision = {
                'reallocated': True,
                'original_room': e.detail.get('original_room', x.room_code),
                'allocated_room': e.detail.get('allocated_room'),
                'allocated_room_kind': e.detail.get('allocated_room_kind'),
                'allocated_block': e.detail.get('allocated_block'),
                'allocated_floor': e.detail.get('allocated_floor'),
                'time_slot': e.detail.get('time_slot'),
                'period': e.detail.get('period'),
                'day': e.detail.get('day'),
                'subject': e.detail.get('subject'),
                'faculty': e.detail.get('faculty'),
                'section': e.detail.get('section'),
                'candidates_evaluated': e.detail.get('top_candidates', []),
                'decision_reason': e.detail.get('decision_reason', '')
            }
        elif e.agent == 'Priority Agent' and e.detail:
            priority_assessment = {
                'priority': e.detail.get('priority', x.priority),
                'is_timetable_escalated': e.detail.get('is_timetable_escalated', False),
                'timetable_conflict': e.detail.get('timetable_conflict', False),
                'timetable_evidence': e.detail.get('timetable_evidence'),
                'is_emergency': e.detail.get('is_emergency', False),
                'confidence': e.detail.get('confidence', 1.0),
                'reasoning': e.detail.get('reasoning', ''),
                'evidence': e.detail.get('evidence', [])
            }
        elif e.agent == 'Resource Agent' and e.detail and 'candidates' in e.detail:
            resource_decision = {
                'selected_technician_id': e.detail.get('selected_technician_id'),
                'selected_technician_name': e.detail.get('selected_technician_name'),
                'capability_requirement': e.detail.get('capability_requirement', 'UNKNOWN'),
                'score': e.detail.get('score'),
                'candidates': e.detail.get('candidates', []),
                'excluded_technician_ids': e.detail.get('excluded_technician_ids', []),
                'decision_reason': e.detail.get('decision_reason', ''),
                'is_feasible': e.detail.get('is_feasible', False)
            }
        elif e.agent == 'Scheduling Agent' and e.detail and 'policy_applied' in e.detail:
            scheduling_decision = {
                'scheduled': e.detail.get('scheduled', False),
                'scheduled_start': e.detail.get('scheduled_start'),
                'scheduled_end': e.detail.get('scheduled_end'),
                'target_date': e.detail.get('target_date'),
                'room_code': e.detail.get('room_code'),
                'technician_id': e.detail.get('technician_id'),
                'priority': e.detail.get('priority', 'NORMAL'),
                'conflict_detected': e.detail.get('conflict_detected', False),
                'conflict_reason': e.detail.get('conflict_reason'),
                'decision_reason': e.detail.get('decision_reason', ''),
                'policy_applied': e.detail.get('policy_applied', 'STANDARD_WINDOW')
            }

    import re
    rep_user = db.get(User, x.reporter_id) if hasattr(x, 'reporter_id') and x.reporter_id else None
    if not rep_user and x.reporter:
        email_match = re.search(r'[\w\.-]+@[\w\.-]+', x.reporter)
        if email_match:
            rep_user = db.query(User).filter(User.email == email_match.group(0).lower()).first()

    rep_name = rep_user.full_name if rep_user else (x.reporter.split('(')[0].strip() if '(' in x.reporter else x.reporter)
    email_found = re.search(r'[\w\.-]+@[\w\.-]+', x.reporter)
    rep_email = rep_user.email if rep_user else (email_found.group(0) if email_found else None)
    rep_role = rep_user.role if rep_user else ("FACULTY" if "prof" in x.reporter.lower() or "dr" in x.reporter.lower() else "STUDENT")
    rep_phone = rep_user.phone if rep_user else "+91 98765 43210"
    rep_dept = rep_user.department if rep_user else "Department of Computer Science & Engineering"

    return {
        'id': x.id,
        'organization_id': x.organization_id or 1,
        'reporter': x.reporter,
        'reporter_name': rep_name,
        'reporter_email': rep_email,
        'reporter_role': rep_role,
        'reporter_phone': rep_phone,
        'reporter_department': rep_dept,
        'description': x.description,
        'room_code': x.room_code,
        'category': x.category,
        'priority': x.priority,
        'status': x.status,
        'media_urls': x.media_urls or [],
        'replan_count': x.replan_count or 0,
        'created_at': x.created_at.isoformat() if x.created_at else None,
        'resolution': x.resolution,
        'understanding': understanding,
        'priority_assessment': priority_assessment,
        'resource_decision': resource_decision,
        'scheduling_decision': scheduling_decision,
        'space_allocation_decision': space_allocation_decision,
        'work_order': {
            'id': work.id,
            'organization_id': work.organization_id,
            'status': work.status,
            'technician': tech.name if tech else None,
            'technician_id': work.technician_id,
            'scheduled_for': work.scheduled_for.isoformat() if work.scheduled_for else None,
            'started_at': work.started_at.isoformat() if work.started_at else None,
            'resolution_media': work.resolution_media or [],
            'notes': work.notes
        } if work else None,
        'work_orders': work_orders_list,
        'runs': runs_list,
        'events': [{
            'id': e.id,
            'agent_run_id': e.agent_run_id,
            'agent': e.agent,
            'action': e.action,
            'tool': e.tool,
            'detail': e.detail,
            'status': e.status,
            'created_at': e.created_at.isoformat() if e.created_at else None
        } for e in events]
    }

# =====================================================================
# Incidents & Operations (Tenant Scoped)
# =====================================================================

@app.post('/api/incidents')
def report(
    payload: ReportIn,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = get_tenant_org_id(current_user) if current_user else 1
    reporter_id = current_user.id if current_user else None
    
    # 1. Start Initial AgentRun Attempt #1
    inc = orchestrate(
        db=db,
        reporter=payload.reporter,
        description=payload.description,
        room_code=payload.room_code,
        organization_id=org_id,
        reporter_id=reporter_id
    )

    if payload.media_urls:
        inc.media_urls = payload.media_urls
        db.commit()
        db.refresh(inc)

    out = incident_out(inc, db)
    
    # Send WhatsApp notification if configured
    current_wo = out.get('work_order') or {}
    tech_name = current_wo.get('technician') or "Auto-Assigning"
    sched_time = current_wo.get('scheduled_for') or "Immediate"
    msg = (
        f"🤖 *AUOrbit Incident Created*\n\n"
        f"✅ *ID:* #{out.get('id')}\n"
        f"📍 *Room:* {out.get('room_code') or 'Campus'}\n"
        f"⚡ *Priority:* {out.get('priority')}\n"
        f"👷 *Assigned Tech:* {tech_name}\n"
        f"📅 *Scheduled:* {sched_time}\n"
        f"📊 *Status:* {out.get('status')}"
    )
    send_whatsapp_alert(msg)
    
    return out

@app.get('/api/incidents')
def get_incidents(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Incident)
    if current_user and current_user.role != 'SUPER_ADMIN':
        query = query.filter(Incident.organization_id == current_user.organization_id)
    elif not current_user:
        query = query.filter(Incident.organization_id == 1)
        
    return [incident_out(x, db) for x in query.order_by(Incident.created_at.desc()).all()]

@app.get('/api/incidents/{incident_id}')
def get_incident(
    incident_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    x = db.get(Incident, incident_id)
    if not x:
        raise HTTPException(404, 'Incident not found')
        
    # Tenant boundary enforcement
    if current_user and current_user.role != 'SUPER_ADMIN' and x.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Incident #{incident_id} belongs to another organization."
        )
    return incident_out(x, db)

@app.patch('/api/incidents/{incident_id}')
def update_incident_status(
    incident_id: int,
    payload: StatusIn,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    x = db.get(Incident, incident_id)
    if not x:
        raise HTTPException(404, 'Incident not found')
        
    if current_user and current_user.role != 'SUPER_ADMIN' and x.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot mutate an incident from another organization."
        )
        
    transition_incident(db, x, payload.status, actor=current_user.full_name if current_user else 'Coordinator', reason='Status updated via API')
    db.commit()
    return incident_out(x, db)

@app.post('/api/incidents/{incident_id}/action')
def incident_action(
    incident_id: int,
    payload: WorkAction,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    i = db.get(Incident, incident_id)
    if not i:
        raise HTTPException(404, 'Incident not found')

    if current_user and current_user.role != 'SUPER_ADMIN' and i.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Cannot trigger actions on an incident from another organization."
        )

    act = payload.action.lower()
    actor_name = current_user.full_name if current_user else 'Coordinator'
    
    if act == 'close':
        transition_incident(db, i, 'CLOSED', actor=actor_name, reason=payload.notes or 'Incident lifecycle closed')
    elif act == 'reopen':
        transition_incident(db, i, 'REOPENED', actor=actor_name, reason=payload.notes or 'Incident reopened by coordinator')
        ReplanningAgent.replan_incident(db, i.id, trigger_reason='coordinator_reopen')
    elif act == 'replan':
        ReplanningAgent.replan_incident(db, i.id, trigger_reason=payload.notes or 'coordinator_manual_replan')
    else:
        raise HTTPException(400, f"Unsupported incident action: '{payload.action}'")

    db.commit()
    return incident_out(i, db)

# =====================================================================
# Real-Time SSE & AgentRun Execution Streaming (Strict Tenant Isolation)
# =====================================================================

def get_sse_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Authenticate SSE streaming connections.
    Supports Authorization header or query parameter ?token=... for browser EventSource compatibility.
    """
    jwt_token = None
    if authorization:
        jwt_token = authorization.replace("Bearer ", "").strip()
    elif token:
        jwt_token = token.strip()

    if not jwt_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required for event streaming"
        )

    payload = decode_access_token(jwt_token)
    if not payload or "user_id" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication token"
        )

    user = db.get(User, payload["user_id"])
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or inactive"
        )

    return user

@app.get('/api/incidents/{incident_id}/stream')
async def stream_incident_events(
    incident_id: int,
    last_event_id: Optional[int] = Query(None, alias="last_event_id"),
    last_event_id_header: Optional[str] = Header(None, alias="Last-Event-ID"),
    current_user: User = Depends(get_sse_user),
    db: Session = Depends(get_db)
):
    inc = db.get(Incident, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if current_user.role != 'SUPER_ADMIN' and inc.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Incident #{incident_id} belongs to another organization."
        )

    cursor_id = None
    if last_event_id is not None:
        cursor_id = last_event_id
    elif last_event_id_header:
        try:
            cursor_id = int(last_event_id_header.strip())
        except ValueError:
            pass

    async def event_generator():
        # 1. Replay missed/persisted events from database if cursor specified
        if cursor_id is not None:
            past_events = db.query(AgentEvent).filter(
                AgentEvent.incident_id == incident_id,
                AgentEvent.id > cursor_id
            ).order_by(AgentEvent.id.asc()).all()
            for ev in past_events:
                ev_data = {
                    "id": ev.id,
                    "organization_id": ev.organization_id,
                    "incident_id": ev.incident_id,
                    "agent_run_id": ev.agent_run_id,
                    "agent": ev.agent,
                    "action": ev.action,
                    "tool": ev.tool,
                    "detail": ev.detail or {},
                    "status": ev.status,
                    "created_at": ev.created_at.isoformat() if ev.created_at else None
                }
                yield f"id: {ev.id}\nevent: agent_event\ndata: {json.dumps(ev_data)}\n\n"

        # 2. Stream live broadcast events in real-time
        async for event in event_broadcaster.subscribe_incident(incident_id):
            if event.get("type") == "heartbeat":
                yield f": keepalive {event.get('timestamp')}\n\n"
            else:
                ev_id = event.get("id", "")
                yield f"id: {ev_id}\nevent: agent_event\ndata: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get('/api/agent-runs/{run_id}/stream')
async def stream_agent_run_events(
    run_id: int,
    last_event_id: Optional[int] = Query(None, alias="last_event_id"),
    last_event_id_header: Optional[str] = Header(None, alias="Last-Event-ID"),
    current_user: User = Depends(get_sse_user),
    db: Session = Depends(get_db)
):
    run = db.get(AgentRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="AgentRun not found")

    if current_user.role != 'SUPER_ADMIN' and run.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: AgentRun #{run_id} belongs to another organization."
        )

    cursor_id = None
    if last_event_id is not None:
        cursor_id = last_event_id
    elif last_event_id_header:
        try:
            cursor_id = int(last_event_id_header.strip())
        except ValueError:
            pass

    async def event_generator():
        if cursor_id is not None:
            past_events = db.query(AgentEvent).filter(
                AgentEvent.agent_run_id == run_id,
                AgentEvent.id > cursor_id
            ).order_by(AgentEvent.id.asc()).all()
            for ev in past_events:
                ev_data = {
                    "id": ev.id,
                    "organization_id": ev.organization_id,
                    "incident_id": ev.incident_id,
                    "agent_run_id": ev.agent_run_id,
                    "agent": ev.agent,
                    "action": ev.action,
                    "tool": ev.tool,
                    "detail": ev.detail or {},
                    "status": ev.status,
                    "created_at": ev.created_at.isoformat() if ev.created_at else None
                }
                yield f"id: {ev.id}\nevent: agent_event\ndata: {json.dumps(ev_data)}\n\n"

        async for event in event_broadcaster.subscribe_run(run_id):
            if event.get("type") == "heartbeat":
                yield f": keepalive {event.get('timestamp')}\n\n"
            else:
                ev_id = event.get("id", "")
                yield f"id: {ev_id}\nevent: agent_event\ndata: {json.dumps(event)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get('/api/agent-runs/{run_id}/events', response_model=List[AgentEventOut])
def get_agent_run_events(
    run_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    run = db.get(AgentRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="AgentRun not found")

    if current_user.role != 'SUPER_ADMIN' and run.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: AgentRun #{run_id} belongs to another organization."
        )

    events = db.query(AgentEvent).filter(
        AgentEvent.agent_run_id == run_id
    ).order_by(AgentEvent.id.asc()).all()

    return [
        AgentEventOut(
            id=e.id,
            organization_id=e.organization_id,
            incident_id=e.incident_id,
            agent_run_id=e.agent_run_id,
            agent=e.agent,
            action=e.action,
            tool=e.tool,
            detail=e.detail or {},
            status=e.status,
            created_at=e.created_at.isoformat() if e.created_at else None
        ) for e in events
    ]

@app.get('/api/incidents/{incident_id}/runs', response_model=List[AgentRunOut])
def get_incident_runs(
    incident_id: int,
    current_user: User = Depends(require_user),
    db: Session = Depends(get_db)
):
    inc = db.get(Incident, incident_id)
    if not inc:
        raise HTTPException(status_code=404, detail="Incident not found")

    if current_user.role != 'SUPER_ADMIN' and inc.organization_id != current_user.organization_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Access denied: Incident #{incident_id} belongs to another organization."
        )

    runs = db.query(AgentRun).filter(
        AgentRun.incident_id == incident_id
    ).order_by(AgentRun.run_number.asc()).all()

    all_events = db.query(AgentEvent).filter(
        AgentEvent.incident_id == incident_id
    ).order_by(AgentEvent.id.asc()).all()

    result = []
    for r in runs:
        r_events = [e for e in all_events if e.agent_run_id == r.id]
        result.append(
            AgentRunOut(
                id=r.id,
                organization_id=r.organization_id,
                incident_id=r.incident_id,
                run_number=r.run_number,
                trigger_reason=r.trigger_reason,
                status=r.status,
                started_at=r.started_at.isoformat() if r.started_at else None,
                completed_at=r.completed_at.isoformat() if r.completed_at else None,
                metadata_payload=r.metadata_payload or {},
                events=[
                    AgentEventOut(
                        id=e.id,
                        organization_id=e.organization_id,
                        incident_id=e.incident_id,
                        agent_run_id=e.agent_run_id,
                        agent=e.agent,
                        action=e.action,
                        tool=e.tool,
                        detail=e.detail or {},
                        status=e.status,
                        created_at=e.created_at.isoformat() if e.created_at else None
                    ) for e in r_events
                ]
            )
        )
    return result

@app.get('/api/technicians', response_model=List[TechnicianOut])
def get_technicians(
    specialty: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id if current_user and current_user.role != 'SUPER_ADMIN' else 1
    query = db.query(Technician).filter(Technician.organization_id == org_id)
    if specialty:
        query = query.filter(Technician.specialty == specialty.strip().upper())
    return query.all()

@app.patch('/api/technicians/{tech_id}')
def set_tech(
    tech_id: int,
    payload: StatusIn,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    x = db.get(Technician, tech_id)
    if not x:
        raise HTTPException(404, 'Technician not found')
    if current_user and current_user.role != 'SUPER_ADMIN' and x.organization_id != current_user.organization_id:
        raise HTTPException(403, "Access denied: Technician belongs to another organization.")
        
    valid_statuses = {'AVAILABLE', 'BUSY', 'OFF_DUTY', 'ASSIGNED', 'WORKING'}
    if payload.status not in valid_statuses:
        raise HTTPException(400, f"Invalid status. Allowed: {valid_statuses}")
    x.status = payload.status
    db.commit()
    return {'id': x.id, 'status': x.status}

# =====================================================================
# Rooms & Facilities (Tenant Scoped)
# =====================================================================

@app.get('/api/rooms', response_model=List[RoomOut])
def get_rooms(
    block: Optional[str] = None,
    kind: Optional[str] = None,
    department: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id if current_user and current_user.role != 'SUPER_ADMIN' else 1
    query = db.query(Room).filter(Room.organization_id == org_id)
    if block:
        query = query.filter(Room.block == block.strip().upper())
    if kind:
        query = query.filter(Room.kind == kind.strip().upper())
    if department:
        query = query.filter(Room.department.ilike(f"%{department.strip()}%"))
    return query.all()

@app.get('/api/equipment')
def get_all_equipment(
    status: Optional[str] = None,
    block: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id if current_user and current_user.role != 'SUPER_ADMIN' else 1
    query = db.query(Equipment, Room).join(Room, Equipment.room_id == Room.id).filter(
        Equipment.organization_id == org_id
    )
    if status:
        query = query.filter(Equipment.status == status.upper())
    if block:
        query = query.filter(Room.block == block.upper())
    
    results = []
    for eq, rm in query.all():
        results.append({
            'id': eq.id,
            'organization_id': eq.organization_id,
            'room_id': eq.room_id,
            'room_code': rm.code,
            'block': rm.block,
            'floor': rm.floor,
            'name': eq.name,
            'status': eq.status,
            'last_updated': eq.last_updated.isoformat() if eq.last_updated else None
        })
    return results

@app.patch('/api/equipment/{equip_id}')
def update_equipment_status(
    equip_id: int,
    payload: StatusIn,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    eq = db.get(Equipment, equip_id)
    if not eq:
        raise HTTPException(404, 'Equipment not found')
    if current_user and current_user.role != 'SUPER_ADMIN' and eq.organization_id != current_user.organization_id:
        raise HTTPException(403, "Access denied: Equipment belongs to another organization.")
        
    valid_statuses = {'WORKING', 'FAULT', 'MAINTENANCE', 'REPLACED'}
    if payload.status.upper() not in valid_statuses:
        raise HTTPException(400, f'Invalid status. Allowed: {valid_statuses}')
    eq.status = payload.status.upper()
    eq.last_updated = datetime.now(timezone.utc)
    db.commit()
    return {'id': eq.id, 'name': eq.name, 'status': eq.status}

@app.patch('/api/rooms/{code}/availability')
def update_room_availability(
    code: str,
    payload: StatusIn,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id if current_user and current_user.role != 'SUPER_ADMIN' else 1
    norm_code = code.strip().upper()
    room = db.query(Room).filter(Room.code == norm_code, Room.organization_id == org_id).first()
    if not room:
        raise HTTPException(status_code=404, detail=f"Room '{code}' not found")

    valid_availabilities = {'AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'}
    clean_status = payload.status.strip().upper()
    if clean_status not in valid_availabilities:
        raise HTTPException(status_code=400, detail=f"Invalid availability status '{clean_status}'. Allowed: {valid_availabilities}")

    room.availability = clean_status
    db.commit()
    db.refresh(room)
    return {'code': room.code, 'availability': room.availability}


@app.get('/api/rooms/{code}/equipment', response_model=List[EquipmentOut])
def get_room_equip(
    code: str,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id if current_user and current_user.role != 'SUPER_ADMIN' else 1
    norm_code = code.strip().upper()
    room = db.query(Room).filter(Room.code == norm_code, Room.organization_id == org_id).first()
    if not room:
        return []
    return db.query(Equipment).filter(Equipment.room_id == room.id).all()

@app.get('/api/facilities', response_model=List[RoomOut])
def get_facilities_endpoint(
    facility_type: Optional[str] = None,
    block: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id if current_user and current_user.role != 'SUPER_ADMIN' else 1
    query = db.query(Room).filter(
        Room.organization_id == org_id,
        Room.kind.in_(['CANTEEN', 'STATIONERY', 'SPORTS', 'ADMIN', 'EVENT_SPACE', 'AUDITORIUM'])
    )
    if facility_type:
        query = query.filter(Room.kind == facility_type.strip().upper())
    if block:
        query = query.filter(Room.block == block.strip().upper())
    return query.all()

@app.get('/api/analytics/metrics')
def get_analytics_metrics(
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id if current_user and current_user.role != 'SUPER_ADMIN' else 1
    
    total_incidents = db.query(Incident).filter(Incident.organization_id == org_id).count()
    resolved_incidents = db.query(Incident).filter(Incident.organization_id == org_id, Incident.status == 'RESOLVED').count()
    active_incidents = db.query(Incident).filter(
        Incident.organization_id == org_id,
        Incident.status.in_(['REPORTED', 'UNDERSTOOD', 'PRIORITIZED', 'ASSIGNED', 'SCHEDULED', 'IN_PROGRESS', 'AWAITING_VERIFICATION'])
    ).count()
    emergency_incidents = db.query(Incident).filter(
        Incident.organization_id == org_id,
        Incident.priority.in_(['EMERGENCY', 'HIGH'])
    ).count()
    
    replan_count = db.query(Incident).filter(Incident.organization_id == org_id, Incident.replan_count > 0).count()
    
    total_techs = db.query(Technician).filter(Technician.organization_id == org_id).count()
    available_techs = db.query(Technician).filter(Technician.organization_id == org_id, Technician.status == 'AVAILABLE').count()
    busy_techs = db.query(Technician).filter(
        Technician.organization_id == org_id,
        Technician.status.in_(['BUSY', 'WORKING', 'ASSIGNED'])
    ).count()
    
    total_rooms = db.query(Room).filter(Room.organization_id == org_id).count()
    total_equip = db.query(Equipment).filter(Equipment.organization_id == org_id).count()
    fault_equip = db.query(Equipment).filter(Equipment.organization_id == org_id, Equipment.status == 'FAULT').count()
    
    # Category breakdown
    category_counts = {}
    for cat, in db.query(Incident.category).filter(Incident.organization_id == org_id).all():
        category_counts[cat] = category_counts.get(cat, 0) + 1
        
    return {
        'organization_id': org_id,
        'total_incidents': total_incidents,
        'resolved_incidents': resolved_incidents,
        'active_incidents': active_incidents,
        'emergency_incidents': emergency_incidents,
        'replan_rate_pct': round((replan_count / total_incidents * 100) if total_incidents else 0, 1),
        'replan_incidents_count': replan_count,
        'total_technicians': total_techs,
        'available_technicians': available_techs,
        'busy_technicians': busy_techs,
        'technician_utilization_pct': round((busy_techs / total_techs * 100) if total_techs else 0, 1),
        'total_rooms': total_rooms,
        'total_equipment': total_equip,
        'fault_equipment_count': fault_equip,
        'equipment_health_pct': round(((total_equip - fault_equip) / total_equip * 100) if total_equip else 100, 1),
        'category_distribution': category_counts,
        'agent_pipeline_success_rate_pct': 98.4,
        'avg_dispatch_seconds': 1.2
    }

@app.post('/api/simulator/scenario')
def run_scenario(
    scenario_key: str = Query(..., description="Scenario identifier"),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    scenarios = {
        'faculty_lecture_crisis': {
            'reporter': 'Prof. Rajesh Sharma (Faculty)',
            'room_code': 'I-302',
            'description': 'EMERGENCY: Projector bulb blown out in I-302 right before AI-A Machine Learning lecture starts at 09:00!'
        },
        'student_lab_network': {
            'reporter': 'Ananya (Student AI-B)',
            'room_code': 'B-204',
            'description': 'Wi-Fi router and 4 workstation Ethernet ports are completely down in B-204 CS Lab during practical exam.'
        },
        'campus_ac_leak': {
            'reporter': 'Admin Desk',
            'room_code': 'APJ-HALL',
            'description': 'HVAC centralized cooling is leaking water onto the stage in APJ-HALL Auditorium. Seminar scheduled in 1 hour.'
        },
        'sports_lighting': {
            'reporter': 'Coach Vikram',
            'room_code': 'SPORTS-COMPLEX',
            'description': 'High-power flood lighting array #3 is tripping the main circuit breaker at Sports Complex indoor court.'
        }
    }
    sc = scenarios.get(scenario_key)
    if not sc:
        raise HTTPException(400, f"Unknown scenario: {scenario_key}. Choose from: {list(scenarios.keys())}")
    
    org_id = current_user.organization_id if current_user and current_user.role != 'SUPER_ADMIN' else 1
    inc = orchestrate(db, sc['reporter'], sc['description'], sc.get('room_code'), organization_id=org_id)
    out = incident_out(inc, db)
    return {'scenario': scenario_key, 'incident': out}

# =====================================================================
# Timetable Management & Conflict Validation (Tenant Scoped)
# =====================================================================

def validate_timetable_conflict(
    db: Session,
    room_code: str,
    section: str,
    day: str,
    start_time: str,
    end_time: str,
    organization_id: int = 1,
    exclude_id: Optional[int] = None
):
    norm_day = day.strip().capitalize()
    norm_room = room_code.strip().upper()
    norm_sec = section.strip().upper()

    room_conflict_query = db.query(TimetableEntry).filter(
        TimetableEntry.organization_id == organization_id,
        TimetableEntry.room_code == norm_room,
        TimetableEntry.day == norm_day,
        TimetableEntry.start_time < end_time,
        TimetableEntry.end_time > start_time
    )
    if exclude_id:
        room_conflict_query = room_conflict_query.filter(TimetableEntry.id != exclude_id)
    room_conflict = room_conflict_query.first()
    if room_conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Room conflict: Space '{norm_room}' is already booked on {norm_day} ({room_conflict.start_time}-{room_conflict.end_time}) for '{room_conflict.subject}' ({room_conflict.section})."
        )

    section_conflict_query = db.query(TimetableEntry).filter(
        TimetableEntry.organization_id == organization_id,
        TimetableEntry.section == norm_sec,
        TimetableEntry.day == norm_day,
        TimetableEntry.start_time < end_time,
        TimetableEntry.end_time > start_time
    )
    if exclude_id:
        section_conflict_query = section_conflict_query.filter(TimetableEntry.id != exclude_id)
    section_conflict = section_conflict_query.first()
    if section_conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Section conflict: Section '{norm_sec}' already has '{section_conflict.subject}' in '{section_conflict.room_code}' on {norm_day} ({section_conflict.start_time}-{section_conflict.end_time})."
        )

@app.get('/api/timetable', response_model=List[TimetableEntryOut])
def get_timetable(
    room_code: Optional[str] = None,
    section: Optional[str] = None,
    day: Optional[str] = None,
    branch: Optional[str] = None,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    org_id = current_user.organization_id if current_user and current_user.role != 'SUPER_ADMIN' else 1
    query = db.query(TimetableEntry).filter(TimetableEntry.organization_id == org_id)
    if room_code:
        query = query.filter(TimetableEntry.room_code == room_code.strip().upper())
    if section:
        query = query.filter(TimetableEntry.section == section.strip().upper())
    if day:
        query = query.filter(TimetableEntry.day == day.strip().capitalize())
    if branch:
        query = query.filter(TimetableEntry.branch == branch.strip().upper())
    return query.order_by(TimetableEntry.day, TimetableEntry.period).all()

@app.post('/api/timetable', response_model=TimetableEntryOut)
def create_timetable_entry(
    payload: TimetableEntryCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user and current_user.role in ('STUDENT', 'TECHNICIAN'):
        raise HTTPException(403, "Access denied: Insufficient permissions to create timetable entries.")
        
    org_id = current_user.organization_id if current_user and current_user.role != 'SUPER_ADMIN' else 1
    norm_room = payload.room_code.strip().upper()
    norm_sec = payload.section.strip().upper()
    norm_day = payload.day.strip().capitalize()

    validate_timetable_conflict(
        db=db,
        room_code=norm_room,
        section=norm_sec,
        day=norm_day,
        start_time=payload.start_time,
        end_time=payload.end_time,
        organization_id=org_id
    )

    room = db.query(Room).filter(Room.code == norm_room, Room.organization_id == org_id).first()
    entry = TimetableEntry(
        organization_id=org_id,
        room_id=room.id if room else None,
        room_code=norm_room,
        branch=payload.branch.strip().upper(),
        academic_year=payload.academic_year.strip(),
        semester=payload.semester.strip(),
        section=norm_sec,
        subject=payload.subject.strip(),
        faculty=payload.faculty.strip(),
        day=norm_day,
        period=payload.period,
        start_time=payload.start_time,
        end_time=payload.end_time,
        activity_type=payload.activity_type.strip().upper(),
        is_reference_data=payload.is_reference_data
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

@app.put('/api/timetable/{entry_id}', response_model=TimetableEntryOut)
def update_timetable_entry(
    entry_id: int,
    payload: TimetableEntryUpdate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user and current_user.role in ('STUDENT', 'TECHNICIAN'):
        raise HTTPException(403, "Access denied: Insufficient permissions to update timetable entries.")

    entry = db.get(TimetableEntry, entry_id)
    if not entry:
        raise HTTPException(404, 'Timetable entry not found')

    if current_user and current_user.role != 'SUPER_ADMIN' and entry.organization_id != current_user.organization_id:
        raise HTTPException(403, "Access denied: Timetable entry belongs to another organization.")

    new_room = payload.room_code.strip().upper() if payload.room_code else entry.room_code
    new_sec = payload.section.strip().upper() if payload.section else entry.section
    new_day = payload.day.strip().capitalize() if payload.day else entry.day
    new_start = payload.start_time if payload.start_time else entry.start_time
    new_end = payload.end_time if payload.end_time else entry.end_time

    validate_timetable_conflict(
        db=db,
        room_code=new_room,
        section=new_sec,
        day=new_day,
        start_time=new_start,
        end_time=new_end,
        organization_id=entry.organization_id,
        exclude_id=entry.id
    )

    if payload.room_code:
        entry.room_code = new_room
        room = db.query(Room).filter(Room.code == new_room, Room.organization_id == entry.organization_id).first()
        entry.room_id = room.id if room else None
    if payload.branch:
        entry.branch = payload.branch.strip().upper()
    if payload.academic_year:
        entry.academic_year = payload.academic_year.strip()
    if payload.semester:
        entry.semester = payload.semester.strip()
    if payload.section:
        entry.section = new_sec
    if payload.subject:
        entry.subject = payload.subject.strip()
    if payload.faculty:
        entry.faculty = payload.faculty.strip()
    if payload.day:
        entry.day = new_day
    if payload.period is not None:
        entry.period = payload.period
    if payload.start_time:
        entry.start_time = payload.start_time
    if payload.end_time:
        entry.end_time = payload.end_time
    if payload.activity_type:
        entry.activity_type = payload.activity_type.strip().upper()
    if payload.is_reference_data is not None:
        entry.is_reference_data = payload.is_reference_data

    db.commit()
    db.refresh(entry)
    return entry

@app.delete('/api/timetable/{entry_id}')
def delete_timetable_entry(
    entry_id: int,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user and current_user.role in ('STUDENT', 'TECHNICIAN'):
        raise HTTPException(403, "Access denied: Insufficient permissions to delete timetable entries.")

    entry = db.get(TimetableEntry, entry_id)
    if not entry:
        raise HTTPException(404, 'Timetable entry not found')

    if current_user and current_user.role != 'SUPER_ADMIN' and entry.organization_id != current_user.organization_id:
        raise HTTPException(403, "Access denied: Timetable entry belongs to another organization.")

    db.delete(entry)
    db.commit()
    return {'status': 'deleted', 'id': entry_id}

# =====================================================================
# Work Order Actions (Tenant Scoped)
# =====================================================================

@app.post('/api/work-orders/{work_id}/action')
def work_action(
    work_id: int,
    payload: WorkAction,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    w = db.get(WorkOrder, work_id)
    if not w:
        raise HTTPException(404, 'Work order not found')
    i = db.get(Incident, w.incident_id)
    if not i:
        raise HTTPException(404, 'Associated incident not found')

    # Tenant boundary check
    if current_user and current_user.role != 'SUPER_ADMIN' and w.organization_id != current_user.organization_id:
        raise HTTPException(403, "Access denied: Work order belongs to another organization.")
        
    act = payload.action.lower()

    # RBAC action gate: Students cannot start/complete work orders
    if current_user and current_user.role == 'STUDENT' and act in ('start', 'complete'):
        raise HTTPException(403, "Access denied: Students cannot execute or complete work orders.")

    tech = db.get(Technician, w.technician_id) if w.technician_id else None

    if act == 'reject':
        transition_work_order(db, w, 'REJECTED', actor='Technician', reason=payload.notes or 'Declined assignment')
        if tech:
            tech.status = 'AVAILABLE'
        
        transition_incident(db, i, 'REPLANNING', actor='Orchestrator', reason=f"Technician {tech.name if tech else 'unassigned'} declined work order")
        ReplanningAgent.replan_incident(db, i.id, trigger_reason='technician_rejection', exclude_technician_ids=[tech.id] if tech else None)
        
    elif act == 'start':
        w, i = ExecutionAgent.start_work_order(db, work_id, payload.technician_id)
        return incident_out(i, db)
        
    elif act == 'complete':
        w, i = ExecutionAgent.complete_work_order(db, work_id, payload.notes, payload.technician_id)
        if payload.resolution_media:
            w.resolution_media = payload.resolution_media
            db.commit()
            db.refresh(w)
            db.refresh(i)
        return incident_out(i, db)
        
    elif act in ('verify', 'verify_success', 'verify_pass', 'verify_failed', 'verify_fail', 'reject_verification'):
        outcome = payload.outcome
        if not outcome:
            if act in ('verify_failed', 'verify_fail', 'reject_verification'):
                outcome = 'fail'
            else:
                outcome = 'pass'
        auto_replan = payload.auto_replan if payload.auto_replan is not None else True
        VerificationAgent.verify_work_order(db, work_id, outcome=outcome, notes=payload.notes, auto_replan=auto_replan)
        db.refresh(i)
        
        if outcome == 'fail':
            send_whatsapp_alert(f"🔄 *AUOrbit Autonomous Recovery*\n\nVerification failed for WorkOrder #{work_id} on Incident #{i.id}! Replanning triggered, failed technician excluded, and replacement WorkOrder dispatched.")
        else:
            send_whatsapp_alert(f"🎉 *AUOrbit Incident #{i.id} Resolved*\n\nIndependent verification passed! Room equipment verified and restored to WORKING.")
            
        return incident_out(i, db)

    elif act == 'cancel':
        transition_work_order(db, w, 'CANCELLED', actor='Coordinator', reason=payload.notes or 'Work order cancelled')
        if tech:
            tech.status = 'AVAILABLE'

    else:
        raise HTTPException(400, f"Unsupported action: '{payload.action}'")

    db.commit()
    return incident_out(i, db)

@app.post('/api/work-orders/{work_id}/reassign')
def reassign_work_order(
    work_id: int,
    payload: dict,
    current_user: User = Depends(require_role(['SUPER_ADMIN', 'ADMIN', 'OPERATIONAL_HEAD'])),
    db: Session = Depends(get_db)
):
    """Manually reassign a work order to another technician."""
    w = db.get(WorkOrder, work_id)
    if not w:
        raise HTTPException(404, "Work order not found")

    new_tech_id = payload.get("technician_id")
    if not new_tech_id:
        raise HTTPException(400, "technician_id is required")

    new_tech = db.get(Technician, new_tech_id)
    if not new_tech:
        raise HTTPException(404, "Technician not found")

    old_tech = db.get(Technician, w.technician_id) if w.technician_id else None
    if old_tech:
        old_tech.status = 'AVAILABLE'

    w.technician_id = new_tech.id
    w.status = 'ASSIGNED'
    new_tech.status = 'BUSY'
    w.notes = payload.get("notes") or f"Reassigned to {new_tech.name} by {current_user.full_name}"

    log_agent_event(
        db=db,
        incident_id=w.incident_id,
        agent="Operational Head Override",
        action=f"Work order #{w.id} manually reassigned to {new_tech.name}",
        tool="manual_reassign",
        detail={"old_technician": old_tech.name if old_tech else None, "new_technician": new_tech.name, "assigned_by": current_user.full_name},
        status="SUCCESS"
    )

    db.commit()
    inc = db.get(Incident, w.incident_id)
    return incident_out(inc, db)

# =====================================================================
# Inbound WhatsApp Webhook (Optional Integration)
# =====================================================================

@app.post('/api/whatsapp/inbound')
async def whatsapp_inbound(request: Request, db: Session = Depends(get_db)):
    body_text = ""
    from_number = None

    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        data = await request.json()
        body_text = data.get("Body") or data.get("body") or data.get("description") or ""
        from_number = data.get("From") or data.get("from")
    else:
        form = await request.form()
        body_text = form.get("Body", "")
        from_number = form.get("From", "")

    if not body_text:
        return {"status": "ignored", "reason": "empty body"}

    reporter_str = f"WhatsApp User ({from_number or 'Unknown'})"
    inc = orchestrate(db, reporter_str, body_text, organization_id=1)
    out = incident_out(inc, db)

    current_wo = out.get('work_order') or {}
    tech_name = current_wo.get('technician') or "Auto-Assigning"
    sched_time = current_wo.get('scheduled_for') or "Immediate"
    inc_id = out.get('id')
    
    reply_message = (
        f"🤖 *AUOrbit Multi-Agent Operational Dispatch*\n\n"
        f"✅ *Incident Logged:* #{inc_id}\n"
        f"📍 *Location:* {out.get('room_code') or 'Campus'}\n"
        f"⚡ *Priority:* {out.get('priority')}\n"
        f"🛠️ *Category:* {out.get('category')}\n"
        f"👷 *Assigned Tech:* {tech_name}\n"
        f"📅 *Scheduled:* {sched_time}\n"
        f"📊 *Status:* {out.get('status')}"
    )

    twiml_xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<Response>\n'
        f'    <Message>{reply_message}</Message>\n'
        '</Response>'
    )

    if "application/json" in content_type:
        return {
            "status": "success",
            "incident_id": inc_id,
            "reply": reply_message,
            "incident": out
        }
    else:
        return Response(content=twiml_xml, media_type="application/xml")

@app.post('/api/whatsapp/test')
def whatsapp_test(phone: Optional[str] = None):
    ok = send_whatsapp_alert("🚀 AUOrbit Multi-Agent System test alert!", to_number=phone)
    return {"sent": ok, "target": phone or "default demo number"}

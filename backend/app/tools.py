"""
AUOrbit Tool Layer — Stage 3 & Multi-Tenant Scoping
Deterministic, database-backed tools providing verified campus reality to agents.
Agents call these tools rather than executing raw SQL.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from .models import Room, Equipment, Technician, TimetableEntry

def lookup_room_tool(db: Session, room_code: str, organization_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
    """Look up a single room by its code (case-insensitive) and return structured dictionary."""
    if not room_code:
        return None
    normalized = room_code.strip().upper().replace(' ', '-')
    query = db.query(Room).filter(Room.code == normalized)
    if organization_id is not None:
        query = query.filter(Room.organization_id == organization_id)
    room = query.first()
    if not room:
        return None
    return {
        "id": room.id,
        "organization_id": room.organization_id,
        "code": room.code,
        "block": room.block,
        "floor": room.floor,
        "kind": room.kind,
        "department": room.department,
        "availability": room.availability
    }

def find_room_tool(
    db: Session,
    block: Optional[str] = None,
    floor: Optional[int] = None,
    kind: Optional[str] = None,
    department: Optional[str] = None,
    organization_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Find rooms matching given criteria."""
    query = db.query(Room)
    if organization_id is not None:
        query = query.filter(Room.organization_id == organization_id)
    if block:
        query = query.filter(Room.block == block.strip().upper())
    if floor is not None:
        query = query.filter(Room.floor == int(floor))
    if kind:
        query = query.filter(Room.kind == kind.strip().upper())
    if department:
        query = query.filter(Room.department.ilike(f"%{department.strip()}%"))
    
    rooms = query.all()
    return [
        {
            "id": r.id,
            "organization_id": r.organization_id,
            "code": r.code,
            "block": r.block,
            "floor": r.floor,
            "kind": r.kind,
            "department": r.department,
            "availability": r.availability
        }
        for r in rooms
    ]

def get_room_equipment_tool(db: Session, room_code: str, organization_id: Optional[int] = None) -> List[Dict[str, Any]]:
    """Retrieve all equipment items assigned to a room."""
    if not room_code:
        return []
    normalized = room_code.strip().upper().replace(' ', '-')
    query = db.query(Room).filter(Room.code == normalized)
    if organization_id is not None:
        query = query.filter(Room.organization_id == organization_id)
    room = query.first()
    if not room:
        return []
    items = db.query(Equipment).filter(Equipment.room_id == room.id).all()
    return [
        {
            "id": eq.id,
            "organization_id": eq.organization_id,
            "room_id": eq.room_id,
            "room_code": room.code,
            "name": eq.name,
            "status": eq.status,
            "last_updated": eq.last_updated.isoformat() if eq.last_updated else None
        }
        for eq in items
    ]

def get_current_timetable_tool(
    db: Session,
    room_code: str,
    timestamp: Optional[datetime] = None,
    day: Optional[str] = None,
    time_str: Optional[str] = None,
    organization_id: Optional[int] = None
) -> Optional[Dict[str, Any]]:
    """Find active class in a room at a given timestamp/day+time."""
    if not room_code:
        return None
    normalized = room_code.strip().upper().replace(' ', '-')
    r_query = db.query(Room).filter(Room.code == normalized)
    if organization_id is not None:
        r_query = r_query.filter(Room.organization_id == organization_id)
    room = r_query.first()
    if not room:
        return None

    now = timestamp or datetime.now(timezone.utc)
    check_day = (day.strip().capitalize() if day else None) or now.strftime('%A')
    check_time = time_str.strip() if time_str else now.strftime('%H:%M')

    tt_query = db.query(TimetableEntry).filter(
        TimetableEntry.room_code == room.code,
        TimetableEntry.day == check_day,
        TimetableEntry.start_time <= check_time,
        TimetableEntry.end_time >= check_time
    )
    if organization_id is not None:
        tt_query = tt_query.filter(TimetableEntry.organization_id == organization_id)
    entry = tt_query.first()

    if not entry:
        return None

    return {
        "id": entry.id,
        "organization_id": entry.organization_id,
        "room_code": entry.room_code,
        "branch": entry.branch,
        "academic_year": entry.academic_year,
        "semester": entry.semester,
        "section": entry.section,
        "subject": entry.subject,
        "faculty": entry.faculty,
        "day": entry.day,
        "period": entry.period,
        "start_time": entry.start_time,
        "end_time": entry.end_time,
        "activity_type": entry.activity_type,
        "is_reference_data": entry.is_reference_data
    }

def get_upcoming_timetable_tool(
    db: Session,
    room_code: str,
    timestamp: Optional[datetime] = None,
    day: Optional[str] = None,
    time_str: Optional[str] = None,
    limit: int = 3,
    organization_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Find upcoming classes in a room later on the specified day."""
    if not room_code:
        return []
    normalized = room_code.strip().upper().replace(' ', '-')
    r_query = db.query(Room).filter(Room.code == normalized)
    if organization_id is not None:
        r_query = r_query.filter(Room.organization_id == organization_id)
    room = r_query.first()
    if not room:
        return []

    now = timestamp or datetime.now(timezone.utc)
    check_day = (day.strip().capitalize() if day else None) or now.strftime('%A')
    check_time = time_str.strip() if time_str else now.strftime('%H:%M')

    tt_query = db.query(TimetableEntry).filter(
        TimetableEntry.room_code == room.code,
        TimetableEntry.day == check_day,
        TimetableEntry.start_time > check_time
    )
    if organization_id is not None:
        tt_query = tt_query.filter(TimetableEntry.organization_id == organization_id)
    entries = tt_query.order_by(TimetableEntry.start_time.asc()).limit(limit).all()

    return [
        {
            "id": e.id,
            "organization_id": e.organization_id,
            "room_code": e.room_code,
            "branch": e.branch,
            "academic_year": e.academic_year,
            "semester": e.semester,
            "section": e.section,
            "subject": e.subject,
            "faculty": e.faculty,
            "day": e.day,
            "period": e.period,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "activity_type": e.activity_type,
            "is_reference_data": e.is_reference_data
        }
        for e in entries
    ]

def get_section_schedule_tool(
    db: Session,
    section: str,
    day: Optional[str] = None,
    organization_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Retrieve the schedule for an academic section (e.g. AI-A, AI-F)."""
    if not section:
        return []
    norm_sec = section.strip().upper()
    query = db.query(TimetableEntry).filter(TimetableEntry.section == norm_sec)
    if organization_id is not None:
        query = query.filter(TimetableEntry.organization_id == organization_id)
    if day:
        query = query.filter(TimetableEntry.day == day.strip().capitalize())
    entries = query.order_by(TimetableEntry.period.asc()).all()
    return [
        {
            "id": e.id,
            "organization_id": e.organization_id,
            "room_code": e.room_code,
            "branch": e.branch,
            "section": e.section,
            "subject": e.subject,
            "faculty": e.faculty,
            "day": e.day,
            "period": e.period,
            "start_time": e.start_time,
            "end_time": e.end_time,
            "activity_type": e.activity_type
        }
        for e in entries
    ]

def find_available_rooms_tool(
    db: Session,
    day: str,
    start_time: str,
    end_time: str,
    kind: Optional[str] = None,
    block: Optional[str] = None,
    organization_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Find rooms that have no conflicting timetable entries during a time slot."""
    norm_day = day.strip().capitalize()
    occ_query = db.query(TimetableEntry.room_code).filter(
        TimetableEntry.day == norm_day,
        TimetableEntry.start_time < end_time,
        TimetableEntry.end_time > start_time
    )
    if organization_id is not None:
        occ_query = occ_query.filter(TimetableEntry.organization_id == organization_id)
    occupied_codes = occ_query.distinct().all()
    occupied_set = {r[0] for r in occupied_codes}

    query = db.query(Room).filter(Room.availability == 'AVAILABLE')
    if organization_id is not None:
        query = query.filter(Room.organization_id == organization_id)
    if kind:
        query = query.filter(Room.kind == kind.strip().upper())
    if block:
        query = query.filter(Room.block == block.strip().upper())

    matching = query.all()
    return [
        {
            "id": r.id,
            "organization_id": r.organization_id,
            "code": r.code,
            "block": r.block,
            "floor": r.floor,
            "kind": r.kind,
            "department": r.department
        }
        for r in matching if r.code not in occupied_set
    ]

def find_available_technicians_tool(
    db: Session,
    specialty: Optional[str] = None,
    organization_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Find technicians who are currently available, optionally matching a specialty."""
    query = db.query(Technician).filter(Technician.status == 'AVAILABLE')
    if organization_id is not None:
        query = query.filter(Technician.organization_id == organization_id)
    if specialty:
        query = query.filter(Technician.specialty == specialty.strip().upper())
    techs = query.all()
    return [
        {
            "id": t.id,
            "organization_id": t.organization_id,
            "name": t.name,
            "specialty": t.specialty,
            "status": t.status,
            "phone": t.phone
        }
        for t in techs
    ]

def find_facilities_tool(
    db: Session,
    facility_type: Optional[str] = None,
    block: Optional[str] = None,
    organization_id: Optional[int] = None
) -> List[Dict[str, Any]]:
    """Find campus service facilities (canteens, stationery, sports, administration)."""
    query = db.query(Room).filter(
        Room.kind.in_(['CANTEEN', 'STATIONERY', 'SPORTS', 'ADMIN', 'EVENT_SPACE', 'AUDITORIUM'])
    )
    if organization_id is not None:
        query = query.filter(Room.organization_id == organization_id)
    if facility_type:
        query = query.filter(Room.kind == facility_type.strip().upper())
    if block:
        query = query.filter(Room.block == block.strip().upper())
    facilities = query.all()
    return [
        {
            "id": f.id,
            "organization_id": f.organization_id,
            "code": f.code,
            "block": f.block,
            "floor": f.floor,
            "kind": f.kind,
            "department": f.department
        }
        for f in facilities
    ]

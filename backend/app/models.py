from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, JSON, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from .database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Organization(Base):
    """
    Primary Tenant Boundary.
    Every university / tenant in AUOrbit is represented as an Organization.
    """
    __tablename__ = 'organizations'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    slug: Mapped[str] = mapped_column(String(60), unique=True, index=True)
    domain: Mapped[str | None] = mapped_column(String(100), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    campuses: Mapped[List["Campus"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    departments: Mapped[List["Department"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    buildings: Mapped[List["Building"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    rooms: Mapped[List["Room"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    users: Mapped[List["User"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    technicians: Mapped[List["Technician"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    incidents: Mapped[List["Incident"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    agent_runs: Mapped[List["AgentRun"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    timetable_entries: Mapped[List["TimetableEntry"]] = relationship(back_populates="organization", cascade="all, delete-orphan")


class Campus(Base):
    """
    Campus within a University Organization.
    """
    __tablename__ = 'campuses'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    name: Mapped[str] = mapped_column(String(100))
    code: Mapped[str] = mapped_column(String(30))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    organization: Mapped["Organization"] = relationship(back_populates="campuses")
    buildings: Mapped[List["Building"]] = relationship(back_populates="campus", cascade="all, delete-orphan")
    rooms: Mapped[List["Room"]] = relationship(back_populates="campus")


class Building(Base):
    """
    Physical Building within a Campus.
    """
    __tablename__ = 'buildings'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    campus_id: Mapped[int | None] = mapped_column(ForeignKey('campuses.id'), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    code: Mapped[str] = mapped_column(String(20), index=True)
    floors: Mapped[int] = mapped_column(Integer, default=5)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    organization: Mapped["Organization"] = relationship(back_populates="buildings")
    campus: Mapped["Campus | None"] = relationship(back_populates="buildings")
    rooms: Mapped[List["Room"]] = relationship(back_populates="building")


class Department(Base):
    """
    Academic or Operational Department.
    """
    __tablename__ = 'departments'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    name: Mapped[str] = mapped_column(String(100))
    code: Mapped[str] = mapped_column(String(20), index=True)
    head_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    organization: Mapped["Organization"] = relationship(back_populates="departments")


class Room(Base):
    __tablename__ = 'rooms'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    campus_id: Mapped[int | None] = mapped_column(ForeignKey('campuses.id'), nullable=True, index=True)
    building_id: Mapped[int | None] = mapped_column(ForeignKey('buildings.id'), nullable=True, index=True)
    code: Mapped[str] = mapped_column(String(30), index=True)
    block: Mapped[str] = mapped_column(String(10))
    floor: Mapped[int]
    kind: Mapped[str] = mapped_column(String(30), default='CLASSROOM')
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    availability: Mapped[str] = mapped_column(String(20), default='AVAILABLE')

    organization: Mapped["Organization"] = relationship(back_populates="rooms")
    campus: Mapped["Campus | None"] = relationship(back_populates="rooms")
    building: Mapped["Building | None"] = relationship(back_populates="rooms")
    equipment: Mapped[List["Equipment"]] = relationship(back_populates="room", cascade="all, delete-orphan")
    timetable_entries: Mapped[List["TimetableEntry"]] = relationship(back_populates="room")


class Equipment(Base):
    __tablename__ = 'equipment'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    room_id: Mapped[int] = mapped_column(ForeignKey('rooms.id'))
    name: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(30), default='WORKING')
    last_updated: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    room: Mapped["Room"] = relationship(back_populates="equipment")


class Technician(Base):
    __tablename__ = 'technicians'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    user_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    specialty: Mapped[str] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20), default='AVAILABLE')
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)

    organization: Mapped["Organization"] = relationship(back_populates="technicians")


class Incident(Base):
    __tablename__ = 'incidents'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    reporter_id: Mapped[int | None] = mapped_column(ForeignKey('users.id'), nullable=True, index=True)
    reporter: Mapped[str] = mapped_column(String(100))
    description: Mapped[str] = mapped_column(Text)
    room_code: Mapped[str | None] = mapped_column(String(30), nullable=True)
    category: Mapped[str] = mapped_column(String(40))
    priority: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(30), default='REPORTED')
    media_urls: Mapped[list] = mapped_column(JSON, default=list)
    replan_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow)
    resolution: Mapped[str | None] = mapped_column(Text, nullable=True)

    organization: Mapped["Organization"] = relationship(back_populates="incidents")
    work_orders: Mapped[List["WorkOrder"]] = relationship(back_populates="incident", cascade="all, delete-orphan")
    agent_runs: Mapped[List["AgentRun"]] = relationship(back_populates="incident", cascade="all, delete-orphan")
    events: Mapped[List["AgentEvent"]] = relationship(back_populates="incident", cascade="all, delete-orphan")


class WorkOrder(Base):
    __tablename__ = 'work_orders'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    incident_id: Mapped[int] = mapped_column(ForeignKey('incidents.id'))
    technician_id: Mapped[int | None] = mapped_column(ForeignKey('technicians.id'), nullable=True)
    status: Mapped[str] = mapped_column(String(30), default='PENDING')
    scheduled_for: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    resolution_media: Mapped[list] = mapped_column(JSON, default=list)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    incident: Mapped["Incident"] = relationship(back_populates="work_orders")


class AgentRun(Base):
    """
    Parent execution lifecycle model for each autonomous run attempt.
    Groups events belonging to an initial triage run or a subsequent replan cycle.
    """
    __tablename__ = 'agent_runs'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    incident_id: Mapped[int] = mapped_column(ForeignKey('incidents.id'), index=True)
    run_number: Mapped[int] = mapped_column(Integer, default=1)
    trigger_reason: Mapped[str] = mapped_column(String(100), default='initial_report')
    status: Mapped[str] = mapped_column(String(30), default='RUNNING')  # RUNNING, COMPLETED, FAILED, CANCELLED
    started_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    metadata_payload: Mapped[dict] = mapped_column(JSON, default=dict)

    organization: Mapped["Organization"] = relationship(back_populates="agent_runs")
    incident: Mapped["Incident"] = relationship(back_populates="agent_runs")
    events: Mapped[List["AgentEvent"]] = relationship(back_populates="agent_run", cascade="all, delete-orphan")


class AgentEvent(Base):
    __tablename__ = 'agent_events'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    incident_id: Mapped[int] = mapped_column(ForeignKey('incidents.id'), index=True)
    agent_run_id: Mapped[int | None] = mapped_column(ForeignKey('agent_runs.id'), nullable=True, index=True)
    agent: Mapped[str] = mapped_column(String(255))
    action: Mapped[str] = mapped_column(Text)
    tool: Mapped[str | None] = mapped_column(String(255), nullable=True)
    detail: Mapped[dict] = mapped_column(JSON, default=dict)
    status: Mapped[str] = mapped_column(String(100), default='SUCCESS')
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    incident: Mapped["Incident"] = relationship(back_populates="events")
    agent_run: Mapped["AgentRun | None"] = relationship(back_populates="events")


class TimetableEntry(Base):
    __tablename__ = 'timetable_entries'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    room_id: Mapped[int | None] = mapped_column(ForeignKey('rooms.id'), nullable=True)
    room_code: Mapped[str] = mapped_column(String(30), index=True)
    branch: Mapped[str] = mapped_column(String(20))
    academic_year: Mapped[str] = mapped_column(String(20))
    semester: Mapped[str] = mapped_column(String(20))
    section: Mapped[str] = mapped_column(String(10), index=True)
    subject: Mapped[str] = mapped_column(String(100))
    faculty: Mapped[str] = mapped_column(String(100))
    day: Mapped[str] = mapped_column(String(15), index=True)
    period: Mapped[int]
    start_time: Mapped[str] = mapped_column(String(10))
    end_time: Mapped[str] = mapped_column(String(10))
    activity_type: Mapped[str] = mapped_column(String(30), default='LECTURE')
    is_reference_data: Mapped[bool] = mapped_column(Boolean, default=False)

    organization: Mapped["Organization"] = relationship(back_populates="timetable_entries")
    room: Mapped["Room | None"] = relationship(back_populates="timetable_entries")


class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    organization_id: Mapped[int] = mapped_column(ForeignKey('organizations.id'), index=True, default=1)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[str] = mapped_column(String(100))
    role: Mapped[str] = mapped_column(String(30), default='STUDENT')  # STUDENT, FACULTY, TECHNICIAN, ADMIN, UNIVERSITY_ADMIN, SUPER_ADMIN
    department: Mapped[str | None] = mapped_column(String(100), nullable=True)
    specialty: Mapped[str | None] = mapped_column(String(100), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(30), nullable=True)
    avatar_color: Mapped[str | None] = mapped_column(String(30), nullable=True, default='#00f2ff')
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    organization: Mapped["Organization"] = relationship(back_populates="users")

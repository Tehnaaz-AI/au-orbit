from datetime import datetime
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field

class OrganizationOut(BaseModel):
    id: int
    name: str
    slug: str
    domain: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class CampusOut(BaseModel):
    id: int
    organization_id: int
    name: str
    code: str

    class Config:
        from_attributes = True

class DepartmentOut(BaseModel):
    id: int
    organization_id: int
    name: str
    code: str
    head_name: Optional[str] = None

    class Config:
        from_attributes = True

class ReportIn(BaseModel):
    reporter: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=5, max_length=2000)
    room_code: Optional[str] = None
    media_urls: Optional[List[str]] = Field(default_factory=list)

class StatusIn(BaseModel):
    status: str

class WorkAction(BaseModel):
    action: str
    notes: Optional[str] = None
    technician_id: Optional[int] = None
    outcome: Optional[str] = None
    resolution_media: Optional[List[str]] = Field(default_factory=list)
    auto_replan: Optional[bool] = True

class TimetableEntryCreate(BaseModel):
    branch: str = Field(default="AI", max_length=20)
    academic_year: str = Field(default="2026-27", max_length=20)
    semester: str = Field(default="II-I", max_length=20)
    section: str = Field(min_length=1, max_length=10)
    subject: str = Field(min_length=2, max_length=100)
    faculty: str = Field(min_length=2, max_length=100)
    room_code: str = Field(min_length=1, max_length=30)
    day: str = Field(min_length=3, max_length=15)
    period: int = Field(ge=1, le=8)
    start_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(pattern=r"^\d{2}:\d{2}$")
    activity_type: str = Field(default="LECTURE", max_length=30)
    is_reference_data: bool = Field(default=False)

class TimetableEntryUpdate(BaseModel):
    branch: Optional[str] = None
    academic_year: Optional[str] = None
    semester: Optional[str] = None
    section: Optional[str] = None
    subject: Optional[str] = None
    faculty: Optional[str] = None
    room_code: Optional[str] = None
    day: Optional[str] = None
    period: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    activity_type: Optional[str] = None
    is_reference_data: Optional[bool] = None

class TimetableEntryOut(BaseModel):
    id: int
    organization_id: Optional[int] = 1
    room_id: Optional[int] = None
    room_code: str
    branch: str
    academic_year: str
    semester: str
    section: str
    subject: str
    faculty: str
    day: str
    period: int
    start_time: str
    end_time: str
    activity_type: str
    is_reference_data: bool

    class Config:
        from_attributes = True

class EquipmentOut(BaseModel):
    id: int
    organization_id: Optional[int] = 1
    room_id: int
    name: str
    status: str
    last_updated: datetime

    class Config:
        from_attributes = True

class RoomOut(BaseModel):
    id: Optional[int] = None
    organization_id: Optional[int] = 1
    code: str
    block: str
    floor: int
    kind: str
    availability: str
    department: Optional[str] = None

    class Config:
        from_attributes = True

class TechnicianOut(BaseModel):
    id: int
    organization_id: Optional[int] = 1
    name: str
    specialty: str
    status: str
    phone: Optional[str] = None

    class Config:
        from_attributes = True

class ContactInfoOut(BaseModel):
    contact_email: str
    contact_email_primary: str
    contact_email_secondary: str
    contact_phone: str
    contact_phone_primary: str
    contact_phone_secondary: str
    campus_hotline: str
    campus_name: str
    campus_address: str
    campus_hours: str

class UserRegisterIn(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=4, max_length=100)
    full_name: str = Field(min_length=2, max_length=100)
    role: str = Field(default="STUDENT")  # Public self-registration ONLY accepts STUDENT or FACULTY
    department: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None

class UserCreateIn(BaseModel):
    email: str = Field(min_length=5, max_length=120)
    password: str = Field(min_length=4, max_length=100)
    full_name: str = Field(min_length=2, max_length=100)
    role: str = Field(default="STUDENT")
    department: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    organization_id: Optional[int] = 1

class UserUpdateIn(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    department: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: Optional[bool] = None

class ProfileUpdateIn(BaseModel):
    full_name: Optional[str] = None
    department: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class UserLoginIn(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: int
    organization_id: int = 1
    email: str
    full_name: str
    role: str
    department: Optional[str] = None
    specialty: Optional[str] = None
    phone: Optional[str] = None
    avatar_color: Optional[str] = "#00f2ff"
    avatar_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    token: str
    user: UserOut
    message: str

# =====================================================================
# Stage 3 Agent & Intelligence Schemas
# =====================================================================

class StructuredUnderstanding(BaseModel):
    problem_type: str = Field(
        default="General",
        description="Type of equipment or issue"
    )
    category: str = Field(
        default="FACILITIES",
        description="High level category: AV_ELECTRICAL, IT_NETWORK, FACILITIES, or SPACE_ALLOCATION"
    )
    location: Optional[str] = Field(
        default=None,
        description="Specific verified campus space code or null if not explicitly identifiable"
    )
    is_location_ambiguous: bool = Field(
        default=False,
        description="True if location is vague or unmentioned"
    )
    description: str = Field(
        description="Concise description of the observed operational problem"
    )
    urgency_signal: str = Field(
        default="NORMAL",
        description="Urgency signal extracted from report: EMERGENCY, HIGH, NORMAL, or LOW"
    )
    resolution_type: str = Field(
        default="TECHNICIAN_DISPATCH",
        description="Resolution strategy: 'TECHNICIAN_DISPATCH', 'SPACE_REALLOCATION', or 'FACILITY_MANAGEMENT'"
    )
    requires_technician: bool = Field(
        default=True,
        description="Whether a physical technician is required to resolve this incident"
    )
    reallocated_room_code: Optional[str] = Field(
        default=None,
        description="Target room assigned if space reallocation was requested"
    )
    seating_requirement: Optional[int] = Field(
        default=None,
        description="Estimated seating or capacity needed if reported"
    )
    affected_activity: Optional[str] = Field(
        default=None,
        description="Contextual activity affected"
    )
    confidence: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Confidence score between 0.0 and 1.0"
    )
    reasoning_summary: str = Field(
        default="",
        description="Brief summary of understanding agent's reasoning"
    )
    source: str = Field(
        default="deterministic_fallback",
        description="Source of extraction: 'gemini' or 'deterministic_fallback'"
    )

class ContextFactSheet(BaseModel):
    room_code: Optional[str] = None
    room_verified: bool = False
    room_kind: Optional[str] = None
    room_department: Optional[str] = None
    equipment_found: List[Dict[str, Any]] = Field(default_factory=list)
    affected_equipment_id: Optional[int] = None
    affected_equipment_name: Optional[str] = None
    current_class: Optional[Dict[str, Any]] = None
    upcoming_classes: List[Dict[str, Any]] = Field(default_factory=list)
    nearby_facilities: List[Dict[str, Any]] = Field(default_factory=list)
    facts_summary: str = ""

class PriorityAssessment(BaseModel):
    priority: Literal["LOW", "NORMAL", "HIGH", "CRITICAL"] = "NORMAL"
    is_timetable_escalated: bool = False
    timetable_conflict: bool = False
    timetable_evidence: Optional[str] = None
    is_emergency: bool = False
    confidence: float = 1.0
    reasoning: str = ""
    evidence: List[str] = Field(default_factory=list)

class AgentEventOut(BaseModel):
    id: int
    organization_id: Optional[int] = 1
    incident_id: Optional[int] = None
    agent_run_id: Optional[int] = None
    agent: str
    action: str
    tool: Optional[str] = None
    detail: Dict[str, Any] = Field(default_factory=dict)
    status: str
    created_at: Optional[str] = None

class AgentRunOut(BaseModel):
    id: int
    organization_id: Optional[int] = 1
    incident_id: int
    run_number: int
    trigger_reason: str
    status: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    metadata_payload: Dict[str, Any] = Field(default_factory=dict)
    events: List[AgentEventOut] = Field(default_factory=list)

# =====================================================================
# Stage 4B Resource & Scheduling Decision Schemas
# =====================================================================

class ResourceCandidate(BaseModel):
    technician_id: int
    technician_name: str
    specialty: str
    status: str
    score: float
    capability_match: str
    active_workload: int
    location_match: bool
    excluded: bool = False
    reason: str

class ResourceDecision(BaseModel):
    selected_technician_id: Optional[int] = None
    selected_technician_name: Optional[str] = None
    capability_requirement: str = "UNKNOWN"
    score: Optional[float] = None
    candidates: List[ResourceCandidate] = Field(default_factory=list)
    excluded_technician_ids: List[int] = Field(default_factory=list)
    decision_reason: str = ""
    is_feasible: bool = False

class SchedulingDecision(BaseModel):
    scheduled: bool = False
    scheduled_start: Optional[str] = None
    scheduled_end: Optional[str] = None
    target_date: Optional[str] = None
    room_code: Optional[str] = None
    technician_id: Optional[int] = None
    priority: str = "NORMAL"
    conflict_detected: bool = False
    conflict_reason: Optional[str] = None
    decision_reason: str = ""
    policy_applied: str = "STANDARD_WINDOW"

class SpaceCandidate(BaseModel):
    room_code: str
    block: str
    floor: int
    kind: str
    department: Optional[str] = None
    score: float
    distance_factor: str
    is_vacant: bool = True
    reason: str

class SpaceAllocationDecision(BaseModel):
    reallocated: bool = False
    original_room: Optional[str] = None
    allocated_room: Optional[str] = None
    allocated_room_kind: Optional[str] = None
    allocated_block: Optional[str] = None
    allocated_floor: Optional[int] = None
    time_slot: Optional[str] = None
    period: Optional[int] = None
    day: Optional[str] = None
    subject: Optional[str] = None
    faculty: Optional[str] = None
    section: Optional[str] = None
    candidates_evaluated: List[SpaceCandidate] = Field(default_factory=list)
    decision_reason: str = ""

class VerificationResult(BaseModel):
    outcome: str = "PASS"
    incident_id: int
    work_order_id: int
    affected_equipment_id: Optional[int] = None
    previous_equipment_state: Optional[str] = None
    new_equipment_state: Optional[str] = None
    previous_incident_state: str
    new_incident_state: str
    reason: str
    verified_at: str

class ReplanResult(BaseModel):
    success: bool
    incident_id: int
    replan_attempt: int
    max_attempts: int = 3
    previous_technician_ids: List[int] = Field(default_factory=list)
    selected_technician_id: Optional[int] = None
    selected_technician_name: Optional[str] = None
    new_work_order_id: Optional[int] = None
    scheduled_for: Optional[str] = None
    incident_status: str
    reason: str

class IncidentOut(BaseModel):
    id: int
    organization_id: int = 1
    reporter: str
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    reporter_role: Optional[str] = None
    reporter_phone: Optional[str] = None
    reporter_department: Optional[str] = None
    description: str
    room_code: Optional[str] = None
    category: str
    priority: str
    status: str
    media_urls: List[str] = Field(default_factory=list)
    replan_count: int = 0
    created_at: Optional[str] = None
    resolution: Optional[str] = None
    understanding: Optional[StructuredUnderstanding] = None
    context_facts: Optional[ContextFactSheet] = None
    priority_assessment: Optional[PriorityAssessment] = None
    resource_decision: Optional[ResourceDecision] = None
    scheduling_decision: Optional[SchedulingDecision] = None
    space_allocation_decision: Optional[SpaceAllocationDecision] = None
    work_order: Optional[Dict[str, Any]] = None
    work_orders: List[Dict[str, Any]] = Field(default_factory=list)
    runs: List[AgentRunOut] = Field(default_factory=list)
    events: List[AgentEventOut] = Field(default_factory=list)

class ContactMessageIn(BaseModel):
    name: Optional[str] = Field(default="Campus User", max_length=100)
    email: str = Field(min_length=3, max_length=100)
    subject: Optional[str] = Field(default="Helpdesk Inquiry", max_length=150)
    message: str = Field(min_length=2, max_length=3000)

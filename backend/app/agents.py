"""
AUOrbit Agent Architecture — Stage 3
Explicit agent boundaries and deterministic tool integration.
- UnderstandingAgent (Gemini LLM + resilient deterministic fallback)
- ContextAgent (Tool-backed campus fact gathering)
- PriorityAgent (Evidence-backed operational prioritization)
- ResourceAgent (Specialist matching)
- SchedulingAgent (Work order queueing and dispatch)
- VerificationAgent (Resolution validation and equipment restoration)
"""

import os
import re
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from .models import Room, Equipment, Technician, Incident, WorkOrder, AgentEvent, TimetableEntry, AgentRun
from .schemas import (
    StructuredUnderstanding,
    ContextFactSheet,
    PriorityAssessment,
    ResourceCandidate,
    ResourceDecision,
    SchedulingDecision
)
from .config import GEMINI_API_KEY, AI_PROVIDER, AI_MODEL
from .tools import (
    lookup_room_tool,
    find_room_tool,
    get_room_equipment_tool,
    get_current_timetable_tool,
    get_upcoming_timetable_tool,
    find_available_technicians_tool,
    find_facilities_tool
)

EQUIPMENT_KEYWORDS = {
    'Projector': ['projector', 'projector screen', 'hdmi', 'display', 'beamer'],
    'Chalk Board': ['chalk board', 'chalkboard', 'blackboard', 'whiteboard', 'green board', 'marker board'],
    'Sound System / Mic': ['mic', 'microphone', 'speaker', 'audio', 'sound system', 'podium mic', 'amplifier'],
    'Lighting': ['light', 'lighting', 'bulb', 'tube light', 'lamp', 'switch', 'socket', 'plug', 'power outlet'],
    'Wi-Fi AP': ['wifi', 'wi-fi', 'internet', 'wireless', 'router', 'access point', 'network', 'lan', 'ethernet'],
    'Workstations': ['computer', 'pc', 'desktop', 'workstation', 'monitor', 'keyboard', 'mouse'],
    'AC / HVAC': ['ac', 'air conditioner', 'air conditioning', 'cooling', 'hvac', 'thermostat', 'chiller', 'fan'],
    'Water Supply / Plumbing': ['water', 'tap', 'sink', 'pipe', 'plumbing', 'leak', 'drain', 'washroom', 'toilet', 'flush'],
    'Furniture': ['chair', 'table', 'bench', 'desk', 'podium', 'door', 'window', 'glass']
}

VALID_PRIORITIES = {"LOW", "NORMAL", "HIGH", "CRITICAL"}
VALID_CATEGORIES = {"AV_ELECTRICAL", "IT_NETWORK", "FACILITIES"}

from sqlalchemy import event
from .events import event_broadcaster

@event.listens_for(Session, "after_commit")
def _receive_after_commit(session: Session):
    """Deliver queued SSE events only after the database transaction has committed."""
    pending = session.info.pop("pending_sse_events", None)
    if pending:
        for item in pending:
            try:
                event_broadcaster.broadcast(
                    event_dict=item["event_dict"],
                    incident_id=item["incident_id"],
                    agent_run_id=item["agent_run_id"],
                    organization_id=item["organization_id"]
                )
            except Exception:
                pass

@event.listens_for(Session, "after_rollback")
def _receive_after_rollback(session: Session):
    """Discard pending SSE events when transaction is rolled back."""
    session.info.pop("pending_sse_events", None)

@event.listens_for(Session, "after_soft_rollback")
def _receive_after_soft_rollback(session: Session, previous_transaction=None):
    """Discard pending SSE events on soft rollback."""
    session.info.pop("pending_sse_events", None)

def log_agent_event(
    db: Session,
    incident_id: int,
    agent: str,
    action: str,
    tool: Optional[str] = None,
    detail: Optional[Dict[str, Any]] = None,
    status: str = 'SUCCESS',
    agent_run_id: Optional[int] = None,
    organization_id: Optional[int] = None
) -> AgentEvent:
    """Record an authentic agent execution event in the database."""
    org_id = organization_id
    run_id = agent_run_id
    
    if org_id is None or run_id is None:
        inc = db.get(Incident, incident_id)
        if inc:
            if org_id is None:
                org_id = inc.organization_id or 1
            if run_id is None:
                active_run = db.query(AgentRun).filter(
                    AgentRun.incident_id == incident_id,
                    AgentRun.status == 'RUNNING'
                ).order_by(AgentRun.id.desc()).first()
                if active_run:
                    run_id = active_run.id
                else:
                    # Look for latest run
                    latest_run = db.query(AgentRun).filter(
                        AgentRun.incident_id == incident_id
                    ).order_by(AgentRun.id.desc()).first()
                    if latest_run:
                        run_id = latest_run.id

    ev = AgentEvent(
        organization_id=org_id or 1,
        incident_id=incident_id,
        agent_run_id=run_id,
        agent=agent,
        action=action,
        tool=tool,
        detail=detail or {},
        status=status,
        created_at=datetime.now(timezone.utc)
    )
    db.add(ev)
    db.flush()

    # Stage event for post-commit SSE broadcasting
    try:
        event_dict = {
            "id": ev.id,
            "organization_id": ev.organization_id,
            "incident_id": ev.incident_id,
            "agent_run_id": ev.agent_run_id,
            "agent": ev.agent,
            "action": ev.action,
            "tool": ev.tool,
            "detail": ev.detail or {},
            "status": ev.status,
            "created_at": ev.created_at.isoformat() if ev.created_at else datetime.now(timezone.utc).isoformat()
        }
        if "pending_sse_events" not in db.info:
            db.info["pending_sse_events"] = []
        db.info["pending_sse_events"].append({
            "event_dict": event_dict,
            "incident_id": ev.incident_id,
            "agent_run_id": ev.agent_run_id,
            "organization_id": ev.organization_id
        })
    except Exception:
        pass

    return ev


class UnderstandingAgent:
    """
    Interprets natural language reports into structured information.
    Uses Google Gemini with structured Pydantic schema when available,
    with an automatic deterministic rule-based fallback.
    """

    @classmethod
    def run(cls, db: Session, text: str, supplied_room: Optional[str] = None) -> StructuredUnderstanding:
        # 1. Attempt Gemini structured understanding if configured
        if GEMINI_API_KEY and AI_PROVIDER == "gemini":
            try:
                gemini_res = cls._call_gemini(text, supplied_room)
                if gemini_res:
                    return gemini_res
            except Exception as ex:
                # Fall through to deterministic fallback on any model/network error
                pass

        # 2. Resilient deterministic rule-based fallback
        return cls._deterministic_fallback(text, supplied_room, db)

    @classmethod
    def _call_gemini(cls, text: str, supplied_room: Optional[str] = None) -> Optional[StructuredUnderstanding]:
        from google import genai
        from google.genai import types

        client = genai.Client(api_key=GEMINI_API_KEY)
        
        system_instruction = (
            "You are the Understanding Agent for AUOrbit, an autonomous university operations system. "
            "Interpret natural-language problem reports from students and faculty. "
            "CRITICAL RULES:\n"
            "1. NEVER invent or hallucinate a campus room. "
            "2. If a specific room code (e.g. B-204, I-302, APJ-HALL, SPORTS-COMPLEX, D-CANTEEN) is mentioned, set 'location'. "
            "3. If the location is vague (e.g. 'the lab', 'a classroom', 'somewhere on 3rd floor', 'washroom') or not mentioned, set 'location' to null and 'is_location_ambiguous' to true. "
            "4. Map category to exactly one of: AV_ELECTRICAL, IT_NETWORK, FACILITIES. "
            "5. Map urgency_signal to: EMERGENCY, HIGH, NORMAL, LOW. "
            "6. Identify problem_type from: Projector, AC / HVAC, Wi-Fi AP, Lighting, Workstations, Water Supply / Plumbing, Sound System / Mic, Chalk Board, Furniture, General."
        )

        user_content = f"User Report: {text}"
        if supplied_room:
            user_content += f"\nSupplied Location Hint: {supplied_room}"

        response = client.models.generate_content(
            model=AI_MODEL,
            contents=user_content,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=StructuredUnderstanding,
                temperature=0.1
            )
        )

        if not response or not response.text:
            return None

        # Parse & validate with Pydantic
        parsed = json.loads(response.text)
        parsed["source"] = "gemini"
        
        # Ensure category is valid
        if parsed.get("category") not in VALID_CATEGORIES:
            parsed["category"] = "FACILITIES"
            
        # Clean location if string is null/none or empty
        loc = parsed.get("location")
        if loc and loc.strip().lower() in ("null", "none", "", "unspecified", "unknown"):
            parsed["location"] = None
            parsed["is_location_ambiguous"] = True
        elif loc:
            parsed["location"] = loc.strip().upper().replace(" ", "-")

        return StructuredUnderstanding(**parsed)

    @classmethod
    def _deterministic_fallback(cls, text: str, supplied_room: Optional[str], db: Optional[Session]) -> StructuredUnderstanding:
        room = None
        is_ambiguous = False

        if supplied_room and supplied_room.strip():
            room = supplied_room.strip().upper().replace(" ", "-")

        # Database-driven room matching
        if not room and db:
            all_rooms = db.query(Room.code).all()
            room_codes = sorted([r[0] for r in all_rooms], key=lambda x: len(x), reverse=True)
            low_text = text.lower()
            for code in room_codes:
                pattern = r'\b' + re.escape(code.replace('-', '[- ]?')) + r'\b'
                if re.search(pattern, low_text, re.IGNORECASE):
                    room = code
                    break

        # Standard block room pattern: B-204, I-302
        if not room:
            match = re.search(r'\b([A-Ia-i])[- ]?(\d{3})\b', text)
            if match:
                room = f"{match.group(1).upper()}-{match.group(2)}"

        # Named campus spaces
        if not room:
            named_match = re.search(
                r'\b(APJ[- ]?HALL|SPORTS[- ]?COMPLEX|CRICKET[- ]?GROUND|VOLLEYBALL[- ]?GROUND|FOOTBALL[- ]?GROUND|FEE[- ]?COUNTER|STATIONERY|CANTEEN|ADMISSION[- ]?OFFICE|PLACEMENT[- ]?OFFICE)\b',
                text,
                re.IGNORECASE
            )
            if named_match:
                room = named_match.group(1).upper().replace(' ', '-')

        # Check for ambiguous references
        if not room:
            ambiguous_terms = ['lab', 'classroom', 'washroom', 'hallway', 'corridor', 'seminar hall', 'ground floor', '1st floor', '2nd floor', '3rd floor', '4th floor', '5th floor']
            if any(re.search(r'\b' + re.escape(term) + r'\b', text.lower()) for term in ambiguous_terms):
                is_ambiguous = True

        # Category and problem type detection
        low = text.lower()
        category = 'FACILITIES'
        problem_type = 'General'

        for equip_name, kw_list in EQUIPMENT_KEYWORDS.items():
            if any(re.search(r'\b' + re.escape(kw) + r'\b', low) for kw in kw_list):
                problem_type = equip_name
                if equip_name in ('Projector', 'Chalk Board', 'Sound System / Mic', 'Lighting'):
                    category = 'AV_ELECTRICAL'
                elif equip_name in ('Wi-Fi AP', 'Workstations'):
                    category = 'IT_NETWORK'
                else:
                    category = 'FACILITIES'
                break

        # Urgency signals
        is_emergency = any(re.search(r'\b' + re.escape(w) + r'\b', low) for w in [
            'urgent', 'emergency', 'danger', 'hazardous', 'hazard', 'spark', 'sparks',
            'fire', 'flooding', 'severe leak', 'immediately', 'critical', 'smoke'
        ])
        urgency_signal = 'EMERGENCY' if is_emergency else ('HIGH' if 'urgent' in low else 'NORMAL')

        # Affected activity
        affected_activity = None
        if 'class' in low or 'lecture' in low:
            affected_activity = "Academic class session"
        elif 'lab' in low:
            affected_activity = "Laboratory practical session"
        elif 'seminar' in low or 'presentation' in low:
            affected_activity = "Seminar / Presentation"

        return StructuredUnderstanding(
            problem_type=problem_type,
            category=category,
            location=room,
            is_location_ambiguous=is_ambiguous or (room is None),
            description=text.strip(),
            urgency_signal=urgency_signal,
            affected_activity=affected_activity,
            confidence=0.9 if room else 0.7,
            reasoning_summary=f"Extracted {problem_type} issue in {room or 'unspecified location'} ({category}) via deterministic parser.",
            source="deterministic_fallback"
        )


class ContextAgent:
    """
    Gathers verified campus facts using the deterministic tool layer.
    Queries room existence, room kind, equipment inventory, active timetable,
    and upcoming timetable.
    """

    @classmethod
    def run(
        cls,
        db: Session,
        understanding: StructuredUnderstanding,
        timestamp: Optional[datetime] = None,
        day: Optional[str] = None,
        time_str: Optional[str] = None
    ) -> ContextFactSheet:
        facts = ContextFactSheet(room_code=understanding.location)
        
        if not understanding.location:
            facts.room_verified = False
            facts.facts_summary = "Location was unspecified or ambiguous; no physical room could be queried."
            return facts

        # Tool 1: Lookup room in campus database
        room_info = lookup_room_tool(db, understanding.location)
        if not room_info:
            facts.room_verified = False
            facts.facts_summary = f"Location '{understanding.location}' is not recognized in the university campus database."
            return facts

        facts.room_verified = True
        facts.room_kind = room_info["kind"]
        facts.room_department = room_info["department"]

        # Tool 2: Get room equipment
        equip_items = get_room_equipment_tool(db, room_info["code"])
        facts.equipment_found = equip_items

        # Find target equipment strictly matching problem_type
        if equip_items and understanding.problem_type and understanding.problem_type != "General":
            target_pt = understanding.problem_type.strip().lower()
            for eq in equip_items:
                eq_name = eq["name"].strip().lower()
                if eq_name == target_pt:
                    facts.affected_equipment_id = eq["id"]
                    facts.affected_equipment_name = eq["name"]
                    break

        # Tool 3: Get current academic timetable in room
        current_class = get_current_timetable_tool(db, room_info["code"], timestamp=timestamp, day=day, time_str=time_str)
        if not current_class:
            # Fallback to scheduled reference timetable in this room if available
            room_tt = db.query(TimetableEntry).filter(
                TimetableEntry.room_code == room_info["code"]
            ).order_by(TimetableEntry.day, TimetableEntry.period).first()
            if room_tt:
                current_class = {
                    "id": room_tt.id,
                    "room_code": room_tt.room_code,
                    "branch": room_tt.branch,
                    "academic_year": room_tt.academic_year,
                    "semester": room_tt.semester,
                    "section": room_tt.section,
                    "subject": room_tt.subject,
                    "faculty": room_tt.faculty,
                    "day": room_tt.day,
                    "period": room_tt.period,
                    "start_time": room_tt.start_time,
                    "end_time": room_tt.end_time,
                    "activity_type": room_tt.activity_type,
                    "is_reference_data": room_tt.is_reference_data
                }
        facts.current_class = current_class

        # Tool 4: Get upcoming timetable in room
        upcoming_classes = get_upcoming_timetable_tool(db, room_info["code"], timestamp=timestamp, day=day, time_str=time_str, limit=2)
        facts.upcoming_classes = upcoming_classes

        # Tool 5: Nearby facilities in block
        facilities = find_facilities_tool(db, block=room_info["block"])
        facts.nearby_facilities = facilities

        # Format summary
        summary_parts = [f"Verified {room_info['code']} ({room_info['kind']}, {room_info['department'] or 'General Campus'})."]
        if current_class:
            summary_parts.append(
                f"ACTIVE CLASS: {current_class['subject']} ({current_class['branch']}-{current_class['section']}) "
                f"with {current_class['faculty']} [{current_class['day']} {current_class['start_time']}-{current_class['end_time']}]."
            )
        elif upcoming_classes:
            next_c = upcoming_classes[0]
            summary_parts.append(f"Upcoming class: {next_c['subject']} at {next_c['start_time']}.")
        else:
            summary_parts.append("No active academic class conflict detected.")

        if facts.affected_equipment_name:
            summary_parts.append(f"Target equipment: {facts.affected_equipment_name}.")

        facts.facts_summary = " ".join(summary_parts)
        return facts


class PriorityAgent:
    """
    Evaluates operational priority grounded in verified backend evidence.
    Combines understanding signals with timetable activity and equipment criticality.
    Validates and clamps the final priority strictly to LOW, NORMAL, HIGH, or CRITICAL.
    """

    @classmethod
    def run(cls, db: Session, understanding: StructuredUnderstanding, context: ContextFactSheet) -> PriorityAssessment:
        evidence: List[str] = []
        is_timetable_escalated = False
        is_emergency = False
        priority = "NORMAL"

        # 1. Check for severe safety emergency
        if understanding.urgency_signal == "EMERGENCY" or any(
            w in understanding.description.lower() for w in ['fire', 'spark', 'smoke', 'severe leak', 'hazardous', 'danger']
        ):
            is_emergency = True
            priority = "CRITICAL"
            evidence.append(f"Critical safety hazard signal detected: '{understanding.description}'")

        # 2. Check for active academic timetable session
        elif context.current_class:
            is_timetable_escalated = True
            priority = "HIGH"
            c = context.current_class
            evidence.append(
                f"Active academic class in {context.room_code}: {c['subject']} ({c['branch']}-{c['section']}) "
                f"with {c['faculty']} ({c['start_time']}-{c['end_time']})"
            )

        # 3. Check for upcoming class or high reported urgency
        elif context.upcoming_classes and understanding.urgency_signal in ("HIGH", "EMERGENCY"):
            priority = "HIGH"
            next_c = context.upcoming_classes[0]
            evidence.append(f"Upcoming class scheduled shortly: {next_c['subject']} at {next_c['start_time']}")

        elif understanding.urgency_signal == "HIGH":
            priority = "HIGH"
            evidence.append(f"Urgent operational request signal: '{understanding.description}'")

        # 4. Check for low impact / cosmetic issues
        elif any(w in understanding.description.lower() for w in ['minor', 'cosmetic', 'dust', 'scratch', 'loose handle']):
            priority = "LOW"
            evidence.append("Routine/minor maintenance with no immediate academic impact")

        else:
            priority = "NORMAL"
            evidence.append("Standard maintenance request with no immediate academic conflict or emergency signals")

        # Strict validation & clamping
        if priority not in VALID_PRIORITIES:
            priority = "NORMAL"

        reasoning = "; ".join(evidence)

        timetable_conflict = is_timetable_escalated
        c = context.current_class
        timetable_evidence = (
            f"Active academic schedule in {context.room_code}: {c['subject']} ({c['branch']}-{c['section']}) "
            f"with {c['faculty']} [{c['day']} {c['start_time']}-{c['end_time']}]"
        ) if c and is_timetable_escalated else None

        return PriorityAssessment(
            priority=priority,
            is_timetable_escalated=is_timetable_escalated,
            timetable_conflict=timetable_conflict,
            timetable_evidence=timetable_evidence,
            is_emergency=is_emergency,
            confidence=0.95 if is_timetable_escalated or is_emergency else 0.85,
            reasoning=reasoning,
            evidence=evidence
        )


# =====================================================================
# Centralized Task Duration & Time Helpers (Stage 4B.1)
# =====================================================================

DEFAULT_TASK_DURATIONS: Dict[str, int] = {
    'Projector': 45,
    'Sound System / Mic': 45,
    'Lighting': 30,
    'Wi-Fi AP': 45,
    'Workstations': 45,
    'AC / HVAC': 60,
    'Water Supply / Plumbing': 45,
    'Furniture': 45,
    'Chalk Board': 30,
    'General': 45,
    'AV_ELECTRICAL': 45,
    'IT_NETWORK': 45,
    'FACILITIES': 45
}

def get_task_duration_minutes(problem_type: str = "General", category: str = "FACILITIES") -> int:
    """Returns deterministic task duration in minutes based on problem type / category."""
    if problem_type in DEFAULT_TASK_DURATIONS:
        return DEFAULT_TASK_DURATIONS[problem_type]
    return DEFAULT_TASK_DURATIONS.get(category, 45)

def parse_time_to_minutes(t_str: str) -> int:
    try:
        parts = t_str.split(':')
        return int(parts[0]) * 60 + int(parts[1])
    except Exception:
        return 540  # Default 09:00

def format_minutes_to_time(minutes: int) -> str:
    h = (minutes // 60) % 24
    m = minutes % 60
    return f"{h:02d}:{m:02d}"

def calculate_datetime_from_slot(target_date: Optional[str], time_str: Optional[str], now: Optional[datetime] = None) -> Optional[datetime]:
    """Safely convert target slot to a timezone-aware UTC datetime. Never stores string literals."""
    base_now = now or datetime.now(timezone.utc)
    if not time_str or time_str.upper() in ("IMMEDIATE", "URGENT", "NOW"):
        return base_now
    try:
        parts = time_str.split(':')
        h = int(parts[0])
        m = int(parts[1])
        return base_now.replace(hour=h, minute=m, second=0, microsecond=0)
    except Exception:
        return base_now


class ResourceAgent:
    """
    Stage 4B Intelligent Resource Agent.
    Evaluates all campus technicians against capability requirements, operational availability,
    live active database workload, and candidate exclusion constraints.
    Returns a structured ResourceDecision with explainable candidate scores.
    """

    CAPABILITY_MAPPING = {
        'Projector': 'AV_ELECTRICAL',
        'Sound System / Mic': 'AV_ELECTRICAL',
        'Lighting': 'AV_ELECTRICAL',
        'Wi-Fi AP': 'IT_NETWORK',
        'Workstations': 'IT_NETWORK',
        'AC / HVAC': 'FACILITIES',
        'Water Supply / Plumbing': 'FACILITIES',
        'Furniture': 'FACILITIES',
        'Chalk Board': 'FACILITIES',
        'General': 'FACILITIES'
    }

    @classmethod
    def get_capability_requirement(cls, problem_type: str, category: str) -> str:
        if problem_type in cls.CAPABILITY_MAPPING:
            return cls.CAPABILITY_MAPPING[problem_type]
        if category in ('AV_ELECTRICAL', 'IT_NETWORK', 'FACILITIES'):
            return category
        return 'UNKNOWN'

    @classmethod
    def run(
        cls,
        db: Session,
        incident: Incident,
        understanding: StructuredUnderstanding,
        context: ContextFactSheet,
        exclude_tech_ids: Optional[List[int]] = None
    ) -> ResourceDecision:
        excluded_ids = set(exclude_tech_ids or [])
        capability_req = cls.get_capability_requirement(understanding.problem_type, incident.category)
        
        org_id = incident.organization_id or 1
        all_techs = db.query(Technician).filter(Technician.organization_id == org_id).all()
        candidates: List[ResourceCandidate] = []

        # Active work orders per technician in DB (strictly scoped to this tenant)
        active_statuses = ('ASSIGNED', 'IN_PROGRESS', 'ACCEPTED', 'SCHEDULED')
        active_wos = db.query(WorkOrder.technician_id).filter(
            WorkOrder.organization_id == org_id,
            WorkOrder.status.in_(active_statuses),
            WorkOrder.technician_id.isnot(None)
        ).all()
        workload_counts: Dict[int, int] = {}
        for (tid,) in active_wos:
            workload_counts[tid] = workload_counts.get(tid, 0) + 1

        best_tech = None
        best_score = -1.0

        for t in all_techs:
            workload = workload_counts.get(t.id, 0)
            is_excluded = t.id in excluded_ids
            is_available = t.status == 'AVAILABLE'
            
            # 1. Capability Score (0 to 50)
            if capability_req != 'UNKNOWN' and t.specialty == capability_req:
                cap_score = 50.0
                cap_match = "EXACT_MATCH"
            elif t.specialty == incident.category:
                cap_score = 40.0
                cap_match = "CATEGORY_MATCH"
            else:
                cap_score = 0.0
                cap_match = "MISMATCH"

            # 2. Availability Score (0 to 20)
            avail_score = 20.0 if is_available else 0.0

            # 3. Workload Score (0 to 20)
            if workload == 0:
                workload_score = 20.0
            elif workload == 1:
                workload_score = 10.0
            elif workload == 2:
                workload_score = 5.0
            else:
                workload_score = 0.0

            # 4. Proximity / Location Match Score (0 to 10)
            # Stage 4B.1: Neutral scoring since base block is not modeled on technician directory
            loc_match = False
            loc_score = 5.0

            # Calculate total score
            total_score = cap_score + avail_score + workload_score + loc_score

            reasons = []
            if cap_score > 0:
                reasons.append(f"Specialty {t.specialty} matches {capability_req} ({cap_match})")
            else:
                reasons.append(f"Specialty {t.specialty} does not match required {capability_req}")

            if is_available:
                reasons.append("Status is AVAILABLE")
            else:
                reasons.append(f"Status is {t.status} (Unavailable)")

            reasons.append(f"Active workload: {workload} active work order(s)")
            reasons.append("Location factor: Neutral (no base block assignment in technician directory)")

            if is_excluded:
                reasons.append("Explicitly excluded from candidate pool")

            candidate = ResourceCandidate(
                technician_id=t.id,
                technician_name=t.name,
                specialty=t.specialty,
                status=t.status,
                score=total_score if (is_available and not is_excluded and cap_score > 0) else 0.0,
                capability_match=cap_match,
                active_workload=workload,
                location_match=loc_match,
                excluded=is_excluded,
                reason="; ".join(reasons)
            )
            candidates.append(candidate)

            if is_available and not is_excluded and cap_score > 0:
                if candidate.score > best_score:
                    best_score = candidate.score
                    best_tech = t

        # Sort candidates descending by score
        candidates.sort(key=lambda c: c.score, reverse=True)

        if best_tech and best_score > 0:
            top_cand = next(c for c in candidates if c.technician_id == best_tech.id)
            decision = ResourceDecision(
                selected_technician_id=best_tech.id,
                selected_technician_name=best_tech.name,
                capability_requirement=capability_req,
                score=best_score,
                candidates=candidates,
                excluded_technician_ids=list(excluded_ids),
                decision_reason=(
                    f"Selected {best_tech.name} (Score: {best_score:.1f}/100) — {top_cand.specialty} specialist, "
                    f"{top_cand.status}, active workload: {top_cand.active_workload}."
                ),
                is_feasible=True
            )
        else:
            decision = ResourceDecision(
                selected_technician_id=None,
                selected_technician_name=None,
                capability_requirement=capability_req,
                score=None,
                candidates=candidates,
                excluded_technician_ids=list(excluded_ids),
                decision_reason="NO_FEASIBLE_RESOURCE: No qualified, available technician found meeting operational constraints.",
                is_feasible=False
            )

        return decision

    @classmethod
    def select_technician(cls, db: Session, category: str, exclude_tech_id: Optional[int] = None) -> Optional[Technician]:
        """Backward-compatible helper method."""
        query = db.query(Technician).filter(
            Technician.specialty == category,
            Technician.status == 'AVAILABLE'
        )
        if exclude_tech_id is not None:
            query = query.filter(Technician.id != exclude_tech_id)
        return query.first()


class SchedulingAgent:
    """
    Stage 4B Intelligent Scheduling Agent (with Stage 4B.1 Integrity Fixes).
    Evaluates timetable occupancy, technician commitment, task duration, and incident priority.
    Applies deterministic priority policies:
    - CRITICAL: Immediate intervention window (overrides academic timetable conflicts for safety).
    - HIGH: If active class, schedules immediately in the next feasible post-class window; else immediate/earliest.
    - NORMAL / LOW: Standard maintenance window avoiding room occupancy and technician overlaps.
    """

    @classmethod
    def run(
        cls,
        db: Session,
        incident: Incident,
        priority_assessment: PriorityAssessment,
        context: ContextFactSheet,
        resource_decision: ResourceDecision,
        understanding: Optional[StructuredUnderstanding] = None
    ) -> SchedulingDecision:
        tech_id = resource_decision.selected_technician_id
        room_code = incident.room_code
        priority = incident.priority
        
        now = datetime.now(timezone.utc)
        current_day = now.strftime('%A')
        current_time = now.strftime('%H:%M')
        current_time_min = parse_time_to_minutes(current_time)

        prob_type = understanding.problem_type if understanding else "General"
        duration = get_task_duration_minutes(prob_type, incident.category)

        # Issue 3: No resource must return waiting decision
        if not resource_decision.is_feasible or not tech_id:
            return SchedulingDecision(
                scheduled=False,
                scheduled_start=None,
                scheduled_end=None,
                target_date=current_day,
                room_code=room_code,
                technician_id=None,
                priority=priority,
                conflict_detected=False,
                conflict_reason=None,
                decision_reason="No qualified available technician; work order placed in pending queue for replanning.",
                policy_applied="WAITING_FOR_RESOURCE"
            )

        current_class = context.current_class
        if not current_class and room_code:
            current_class = get_current_timetable_tool(db, room_code, timestamp=now)

        # Issue 2: Detect all active technician commitments (strictly within this tenant organization)
        tech_commitments = []
        org_id = incident.organization_id or 1
        active_tech_wos = db.query(WorkOrder).filter(
            WorkOrder.organization_id == org_id,
            WorkOrder.technician_id == tech_id,
            WorkOrder.status.in_(['ASSIGNED', 'ACCEPTED', 'SCHEDULED', 'IN_PROGRESS']),
            WorkOrder.incident_id != incident.id
        ).all()

        for wo in active_tech_wos:
            if wo.scheduled_for:
                start_m = wo.scheduled_for.hour * 60 + wo.scheduled_for.minute
            else:
                start_m = current_time_min
            end_m = start_m + duration
            tech_commitments.append({
                'work_order_id': wo.id,
                'start_min': start_m,
                'end_min': end_m,
                'status': wo.status
            })

        # Helper to check if [s_min, e_min] overlaps technician commitments
        def has_tech_overlap(s_min: int, e_min: int) -> Optional[Dict[str, Any]]:
            for c in tech_commitments:
                if c['start_min'] < e_min and c['end_min'] > s_min:
                    return c
            return None

        # 1. CRITICAL Priority Policy: Safety Hazard Immediate Intervention
        if priority == "CRITICAL" or priority_assessment.is_emergency:
            policy = "IMMEDIATE_SAFETY_OVERRIDE"
            scheduled_start = "IMMEDIATE"
            scheduled_end = "URGENT"
            conflict_detected = False
            conflict_reason = None
            if current_class:
                conflict_detected = True
                conflict_reason = f"Active class {current_class.get('subject')} in {room_code}"
                decision_reason = (
                    f"CRITICAL safety hazard detected. Emergency safety policy invoked: immediate intervention "
                    f"scheduled despite active room occupancy in {room_code}."
                )
            else:
                decision_reason = "CRITICAL safety priority: Dispatched for immediate emergency intervention."

            return SchedulingDecision(
                scheduled=True,
                scheduled_start=scheduled_start,
                scheduled_end=scheduled_end,
                target_date=current_day,
                room_code=room_code,
                technician_id=tech_id,
                priority=priority,
                conflict_detected=conflict_detected,
                conflict_reason=conflict_reason,
                decision_reason=decision_reason,
                policy_applied=policy
            )

        # 2. Timetable Conflict Handling
        if current_class:
            class_end_str = current_class.get('end_time', current_time)
            class_end_min = parse_time_to_minutes(class_end_str)
            
            if priority == "HIGH":
                policy = "NEXT_FEASIBLE_WINDOW"
                proposed_start_min = class_end_min
                proposed_end_min = proposed_start_min + duration

                # Check technician overlap at proposed slot
                tech_conf = has_tech_overlap(proposed_start_min, proposed_end_min)
                if tech_conf:
                    # Search next slot after technician conflict
                    proposed_start_min = max(proposed_start_min, tech_conf['end_min'])
                    proposed_end_min = proposed_start_min + duration
                    tech_conf_2 = has_tech_overlap(proposed_start_min, proposed_end_min)
                    if tech_conf_2:
                        return SchedulingDecision(
                            scheduled=False,
                            scheduled_start=None,
                            scheduled_end=None,
                            target_date=current_day,
                            room_code=room_code,
                            technician_id=tech_id,
                            priority=priority,
                            conflict_detected=True,
                            conflict_reason=f"Technician #{tech_id} has overlapping commitment on Work Order #{tech_conf['work_order_id']}.",
                            decision_reason=f"Cannot schedule: Technician #{tech_id} is already committed to Work Order #{tech_conf['work_order_id']}.",
                            policy_applied=policy
                        )

                scheduled_start = format_minutes_to_time(proposed_start_min)
                scheduled_end = format_minutes_to_time(proposed_end_min)
                decision_reason = (
                    f"High operational priority: Room {room_code} has active academic session ({current_class.get('subject')}). "
                    f"Scheduled for immediate post-class execution window ({scheduled_start} - {scheduled_end})."
                )
                return SchedulingDecision(
                    scheduled=True,
                    scheduled_start=scheduled_start,
                    scheduled_end=scheduled_end,
                    target_date=current_day,
                    room_code=room_code,
                    technician_id=tech_id,
                    priority=priority,
                    conflict_detected=True,
                    conflict_reason=f"Room {room_code} is occupied by {current_class.get('subject')} until {class_end_str}.",
                    decision_reason=decision_reason,
                    policy_applied=policy
                )
            else:
                policy = "STANDARD_MAINTENANCE_WINDOW"
                proposed_start_min = parse_time_to_minutes("16:05")
                proposed_end_min = proposed_start_min + duration
                tech_conf = has_tech_overlap(proposed_start_min, proposed_end_min)
                if tech_conf:
                    return SchedulingDecision(
                        scheduled=False,
                        scheduled_start=None,
                        scheduled_end=None,
                        target_date=current_day,
                        room_code=room_code,
                        technician_id=tech_id,
                        priority=priority,
                        conflict_detected=True,
                        conflict_reason=f"Technician #{tech_id} has overlapping commitment on Work Order #{tech_conf['work_order_id']}.",
                        decision_reason=f"Cannot schedule: Technician #{tech_id} is already committed during maintenance window.",
                        policy_applied=policy
                    )

                scheduled_start = format_minutes_to_time(proposed_start_min)
                scheduled_end = format_minutes_to_time(proposed_end_min)
                decision_reason = (
                    f"Normal priority: Room {room_code} has active academic class. "
                    f"Scheduled for standard post-academic maintenance window ({scheduled_start} - {scheduled_end})."
                )
                return SchedulingDecision(
                    scheduled=True,
                    scheduled_start=scheduled_start,
                    scheduled_end=scheduled_end,
                    target_date=current_day,
                    room_code=room_code,
                    technician_id=tech_id,
                    priority=priority,
                    conflict_detected=True,
                    conflict_reason=f"Room {room_code} is occupied by {current_class.get('subject')}.",
                    decision_reason=decision_reason,
                    policy_applied=policy
                )

        # 3. Room Free or Unscheduled Room
        policy = "EARLIEST_AVAILABLE"
        proposed_start_min = current_time_min
        proposed_end_min = proposed_start_min + duration

        # Check technician overlap
        tech_conf = has_tech_overlap(proposed_start_min, proposed_end_min)
        if tech_conf:
            # Try shifting after technician conflict
            proposed_start_min = tech_conf['end_min']
            proposed_end_min = proposed_start_min + duration
            tech_conf_2 = has_tech_overlap(proposed_start_min, proposed_end_min)
            if tech_conf_2:
                return SchedulingDecision(
                    scheduled=False,
                    scheduled_start=None,
                    scheduled_end=None,
                    target_date=current_day,
                    room_code=room_code,
                    technician_id=tech_id,
                    priority=priority,
                    conflict_detected=True,
                    conflict_reason=f"Technician #{tech_id} has overlapping commitment on Work Order #{tech_conf['work_order_id']}.",
                    decision_reason=f"Cannot schedule: Technician #{tech_id} is already committed during execution window.",
                    policy_applied=policy
                )

        scheduled_start = format_minutes_to_time(proposed_start_min)
        scheduled_end = format_minutes_to_time(proposed_end_min)
        decision_reason = (
            f"Room {room_code or 'General Campus'} has no active schedule conflict. "
            f"Scheduled for immediate operational execution window ({scheduled_start} - {scheduled_end})."
        )

        return SchedulingDecision(
            scheduled=True,
            scheduled_start=scheduled_start,
            scheduled_end=scheduled_end,
            target_date=current_day,
            room_code=room_code,
            technician_id=tech_id,
            priority=priority,
            conflict_detected=False,
            conflict_reason=None,
            decision_reason=decision_reason,
            policy_applied=policy
        )

    @classmethod
    def create_work_order(
        cls,
        db: Session,
        incident_id: int,
        technician: Optional[Technician],
        scheduled_for: Optional[datetime] = None,
        notes: Optional[str] = None
    ) -> WorkOrder:
        """Create and persist work order with valid scheduled_for timestamp."""
        inc = db.get(Incident, incident_id)
        org_id = inc.organization_id if inc else 1
        if technician:
            technician.status = 'ASSIGNED'
            work = WorkOrder(
                organization_id=org_id,
                incident_id=incident_id,
                technician_id=technician.id,
                status='ASSIGNED',
                scheduled_for=scheduled_for,
                notes=notes or f'Auto-assigned based on {technician.specialty} specialty match'
            )
        else:
            work = WorkOrder(
                organization_id=org_id,
                incident_id=incident_id,
                technician_id=None,
                status='PENDING',
                scheduled_for=None,
                notes=notes or 'Queued: no technician currently available for this category'
            )
        db.add(work)
        db.flush()
        return work


class VerificationAgent:
    """
    Handles resolution verification and restores equipment operational status.
    """

    @classmethod
    def verify_and_restore(cls, db: Session, incident: Incident, notes: Optional[str] = None) -> List[str]:
        incident.status = 'RESOLVED'
        incident.resolution = notes or 'Coordinator verified operational restoration'
        
        restored = []
        # Find fault and execution events for this incident with equipment_id
        events = db.query(AgentEvent).filter(
            AgentEvent.incident_id == incident.id
        ).all()
        
        for ev in events:
            eq_id = ev.detail.get('equipment_id') or ev.detail.get('affected_equipment_id') if ev.detail else None
            if eq_id:
                eq = db.get(Equipment, eq_id)
                if eq and eq.status in ('FAULT', 'UNDER_REPAIR'):
                    eq.status = 'WORKING'
                    eq.last_updated = datetime.now(timezone.utc)
                    if eq.name not in restored:
                        restored.append(eq.name)

        if not restored and incident.room_code:
            room = db.query(Room).filter(Room.code == incident.room_code).first()
            if room:
                for eq in db.query(Equipment).filter(Equipment.room_id == room.id, Equipment.status.in_(['FAULT', 'UNDER_REPAIR'])).all():
                    eq.status = 'WORKING'
                    eq.last_updated = datetime.now(timezone.utc)
                    if eq.name not in restored:
                        restored.append(eq.name)

        return restored

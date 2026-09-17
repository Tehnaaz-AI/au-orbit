"""
AUOrbit Services & Orchestration Layer — Stage 3
Orchestrates:
REPORT -> UNDERSTANDING -> CONTEXT -> PRIORITY -> RESOURCE -> SCHEDULING
Backed by deterministic database tools and authentic AgentEvent logging.
"""

import re
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from .models import Room, Equipment, Technician, Incident, WorkOrder, AgentEvent, TimetableEntry
from .schemas import StructuredUnderstanding, ContextFactSheet, PriorityAssessment
from .agents import (
    UnderstandingAgent,
    ContextAgent,
    PriorityAgent,
    ResourceAgent,
    SchedulingAgent,
    VerificationAgent,
    log_agent_event,
    calculate_datetime_from_slot,
    EQUIPMENT_KEYWORDS
)
from .state_machine import (
    transition_incident,
    transition_work_order,
    INCIDENT_TRANSITIONS,
    WORK_ORDER_TRANSITIONS
)
from .tools import (
    lookup_room_tool,
    find_room_tool,
    get_room_equipment_tool,
    get_current_timetable_tool,
    get_upcoming_timetable_tool,
    get_section_schedule_tool,
    find_available_rooms_tool,
    find_available_technicians_tool,
    find_facilities_tool
)

# =====================================================================
# Deterministic Operational Query / Tool Layer (Backwards Compatible)
# =====================================================================

def lookup_room(db: Session, room_code: str) -> Optional[Room]:
    """Look up a single room by its code (case-insensitive)."""
    if not room_code:
        return None
    normalized = room_code.strip().upper().replace(' ', '-')
    return db.query(Room).filter(Room.code == normalized).first()

def find_room(
    db: Session,
    block: Optional[str] = None,
    floor: Optional[int] = None,
    kind: Optional[str] = None,
    department: Optional[str] = None
) -> List[Room]:
    """Find rooms matching given criteria."""
    query = db.query(Room)
    if block:
        query = query.filter(Room.block == block.upper())
    if floor is not None:
        query = query.filter(Room.floor == floor)
    if kind:
        query = query.filter(Room.kind == kind.upper())
    if department:
        query = query.filter(Room.department.ilike(f"%{department}%"))
    return query.all()

def get_room_equipment(db: Session, room_code: str) -> List[Equipment]:
    """Retrieve all equipment items assigned to a room."""
    room = lookup_room(db, room_code)
    if not room:
        return []
    return db.query(Equipment).filter(Equipment.room_id == room.id).all()

def get_current_timetable(
    db: Session,
    room_code: str,
    timestamp: Optional[datetime] = None,
    day: Optional[str] = None,
    time_str: Optional[str] = None
) -> Optional[TimetableEntry]:
    """Find active class in a room at a given timestamp/day+time."""
    room = lookup_room(db, room_code)
    if not room:
        return None
        
    now = timestamp or datetime.now(timezone.utc)
    check_day = day or now.strftime('%A')
    check_time = time_str or now.strftime('%H:%M')

    return db.query(TimetableEntry).filter(
        TimetableEntry.room_code == room.code,
        TimetableEntry.day == check_day,
        TimetableEntry.start_time <= check_time,
        TimetableEntry.end_time >= check_time
    ).first()

def get_upcoming_timetable(
    db: Session,
    room_code: str,
    timestamp: Optional[datetime] = None,
    day: Optional[str] = None,
    time_str: Optional[str] = None,
    limit: int = 3
) -> List[TimetableEntry]:
    """Find upcoming classes in a room later on the specified day."""
    room = lookup_room(db, room_code)
    if not room:
        return []
        
    now = timestamp or datetime.now(timezone.utc)
    check_day = day or now.strftime('%A')
    check_time = time_str or now.strftime('%H:%M')

    return db.query(TimetableEntry).filter(
        TimetableEntry.room_code == room.code,
        TimetableEntry.day == check_day,
        TimetableEntry.start_time > check_time
    ).order_by(TimetableEntry.start_time.asc()).limit(limit).all()

def get_section_schedule(
    db: Session,
    section: str,
    day: Optional[str] = None
) -> List[TimetableEntry]:
    """Retrieve the schedule for an academic section (e.g. AI-A, AI-F)."""
    norm_sec = section.strip().upper()
    query = db.query(TimetableEntry).filter(TimetableEntry.section == norm_sec)
    if day:
        query = query.filter(TimetableEntry.day == day.capitalize())
    return query.order_by(TimetableEntry.period.asc()).all()

def find_available_rooms(
    db: Session,
    day: str,
    start_time: str,
    end_time: str,
    kind: Optional[str] = None,
    block: Optional[str] = None
) -> List[Room]:
    """Find rooms that have no conflicting timetable entries during a time slot."""
    occupied_codes = db.query(TimetableEntry.room_code).filter(
        TimetableEntry.day == day.capitalize(),
        TimetableEntry.start_time < end_time,
        TimetableEntry.end_time > start_time
    ).distinct().all()
    occupied_set = {r[0] for r in occupied_codes}

    query = db.query(Room).filter(Room.availability == 'AVAILABLE')
    if kind:
        query = query.filter(Room.kind == kind.upper())
    if block:
        query = query.filter(Room.block == block.upper())

    all_matching = query.all()
    return [r for r in all_matching if r.code not in occupied_set]

def find_available_technicians(
    db: Session,
    specialty: Optional[str] = None
) -> List[Technician]:
    """Find technicians who are currently available, optionally matching a specialty."""
    query = db.query(Technician).filter(Technician.status == 'AVAILABLE')
    if specialty:
        query = query.filter(Technician.specialty == specialty.upper())
    return query.all()

def find_facilities(
    db: Session,
    facility_type: Optional[str] = None,
    block: Optional[str] = None
) -> List[Room]:
    """Find campus service facilities (canteens, stationery, sports, administration)."""
    query = db.query(Room).filter(Room.kind.in_(['CANTEEN', 'STATIONERY', 'SPORTS', 'ADMIN', 'EVENT_SPACE', 'AUDITORIUM']))
    if facility_type:
        query = query.filter(Room.kind == facility_type.upper())
    if block:
        query = query.filter(Room.block == block.upper())
    return query.all()

def event(db: Session, incident_id: int, agent: str, action: str, tool: str = None, detail: dict = None, status: str = 'SUCCESS'):
    """Helper function to record an AgentEvent."""
    return log_agent_event(db, incident_id, agent, action, tool, detail, status)

def parse_issue(text: str, supplied_room: str = None, db: Session = None) -> Tuple[Optional[str], str, str, Optional[str]]:
    """
    Backwards compatible parser wrapping UnderstandingAgent deterministic logic.
    Returns: (room_code, category, baseline_priority, matched_equip_name)
    """
    understanding = UnderstandingAgent._deterministic_fallback(text, supplied_room, db)
    return (
        understanding.location,
        understanding.category,
        "HIGH" if understanding.urgency_signal in ("HIGH", "EMERGENCY") else "NORMAL",
        understanding.problem_type if understanding.problem_type != "General" else None
    )


# =====================================================================
# Main Orchestrator Flow: Stage 3 Pipeline
# REPORT -> UNDERSTANDING -> CONTEXT -> PRIORITY -> RESOURCE -> SCHEDULING
# =====================================================================

from .models import Room, Equipment, Technician, Incident, WorkOrder, AgentEvent, TimetableEntry, AgentRun

def orchestrate(
    db: Session,
    reporter: str,
    description: str,
    supplied_room: Optional[str] = None,
    room_code: Optional[str] = None,
    organization_id: int = 1,
    reporter_id: Optional[int] = None
) -> Incident:
    target_room = supplied_room or room_code
    # 1. UNDERSTANDING AGENT
    understanding = UnderstandingAgent.run(db, description, target_room)

    incident = Incident(
        organization_id=organization_id,
        reporter_id=reporter_id,
        reporter=reporter,
        description=description,
        room_code=understanding.location,
        category=understanding.category,
        priority='NORMAL',  # Temporary baseline before Priority Agent evidence assessment
        status='REPORTED',
        created_at=datetime.now(timezone.utc)
    )
    db.add(incident)
    db.flush()

    # Create Initial Execution AgentRun #1
    agent_run = AgentRun(
        organization_id=organization_id,
        incident_id=incident.id,
        run_number=1,
        trigger_reason='initial_report',
        status='RUNNING',
        started_at=datetime.now(timezone.utc)
    )
    db.add(agent_run)
    db.flush()

    # Log Understanding Agent Event
    understand_tool = "gemini_generate_structured" if understanding.source == "gemini" else "rule_based_parser"
    understand_action = (
        f"Interpreted natural language report via Gemini AI: problem={understanding.problem_type}, location={understanding.location or 'unspecified'}, urgency={understanding.urgency_signal}"
        if understanding.source == "gemini"
        else f"Extracted report structure via deterministic fallback: problem={understanding.problem_type}, location={understanding.location or 'unspecified'}, urgency={understanding.urgency_signal}"
    )
    understand_status = 'AMBIGUOUS_LOCATION' if understanding.is_location_ambiguous else 'SUCCESS'

    log_agent_event(
        db=db,
        incident_id=incident.id,
        agent='Understanding Agent',
        action=understand_action,
        tool=understand_tool,
        detail={
            'problem_type': understanding.problem_type,
            'category': understanding.category,
            'location': understanding.location,
            'is_location_ambiguous': understanding.is_location_ambiguous,
            'urgency_signal': understanding.urgency_signal,
            'affected_activity': understanding.affected_activity,
            'confidence': understanding.confidence,
            'reasoning_summary': understanding.reasoning_summary,
            'source': understanding.source
        },
        status=understand_status
    )

    # 2. CONTEXT AGENT
    context_facts = ContextAgent.run(db, understanding)

    if understanding.location and not context_facts.room_verified:
        incident.status = 'TRIAGED'
        incident.priority = 'NORMAL'
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Context Agent',
            action=f"Space '{understanding.location}' not found in campus database; human coordinator review required",
            tool='lookup_room_tool',
            detail={'queried_location': understanding.location, 'verified': False},
            status='NEEDS_INPUT'
        )
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Priority Agent',
            action="Assessed operational priority: NORMAL (Location unverified)",
            tool='assess_priority',
            detail={'priority': 'NORMAL', 'reason': 'Location unverified in campus database'},
            status='SUCCESS'
        )
        agent_run.status = 'COMPLETED'
        agent_run.completed_at = datetime.now(timezone.utc)
        db.commit()
        return incident

    if context_facts.room_verified:
        # Log room verification event
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Context Agent',
            action=f"Verified campus space {context_facts.room_code} ({context_facts.room_kind}, {context_facts.room_department or 'General Campus'})",
            tool='lookup_room_tool',
            detail={
                'room': context_facts.room_code,
                'kind': context_facts.room_kind,
                'department': context_facts.room_department
            },
            status='SUCCESS'
        )

        # Log equipment status event & update fault
        if context_facts.affected_equipment_id:
            eq = db.get(Equipment, context_facts.affected_equipment_id)
            if eq:
                eq.status = 'FAULT'
                eq.last_updated = datetime.now(timezone.utc)
                log_agent_event(
                    db=db,
                    incident_id=incident.id,
                    agent='Context Agent',
                    action=f"Marked equipment '{eq.name}' (ID #{eq.id}) in {context_facts.room_code} as FAULT",
                    tool='get_room_equipment_tool',
                    detail={
                        'equipment_id': eq.id,
                        'equipment_name': eq.name,
                        'room': context_facts.room_code,
                        'status': 'FAULT'
                    },
                    status='SUCCESS'
                )

        # Log timetable check event
        if context_facts.current_class:
            c = context_facts.current_class
            log_agent_event(
                db=db,
                incident_id=incident.id,
                agent='Context Agent',
                action=f"Detected active academic session: {c['subject']} ({c['branch']}-{c['section']}) with {c['faculty']} [{c['day']} {c['start_time']}-{c['end_time']}]",
                tool='get_current_timetable_tool',
                detail=c,
                status='SUCCESS'
            )
        else:
            log_agent_event(
                db=db,
                incident_id=incident.id,
                agent='Context Agent',
                action=f"No active academic class conflict in {context_facts.room_code}",
                tool='get_current_timetable_tool',
                detail={'room': context_facts.room_code, 'active_class': None},
                status='SUCCESS'
            )
    else:
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Context Agent',
            action="Location was unspecified or ambiguous; skipping physical room context tools",
            tool=None,
            detail={'is_location_ambiguous': understanding.is_location_ambiguous},
            status='SKIPPED'
        )

    # 3. PRIORITY AGENT
    priority_assessment = PriorityAgent.run(db, understanding, context_facts)
    incident.priority = priority_assessment.priority
    transition_incident(
        db=db,
        incident=incident,
        new_status='TRIAGED',
        actor='State Machine',
        reason=f"Assessed priority as {priority_assessment.priority}"
    )

    log_agent_event(
        db=db,
        incident_id=incident.id,
        agent='Priority Agent',
        action=f"Assessed operational priority as {priority_assessment.priority}",
        tool='assess_priority',
        detail={
            'priority': priority_assessment.priority,
            'is_timetable_escalated': priority_assessment.is_timetable_escalated,
            'timetable_conflict': priority_assessment.timetable_conflict,
            'timetable_evidence': priority_assessment.timetable_evidence,
            'is_emergency': priority_assessment.is_emergency,
            'confidence': priority_assessment.confidence,
            'reasoning': priority_assessment.reasoning,
            'evidence': priority_assessment.evidence
        },
        status='SUCCESS'
    )

    # 4. RESOURCE AGENT & SCHEDULING AGENT
    resource_decision = ResourceAgent.run(db, incident, understanding, context_facts)
    
    if resource_decision.is_feasible and resource_decision.selected_technician_id:
        tech = db.get(Technician, resource_decision.selected_technician_id)
        scheduling_decision = SchedulingAgent.run(db, incident, priority_assessment, context_facts, resource_decision, understanding)
        
        scheduled_for_dt = calculate_datetime_from_slot(
            scheduling_decision.target_date,
            scheduling_decision.scheduled_start
        ) if scheduling_decision.scheduled else None

        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Resource Agent',
            action=f'Selected qualified specialist {tech.name} (Score: {resource_decision.score:.1f}/100)',
            tool='find_available_technicians_tool',
            detail=resource_decision.model_dump(),
            status='SUCCESS'
        )
        
        sched_detail = scheduling_decision.model_dump()
        sched_detail['scheduled_for'] = scheduled_for_dt.isoformat() if scheduled_for_dt else None

        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Scheduling Agent',
            action=f"Scheduled execution slot: {scheduling_decision.scheduled_start} - {scheduling_decision.scheduled_end} ({scheduling_decision.policy_applied})",
            tool='schedule_work_order',
            detail=sched_detail,
            status='SUCCESS' if scheduling_decision.scheduled else 'CONFLICT'
        )
        
        work = SchedulingAgent.create_work_order(
            db=db,
            incident_id=incident.id,
            technician=tech,
            scheduled_for=scheduled_for_dt,
            notes=f'Auto-assigned to {tech.name}; Slot: {scheduling_decision.scheduled_start} - {scheduling_decision.scheduled_end} ({scheduling_decision.policy_applied})'
        )
        transition_incident(
            db=db,
            incident=incident,
            new_status='ASSIGNED',
            actor='Resolution Agent',
            reason=f'Auto-assigned to {tech.name}'
        )
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Resolution Agent',
            action=f'Created and assigned work order #{work.id} to {tech.name}',
            tool='create_work_order',
            detail={'work_order_id': work.id, 'technician': tech.name, 'status': 'ASSIGNED', 'scheduled_for': scheduled_for_dt.isoformat() if scheduled_for_dt else None},
            status='SUCCESS'
        )
    else:
        scheduling_decision = SchedulingAgent.run(db, incident, priority_assessment, context_facts, resource_decision, understanding)
        
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Resource Agent',
            action='No qualified technician currently available meeting operational constraints',
            tool='find_available_technicians_tool',
            detail=resource_decision.model_dump(),
            status='NO_FEASIBLE_RESOURCE'
        )
        
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Scheduling Agent',
            action='Placed in scheduling queue pending resource availability',
            tool='schedule_work_order',
            detail=scheduling_decision.model_dump(),
            status='WAITING'
        )
        
        work = SchedulingAgent.create_work_order(
            db=db,
            incident_id=incident.id,
            technician=None,
            scheduled_for=None,
            notes=resource_decision.decision_reason
        )
        transition_incident(
            db=db,
            incident=incident,
            new_status='REPLANNING',
            actor='Scheduling Agent',
            reason=f'Queued: {resource_decision.decision_reason}'
        )

    agent_run.status = 'COMPLETED'
    agent_run.completed_at = datetime.now(timezone.utc)
    db.commit()
    return incident

def replan(db: Session, incident: Incident, exclude_tech_id: int = None):
    """Dynamically reassign incident to another technician upon rejection using Stage 4B reasoning."""
    if incident.status != 'REPLANNING':
        transition_incident(
            db=db,
            incident=incident,
            new_status='REPLANNING',
            actor='Orchestrator',
            reason='Entering replanning cycle'
        )

    # Gather all rejected tech IDs for this incident
    rejected_wos = db.query(WorkOrder).filter(
        WorkOrder.incident_id == incident.id,
        WorkOrder.status == 'REJECTED'
    ).all()
    excluded_ids = {w.technician_id for w in rejected_wos if w.technician_id is not None}
    if exclude_tech_id:
        excluded_ids.add(exclude_tech_id)

    # Reconstruct understanding, context, and priority assessments
    understanding = UnderstandingAgent.run(db, incident.description, incident.room_code)
    context_facts = ContextAgent.run(db, understanding)
    priority_assessment = PriorityAgent.run(db, understanding, context_facts)

    resource_decision = ResourceAgent.run(
        db=db,
        incident=incident,
        understanding=understanding,
        context=context_facts,
        exclude_tech_ids=list(excluded_ids)
    )

    if resource_decision.is_feasible and resource_decision.selected_technician_id:
        next_tech = db.get(Technician, resource_decision.selected_technician_id)
        scheduling_decision = SchedulingAgent.run(db, incident, priority_assessment, context_facts, resource_decision, understanding)

        scheduled_for_dt = calculate_datetime_from_slot(
            scheduling_decision.target_date,
            scheduling_decision.scheduled_start
        ) if scheduling_decision.scheduled else None

        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Resource Agent',
            action=f'Selected qualified specialist {next_tech.name} (Score: {resource_decision.score:.1f}/100)',
            tool='find_available_technicians_tool',
            detail=resource_decision.model_dump(),
            status='SUCCESS'
        )
        
        sched_detail = scheduling_decision.model_dump()
        sched_detail['scheduled_for'] = scheduled_for_dt.isoformat() if scheduled_for_dt else None

        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Scheduling Agent',
            action=f"Replanned execution slot: {scheduling_decision.scheduled_start} - {scheduling_decision.scheduled_end} ({scheduling_decision.policy_applied})",
            tool='schedule_work_order',
            detail=sched_detail,
            status='SUCCESS' if scheduling_decision.scheduled else 'CONFLICT'
        )

        work = SchedulingAgent.create_work_order(
            db=db,
            incident_id=incident.id,
            technician=next_tech,
            scheduled_for=scheduled_for_dt,
            notes=f'Dynamically reassigned to {next_tech.name}; Slot: {scheduling_decision.scheduled_start} - {scheduling_decision.scheduled_end}'
        )
        transition_incident(
            db=db,
            incident=incident,
            new_status='ASSIGNED',
            actor='Orchestrator',
            reason=f'Dynamically reassigned to {next_tech.name}'
        )
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Orchestrator',
            action=f'Dynamically reassigned incident #{incident.id} to qualified technician {next_tech.name}',
            tool='create_work_order',
            detail={'new_technician': next_tech.name, 'specialty': next_tech.specialty, 'work_order_id': work.id, 'scheduled_for': scheduled_for_dt.isoformat() if scheduled_for_dt else None},
            status='SUCCESS'
        )
    else:
        scheduling_decision = SchedulingAgent.run(db, incident, priority_assessment, context_facts, resource_decision, understanding)
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Resource Agent',
            action='Replanning found no available qualified technicians meeting operational constraints',
            tool='find_available_technicians_tool',
            detail=resource_decision.model_dump(),
            status='NO_FEASIBLE_RESOURCE'
        )
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Scheduling Agent',
            action='Incident placed in scheduling queue pending resource availability',
            tool='schedule_work_order',
            detail=scheduling_decision.model_dump(),
            status='WAITING'
        )
        work = SchedulingAgent.create_work_order(
            db=db,
            incident_id=incident.id,
            technician=None,
            scheduled_for=None,
            notes=f'Queued: {resource_decision.decision_reason}'
        )
        # Incident is already in REPLANNING, record orchestrator event
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent='Orchestrator',
            action=f'Replanning found no available {incident.category} technicians; incident placed in scheduling queue',
            tool='create_work_order',
            detail={'specialty': incident.category, 'work_order_id': work.id},
            status='WAITING'
        )
    db.commit()


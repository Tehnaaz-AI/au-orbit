"""
AUOrbit Operational State Machine — Stage 4A
Centralized state machine and validation for Incidents and Work Orders.
Enforces valid lifecycle transitions, technician state consistency, and authentic audit logging.
"""

from typing import Optional, Dict, Any, List
from fastapi import HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from .models import Incident, WorkOrder, Technician, AgentEvent

# =====================================================================
# Canonical Lifecycle Transition Graphs
# =====================================================================

INCIDENT_TRANSITIONS: Dict[str, List[str]] = {
    "REPORTED": ["TRIAGED"],
    "TRIAGED": ["ASSIGNED", "SCHEDULED", "REPLANNING"],
    "ASSIGNED": ["SCHEDULED", "IN_PROGRESS", "REPLANNING"],
    "SCHEDULED": ["ASSIGNED", "IN_PROGRESS", "REPLANNING"],
    "IN_PROGRESS": ["AWAITING_VERIFICATION", "REPLANNING"],
    "AWAITING_VERIFICATION": ["RESOLVED", "REOPENED"],
    "REOPENED": ["REPLANNING", "ASSIGNED", "SCHEDULED"],
    "REPLANNING": ["ASSIGNED", "SCHEDULED"],
    "RESOLVED": ["CLOSED", "REOPENED"],
    "CLOSED": ["REOPENED"]
}

WORK_ORDER_TRANSITIONS: Dict[str, List[str]] = {
    "PENDING": ["ASSIGNED", "SCHEDULED", "REJECTED", "CANCELLED"],
    "ASSIGNED": ["ACCEPTED", "SCHEDULED", "IN_PROGRESS", "REJECTED", "CANCELLED"],
    "ACCEPTED": ["SCHEDULED", "IN_PROGRESS", "REJECTED", "CANCELLED"],
    "SCHEDULED": ["ASSIGNED", "IN_PROGRESS", "REJECTED", "CANCELLED"],
    "IN_PROGRESS": ["AWAITING_VERIFICATION", "COMPLETED", "REJECTED", "CANCELLED"],
    "AWAITING_VERIFICATION": ["COMPLETED", "CANCELLED"],
    "REJECTED": [],      # Terminal for this work order record
    "COMPLETED": [],     # Terminal for this work order record
    "CANCELLED": []      # Terminal for this work order record
}


def log_transition_event(
    db: Session,
    incident_id: int,
    agent: str,
    action: str,
    tool: str = "state_machine",
    detail: Optional[Dict[str, Any]] = None,
    status: str = "SUCCESS"
) -> AgentEvent:
    """Record an authentic state transition event in the database."""
    from .agents import log_agent_event
    return log_agent_event(
        db=db,
        incident_id=incident_id,
        agent=agent,
        action=action,
        tool=tool,
        detail=detail or {},
        status=status
    )


def transition_incident(
    db: Session,
    incident: Incident,
    new_status: str,
    actor: str = "State Machine",
    reason: Optional[str] = None,
    detail: Optional[Dict[str, Any]] = None
) -> Incident:
    """
    Validate and execute a state transition on an Incident.
    Rejects invalid transitions with HTTP 400.
    """
    current_status = incident.status
    if current_status == new_status:
        return incident

    allowed = INCIDENT_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid incident state transition: Cannot transition incident #{incident.id} from '{current_status}' to '{new_status}'. Allowed next states: {allowed}"
        )

    incident.status = new_status
    incident.updated_at = datetime.now(timezone.utc)
    
    event_detail = {
        "previous_status": current_status,
        "new_status": new_status,
        "reason": reason
    }
    if detail:
        event_detail.update(detail)

    log_transition_event(
        db=db,
        incident_id=incident.id,
        agent=actor,
        action=f"Transitioned incident #{incident.id} from {current_status} to {new_status}" + (f": {reason}" if reason else ""),
        tool="transition_incident",
        detail=event_detail,
        status="SUCCESS"
    )
    db.flush()
    return incident


def transition_work_order(
    db: Session,
    work_order: WorkOrder,
    new_status: str,
    actor: str = "State Machine",
    reason: Optional[str] = None,
    detail: Optional[Dict[str, Any]] = None
) -> WorkOrder:
    """
    Validate and execute a state transition on a WorkOrder.
    Rejects invalid transitions with HTTP 400.
    """
    current_status = work_order.status
    if current_status == new_status:
        return work_order

    allowed = WORK_ORDER_TRANSITIONS.get(current_status, [])
    if new_status not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid work order state transition: Cannot transition work order #{work_order.id} from '{current_status}' to '{new_status}'. Allowed next states: {allowed}"
        )

    work_order.status = new_status
    
    event_detail = {
        "work_order_id": work_order.id,
        "previous_status": current_status,
        "new_status": new_status,
        "reason": reason
    }
    if detail:
        event_detail.update(detail)

    log_transition_event(
        db=db,
        incident_id=work_order.incident_id,
        agent=actor,
        action=f"Transitioned work order #{work_order.id} from {current_status} to {new_status}" + (f": {reason}" if reason else ""),
        tool="transition_work_order",
        detail=event_detail,
        status="SUCCESS"
    )
    db.flush()
    return work_order

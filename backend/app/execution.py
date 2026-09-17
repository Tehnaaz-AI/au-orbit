"""
AUOrbit — Stage 4C.1 Execution + Observation Engine

Handles controlled work-order execution and live operational observation:
    SCHEDULED -> IN_PROGRESS -> AWAITING_VERIFICATION

Guarantees:
1. Transaction-safe state updates (atomic rollback on failure).
2. Strict equipment targeting (only mutates specifically identified affected equipment).
3. Technician concurrency protection (prevents assigning to a technician already WORKING).
4. Authentic AgentEvents for EXECUTE and OBSERVE.
5. Strict scope boundary: no autonomous loops, timers, or automatic verification.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import Incident, WorkOrder, Technician, Equipment, Room, AgentEvent
from .state_machine import transition_incident, transition_work_order
from .agents import log_agent_event, EQUIPMENT_KEYWORDS


class ObservationAgent:
    """
    Stage 4C.1 Read-Only Observation Agent.
    Queries the actual persisted database state after execution actions
    and records an authentic, read-only OBSERVE AgentEvent snapshot.
    """

    @classmethod
    def observe(
        cls,
        db: Session,
        incident_id: int,
        work_order_id: int,
        affected_equipment_id: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Inspect live operational state from DB without mutating any entities.
        Logs an authentic OBSERVE AgentEvent and returns the state snapshot.
        """
        incident = db.get(Incident, incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail=f"Incident #{incident_id} not found during observation")

        work_order = db.get(WorkOrder, work_order_id)
        if not work_order:
            raise HTTPException(status_code=404, detail=f"WorkOrder #{work_order_id} not found during observation")

        technician = db.get(Technician, work_order.technician_id) if work_order.technician_id else None
        
        # Query room and equipment state
        room = db.query(Room).filter(Room.code == incident.room_code).first() if incident.room_code else None
        
        eq_state = None
        eq_name = None
        if affected_equipment_id:
            eq = db.get(Equipment, affected_equipment_id)
            if eq:
                eq_state = eq.status
                eq_name = eq.name
        elif room:
            # Check if any equipment in room is UNDER_REPAIR or FAULT
            active_eq = db.query(Equipment).filter(
                Equipment.room_id == room.id,
                Equipment.status.in_(['UNDER_REPAIR', 'FAULT'])
            ).first()
            if active_eq:
                eq_state = active_eq.status
                eq_name = active_eq.name
                affected_equipment_id = active_eq.id

        now_utc = datetime.now(timezone.utc)
        snapshot = {
            "incident_id": incident.id,
            "incident_state": incident.status,
            "work_order_id": work_order.id,
            "work_order_state": work_order.status,
            "technician_id": technician.id if technician else None,
            "technician_name": technician.name if technician else None,
            "technician_state": technician.status if technician else None,
            "room_code": incident.room_code,
            "room_availability": room.availability if room else None,
            "affected_equipment_id": affected_equipment_id,
            "affected_equipment_name": eq_name,
            "affected_equipment_state": eq_state,
            "scheduled_for": work_order.scheduled_for.isoformat() if work_order.scheduled_for else None,
            "actual_started_at": work_order.started_at.isoformat() if work_order.started_at else None,
            "observed_at": now_utc.isoformat()
        }

        # Log authentic OBSERVE AgentEvent
        log_agent_event(
            db=db,
            incident_id=incident.id,
            agent="Observation Agent",
            action=f"Observed live operational state: Incident={incident.status}, WorkOrder={work_order.status}, Technician={technician.name if technician else 'None'} ({technician.status if technician else 'N/A'})",
            tool="observe_state",
            detail=snapshot,
            status="SUCCESS"
        )
        return snapshot


class ExecutionAgent:
    """
    Stage 4C.1 Controlled Execution Engine.
    Executes assigned / scheduled work orders on explicit trigger, updating
    work order, incident, technician, and targeted equipment state transactionally.
    """

    @classmethod
    def _find_targeted_affected_equipment(
        cls,
        db: Session,
        incident: Incident
    ) -> Optional[Equipment]:
        """
        Strictly identify the specifically affected equipment for this incident.
        Uses prior Context Agent events where equipment was marked FAULT.
        Never mutates equipment for non-equipment incidents or arbitrary equipment in room.
        """
        if not incident.room_code:
            return None

        room = db.query(Room).filter(Room.code == incident.room_code).first()
        if not room:
            return None

        # Check prior Context Agent event for explicit equipment_id
        events = db.query(AgentEvent).filter(
            AgentEvent.incident_id == incident.id,
            AgentEvent.agent == "Context Agent"
        ).all()
        for ev in events:
            if ev.detail and "equipment_id" in ev.detail and ev.detail["equipment_id"]:
                eq = db.get(Equipment, ev.detail["equipment_id"])
                if eq and eq.room_id == room.id and eq.status in ("FAULT", "UNDER_REPAIR"):
                    return eq

        return None

    @classmethod
    def start_work_order(
        cls,
        db: Session,
        work_order_id: int,
        technician_id: Optional[int] = None
    ) -> Tuple[WorkOrder, Incident]:
        """
        Start execution of a work order:
            SCHEDULED / ASSIGNED -> IN_PROGRESS
        
        Validations:
        1. Work order exists
        2. Work order has an assigned technician
        3. Assigned technician exists
        4. Technician consistency (if technician_id provided)
        5. Work order is in a startable state
        6. Technician is not unavailable / not already WORKING on another job
        7. Incident is not closed / resolved / cancelled
        8. Valid state transitions through state machine
        """
        try:
            # 1. Look up work order
            work_order = db.get(WorkOrder, work_order_id)
            if not work_order:
                raise HTTPException(status_code=404, detail="Work order not found")

            # 2. Look up incident
            incident = db.get(Incident, work_order.incident_id)
            if not incident:
                raise HTTPException(status_code=404, detail="Associated incident not found")

            # 3. Verify technician assignment
            if not work_order.technician_id:
                raise HTTPException(
                    status_code=400,
                    detail="Cannot start an unassigned work order. A technician must be assigned first."
                )

            # 4. Verify technician exists
            technician = db.get(Technician, work_order.technician_id)
            if not technician:
                raise HTTPException(status_code=400, detail="Assigned technician does not exist in database.")

            # 5. Technician consistency check (if provided in payload)
            if technician_id is not None and technician_id != work_order.technician_id:
                raise HTTPException(
                    status_code=403,
                    detail=f"Technician mismatch: Work order #{work_order.id} is assigned to technician #{work_order.technician_id} ({technician.name}), cannot be started by technician #{technician_id}."
                )

            # 6. Check incident status
            if incident.status in ("CLOSED", "RESOLVED", "CANCELLED"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot start work order for incident in '{incident.status}' state."
                )

            # 7. Check work order startable state
            if work_order.status == "IN_PROGRESS":
                raise HTTPException(status_code=400, detail="Work order is already in progress.")
            if work_order.status in ("REJECTED", "CANCELLED"):
                raise HTTPException(status_code=400, detail=f"Cannot start a {work_order.status.lower()} work order.")
            if work_order.status in ("AWAITING_VERIFICATION", "COMPLETED"):
                raise HTTPException(status_code=400, detail=f"Cannot start work order: already completed (status: {work_order.status}).")
            if work_order.status not in ("SCHEDULED", "ASSIGNED", "ACCEPTED"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Work order cannot be started from status '{work_order.status}'. Must be SCHEDULED, ASSIGNED, or ACCEPTED."
                )

            # 8. Check technician availability and prevent double-booking
            if technician.status == "OFF_DUTY":
                raise HTTPException(
                    status_code=400,
                    detail=f"Technician {technician.name} is currently OFF_DUTY and cannot start work."
                )

            # Concurrency check: verify technician is not already working on another active job
            active_working_wo = db.query(WorkOrder).filter(
                WorkOrder.technician_id == technician.id,
                WorkOrder.status == "IN_PROGRESS",
                WorkOrder.id != work_order.id
            ).first()
            if active_working_wo or technician.status == "WORKING":
                raise HTTPException(
                    status_code=400,
                    detail=f"Technician {technician.name} is already WORKING on another active work order (WorkOrder #{active_working_wo.id if active_working_wo else 'active'}). Concurrency conflict prevented."
                )

            prev_wo_status = work_order.status
            prev_inc_status = incident.status
            now_utc = datetime.now(timezone.utc)

            # 9. State transitions through centralized state machine
            transition_work_order(
                db=db,
                work_order=work_order,
                new_status="IN_PROGRESS",
                actor="Execution Agent",
                reason=f"Technician {technician.name} started execution"
            )

            # Update technician status to WORKING
            technician.status = "WORKING"

            # Transition incident to IN_PROGRESS
            transition_incident(
                db=db,
                incident=incident,
                new_status="IN_PROGRESS",
                actor="Execution Agent",
                reason=f"Technician {technician.name} on site and commenced physical work"
            )

            # 10. Record actual execution timestamp
            work_order.started_at = now_utc

            # 11. Targeted equipment update (FAULT -> UNDER_REPAIR)
            affected_eq = cls._find_targeted_affected_equipment(db, incident)
            affected_eq_id = None
            if affected_eq and affected_eq.status == "FAULT":
                affected_eq_id = affected_eq.id
                affected_eq.status = "UNDER_REPAIR"
                affected_eq.last_updated = now_utc

            # 12. Record authentic EXECUTE AgentEvent
            execute_detail = {
                "work_order_id": work_order.id,
                "incident_id": incident.id,
                "technician_id": technician.id,
                "technician_name": technician.name,
                "scheduled_for": work_order.scheduled_for.isoformat() if work_order.scheduled_for else None,
                "started_at": work_order.started_at.isoformat(),
                "previous_work_order_state": prev_wo_status,
                "new_work_order_state": work_order.status,
                "previous_incident_state": prev_inc_status,
                "new_incident_state": incident.status,
                "affected_equipment_id": affected_eq_id,
                "affected_equipment_name": affected_eq.name if affected_eq else None,
                "room_code": incident.room_code
            }

            log_agent_event(
                db=db,
                incident_id=incident.id,
                agent="Execution Agent",
                action=f"Technician {technician.name} commenced physical execution on work order #{work_order.id}",
                tool="start_work_order",
                detail=execute_detail,
                status="SUCCESS"
            )

            # 13. Trigger read-only live observation
            ObservationAgent.observe(
                db=db,
                incident_id=incident.id,
                work_order_id=work_order.id,
                affected_equipment_id=affected_eq_id
            )

            db.commit()
            return work_order, incident

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Execution start failed unexpectedly: {str(e)}"
            )

    @classmethod
    def complete_work_order(
        cls,
        db: Session,
        work_order_id: int,
        notes: Optional[str] = None,
        technician_id: Optional[int] = None
    ) -> Tuple[WorkOrder, Incident]:
        """
        Complete physical execution of a work order:
            IN_PROGRESS -> AWAITING_VERIFICATION
        
        Validations:
        1. Work order exists and is in IN_PROGRESS state
        2. Incident exists and is in IN_PROGRESS state
        3. Assigned technician exists and matches provided identity
        4. Rejects invalid states (SCHEDULED, AWAITING_VERIFICATION, COMPLETED)
        5. Technician returns to AVAILABLE
        6. Affected equipment remains UNDER_REPAIR (does NOT resolve/restore yet)
        7. Incident enters AWAITING_VERIFICATION (never RESOLVED or CLOSED)
        """
        try:
            # 1. Look up work order
            work_order = db.get(WorkOrder, work_order_id)
            if not work_order:
                raise HTTPException(status_code=404, detail="Work order not found")

            # 2. Look up incident
            incident = db.get(Incident, work_order.incident_id)
            if not incident:
                raise HTTPException(status_code=404, detail="Associated incident not found")

            # 3. Verify technician
            if not work_order.technician_id:
                raise HTTPException(status_code=400, detail="Cannot complete an unassigned work order.")

            technician = db.get(Technician, work_order.technician_id)
            if not technician:
                raise HTTPException(status_code=400, detail="Assigned technician not found in database.")

            # 4. Technician consistency check
            if technician_id is not None and technician_id != work_order.technician_id:
                raise HTTPException(
                    status_code=403,
                    detail=f"Technician mismatch: Work order #{work_order.id} is assigned to technician #{work_order.technician_id} ({technician.name}), cannot be completed by technician #{technician_id}."
                )

            # 5. Check work order state
            if work_order.status in ("AWAITING_VERIFICATION", "COMPLETED"):
                raise HTTPException(status_code=400, detail="Work order is already completed / awaiting verification.")
            if work_order.status in ("SCHEDULED", "ASSIGNED", "ACCEPTED"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot complete work order before starting it (current status: {work_order.status})."
                )
            if work_order.status != "IN_PROGRESS":
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot complete work order with status '{work_order.status}'."
                )

            prev_wo_status = work_order.status
            prev_inc_status = incident.status

            # 6. State transitions through centralized state machine
            transition_work_order(
                db=db,
                work_order=work_order,
                new_status="AWAITING_VERIFICATION",
                actor="Execution Agent",
                reason=notes or "Technician completed physical task; submitted for verification"
            )

            # Technician returns to AVAILABLE
            technician.status = "AVAILABLE"

            # Incident moves to AWAITING_VERIFICATION (NOT RESOLVED)
            transition_incident(
                db=db,
                incident=incident,
                new_status="AWAITING_VERIFICATION",
                actor="Execution Agent",
                reason=notes or "Physical work completed; awaiting verification"
            )

            # 7. Equipment remains in UNDER_REPAIR (Verification happens in Stage 4C.2)
            affected_eq = cls._find_targeted_affected_equipment(db, incident)

            # 8. Record authentic EXECUTE AgentEvent
            complete_detail = {
                "work_order_id": work_order.id,
                "incident_id": incident.id,
                "technician_id": technician.id,
                "technician_name": technician.name,
                "notes": notes,
                "previous_work_order_state": prev_wo_status,
                "new_work_order_state": work_order.status,
                "previous_incident_state": prev_inc_status,
                "new_incident_state": incident.status,
                "equipment_state": affected_eq.status if affected_eq else "N/A"
            }

            log_agent_event(
                db=db,
                incident_id=incident.id,
                agent="Execution Agent",
                action=f"Technician {technician.name} completed physical work on work order #{work_order.id}; submitted for verification",
                tool="complete_work_order",
                detail=complete_detail,
                status="SUCCESS"
            )

            # 9. Trigger read-only live observation
            ObservationAgent.observe(
                db=db,
                incident_id=incident.id,
                work_order_id=work_order.id,
                affected_equipment_id=affected_eq.id if affected_eq else None
            )

            db.commit()
            return work_order, incident

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Execution completion failed unexpectedly: {str(e)}"
            )

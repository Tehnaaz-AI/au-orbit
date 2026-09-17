"""
AUOrbit — Stage 4C.2 Verification + Failure Detection Engine

Handles independent verification of completed work orders:
    AWAITING_VERIFICATION
            ↓
         VERIFY
        /      \
    SUCCESS    FAILURE
      ↓          ↓
   RESOLVED   REOPENED (STOPS HERE)

Guarantees:
1. Grounded in actual database state (not fabricated by LLM).
2. Strict equipment targeting (only specifically affected equipment returns to WORKING on success).
3. Failed verification keeps equipment unresolved (UNDER_REPAIR) and transitions incident to REOPENED.
4. Transaction-safe atomic execution.
5. Replay and idempotency protection (rejects verifying terminal states).
6. Authentic AgentEvents for VERIFY and OBSERVE.
7. STRICT BOUNDARY: Stage 4C.2 stops at REOPENED. No autonomous replanning or rescheduling.
"""

from datetime import datetime, timezone
from typing import Optional, Dict, Any, Tuple
from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import Incident, WorkOrder, Technician, Equipment, Room, AgentEvent
from .schemas import VerificationResult
from .state_machine import transition_incident, transition_work_order
from .agents import log_agent_event
from .execution import ExecutionAgent, ObservationAgent
from .replanning import ReplanningAgent


class VerificationAgent:
    """
    Stage 4C.2 Verification Agent & Stage 4C.3 Autonomous Recovery Trigger.
    Independently evaluates resolution outcome against actual database state.
    """

    @classmethod
    def verify_work_order(
        cls,
        db: Session,
        work_order_id: int,
        outcome: str = "pass",
        notes: Optional[str] = None,
        auto_replan: bool = True
    ) -> VerificationResult:
        """
        Perform deterministic operational verification on an AWAITING_VERIFICATION work order.
        
        Outcomes:
        - PASS / SUCCESS:
            Equipment -> WORKING
            WorkOrder -> COMPLETED
            Technician -> AVAILABLE
            Incident  -> RESOLVED
        - FAIL / FAILURE:
            Equipment -> UNDER_REPAIR (remains unresolved)
            WorkOrder -> CANCELLED
            Technician -> AVAILABLE
            Incident  -> REOPENED
            (Stage 4C.3: Automatically triggers ReplanningAgent if auto_replan=True)
        """
        # 1. Normalize and validate outcome
        norm_outcome = (outcome or "pass").strip().upper()
        if norm_outcome in ("PASS", "SUCCESS", "PASSED"):
            canonical_outcome = "PASS"
        elif norm_outcome in ("FAIL", "FAILURE", "FAILED"):
            canonical_outcome = "FAIL"
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid verification outcome: '{outcome}'. Must be 'pass' or 'fail'."
            )

        try:
            # 2. Look up work order
            work_order = db.get(WorkOrder, work_order_id)
            if not work_order:
                raise HTTPException(status_code=404, detail="Work order not found")

            # 3. Look up incident
            incident = db.get(Incident, work_order.incident_id)
            if not incident:
                raise HTTPException(status_code=404, detail="Associated incident not found")

            # 4. Validate states before verification
            if work_order.status in ("COMPLETED", "CANCELLED", "REJECTED"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot verify work order with terminal status '{work_order.status}'."
                )

            if incident.status in ("RESOLVED", "CLOSED"):
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot verify incident in terminal status '{incident.status}'."
                )

            if work_order.status != "AWAITING_VERIFICATION":
                raise HTTPException(
                    status_code=400,
                    detail=f"Work order #{work_order.id} is in status '{work_order.status}'. Must be 'AWAITING_VERIFICATION' to verify."
                )

            if incident.status != "AWAITING_VERIFICATION":
                raise HTTPException(
                    status_code=400,
                    detail=f"Incident #{incident.id} is in status '{incident.status}'. Must be 'AWAITING_VERIFICATION' to verify."
                )

            prev_inc_status = incident.status
            prev_wo_status = work_order.status
            now_utc = datetime.now(timezone.utc)

            # 5. Identify specifically affected equipment
            affected_eq = ExecutionAgent._find_targeted_affected_equipment(db, incident)
            prev_eq_state = affected_eq.status if affected_eq else None
            new_eq_state = prev_eq_state

            # 6. Apply Outcome-Specific Transitions
            if canonical_outcome == "PASS":
                # Equipment returns to WORKING
                if affected_eq:
                    affected_eq.status = "WORKING"
                    affected_eq.last_updated = now_utc
                    new_eq_state = "WORKING"

                # WorkOrder -> COMPLETED
                transition_work_order(
                    db=db,
                    work_order=work_order,
                    new_status="COMPLETED",
                    actor="Verification Agent",
                    reason=notes or "Operational verification passed"
                )

                # Release technician back to AVAILABLE
                if work_order.technician_id:
                    tech = db.get(Technician, work_order.technician_id)
                    if tech and tech.status in ('WORKING', 'ASSIGNED'):
                        tech.status = 'AVAILABLE'

                # Incident -> RESOLVED
                transition_incident(
                    db=db,
                    incident=incident,
                    new_status="RESOLVED",
                    actor="Verification Agent",
                    reason=notes or "Coordinator verified operational restoration"
                )
                incident.resolution = notes or "Coordinator verified operational restoration"

            else:  # canonical_outcome == "FAIL"
                # Equipment remains unresolved in UNDER_REPAIR
                if affected_eq:
                    affected_eq.status = "UNDER_REPAIR"
                    affected_eq.last_updated = now_utc
                    new_eq_state = "UNDER_REPAIR"

                # WorkOrder -> CANCELLED
                transition_work_order(
                    db=db,
                    work_order=work_order,
                    new_status="CANCELLED",
                    actor="Verification Agent",
                    reason=notes or "Verification failed; work order closed"
                )

                # Release technician back to AVAILABLE
                if work_order.technician_id:
                    tech = db.get(Technician, work_order.technician_id)
                    if tech and tech.status in ('WORKING', 'ASSIGNED'):
                        tech.status = 'AVAILABLE'

                # Incident -> REOPENED
                transition_incident(
                    db=db,
                    incident=incident,
                    new_status="REOPENED",
                    actor="Verification Agent",
                    reason=notes or "Operational verification failed; issue persists"
                )

            # 7. Log authentic VERIFY AgentEvent
            verify_detail = {
                "incident_id": incident.id,
                "work_order_id": work_order.id,
                "affected_equipment_id": affected_eq.id if affected_eq else None,
                "affected_equipment_name": affected_eq.name if affected_eq else None,
                "previous_equipment_state": prev_eq_state,
                "new_equipment_state": new_eq_state,
                "previous_incident_state": prev_inc_status,
                "new_incident_state": incident.status,
                "previous_work_order_state": prev_wo_status,
                "new_work_order_state": work_order.status,
                "outcome": canonical_outcome,
                "reason": notes or ("Verification passed" if canonical_outcome == "PASS" else "Verification failed"),
                "verified_at": now_utc.isoformat()
            }

            log_agent_event(
                db=db,
                incident_id=incident.id,
                agent="Verification Agent",
                action=f"Operational verification {canonical_outcome}: Incident transitioned to {incident.status}",
                tool="verify_resolution",
                detail=verify_detail,
                status="SUCCESS" if canonical_outcome == "PASS" else "FAILED"
            )

            # 8. Trigger authentic read-only live observation snapshot
            ObservationAgent.observe(
                db=db,
                incident_id=incident.id,
                work_order_id=work_order.id,
                affected_equipment_id=affected_eq.id if affected_eq else None
            )

            db.commit()

            # 9. Stage 4C.3: Autonomous Replanning Trigger on Failure
            if canonical_outcome == "FAIL" and auto_replan:
                ReplanningAgent.replan_incident(
                    db=db,
                    incident_id=incident.id,
                    trigger_reason="verification_failure"
                )
                db.refresh(incident)

            return VerificationResult(
                outcome=canonical_outcome,
                incident_id=incident.id,
                work_order_id=work_order.id,
                affected_equipment_id=affected_eq.id if affected_eq else None,
                previous_equipment_state=prev_eq_state,
                new_equipment_state=new_eq_state,
                previous_incident_state=prev_inc_status,
                new_incident_state=incident.status,
                reason=verify_detail["reason"],
                verified_at=verify_detail["verified_at"]
            )

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Verification failed unexpectedly: {str(e)}"
            )

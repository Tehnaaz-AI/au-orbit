"""
AUOrbit — Stage 4C.3 Autonomous Replanning Engine

Provides bounded, authentic autonomous recovery after verification failure or technician rejection:
    REOPENED
       ↓
    REPLANNING
       ↓
    RESOURCE (excludes all prior failed/rejected technicians from DB history)
       ↓
    SCHEDULE (evaluates timetable occupancy and active commitments)
       ↓
    CREATE NEW WORK ORDER (new database record, old remains CANCELLED)
       ↓
    SCHEDULED

Guarantees:
1. Strictly bounded retries (MAX_REPLAN_ATTEMPTS = 3).
2. Idempotency & duplicate replan protection (never creates multiple replacement work orders).
3. Previous failed/rejected technicians are gathered from actual DB history and excluded.
4. Old failed WorkOrder remains permanently CANCELLED in DB history.
5. Transaction-safe atomic execution.
6. Authentic AgentEvents for REPLAN, RESOURCE, SCHEDULE, and OBSERVE.
7. Controlled execution: Does NOT automatically start or complete the new work order.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Set
from fastapi import HTTPException
from sqlalchemy.orm import Session

from .models import Incident, WorkOrder, Technician, Equipment, Room, AgentEvent, AgentRun
from .schemas import ReplanResult
from .state_machine import transition_incident, transition_work_order
from .agents import (
    UnderstandingAgent,
    ContextAgent,
    PriorityAgent,
    ResourceAgent,
    SchedulingAgent,
    calculate_datetime_from_slot,
    log_agent_event
)
from .execution import ExecutionAgent, ObservationAgent

MAX_REPLAN_ATTEMPTS: int = 3


class ReplanningAgent:
    """
    Stage 4C.3 Autonomous Replanning Agent.
    Manages autonomous operational recovery cycles while enforcing strict bounded retry limits,
    candidate exclusion, timetable feasibility, and transaction safety.
    """

    MAX_REPLAN_ATTEMPTS: int = MAX_REPLAN_ATTEMPTS

    @classmethod
    def get_excluded_technician_ids(cls, db: Session, incident_id: int) -> Set[int]:
        """
        Query actual database history for this incident.
        Collects technician IDs associated with CANCELLED, REJECTED, or failed work orders.
        """
        wos = db.query(WorkOrder).filter(
            WorkOrder.incident_id == incident_id,
            WorkOrder.technician_id.isnot(None)
        ).all()
        
        excluded: Set[int] = set()
        for w in wos:
            if w.status in ('CANCELLED', 'REJECTED') and w.technician_id is not None:
                excluded.add(w.technician_id)

        # Also inspect AgentEvents for rejected/failed technician details
        events = db.query(AgentEvent).filter(
            AgentEvent.incident_id == incident_id,
            AgentEvent.status.in_(['FAILED', 'REJECTED'])
        ).all()
        for ev in events:
            if ev.detail:
                if 'technician_id' in ev.detail and ev.detail['technician_id']:
                    excluded.add(ev.detail['technician_id'])
                elif 'excluded_technician_ids' in ev.detail and isinstance(ev.detail['excluded_technician_ids'], list):
                    for tid in ev.detail['excluded_technician_ids']:
                        if isinstance(tid, int):
                            excluded.add(tid)

        return excluded

    @classmethod
    def replan_incident(
        cls,
        db: Session,
        incident_id: int,
        trigger_reason: str = "verification_failure",
        exclude_technician_ids: Optional[List[int]] = None
    ) -> ReplanResult:
        """
        Autonomously recover and replan an incident.
        
        Lifecycle:
            REOPENED -> REPLANNING -> RESOURCE -> SCHEDULE -> SCHEDULED
        """
        incident = db.get(Incident, incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail=f"Incident #{incident_id} not found")

        # 1. State / Terminal Status Check
        if incident.status in ('RESOLVED', 'CLOSED'):
            return ReplanResult(
                success=False,
                incident_id=incident.id,
                replan_attempt=incident.replan_count or 0,
                max_attempts=cls.MAX_REPLAN_ATTEMPTS,
                incident_status=incident.status,
                reason=f"Incident is in terminal status '{incident.status}'; replanning ignored."
            )

        # 2. Replan Attempt Limit Check (Bounded Retries)
        current_attempts = incident.replan_count or 0
        if current_attempts >= cls.MAX_REPLAN_ATTEMPTS:
            # Safely leave incident in REPLANNING or REOPENED
            if incident.status not in ('REPLANNING', 'REOPENED'):
                transition_incident(
                    db=db,
                    incident=incident,
                    new_status='REPLANNING',
                    actor='Replanning Agent',
                    reason=f"Max replan limit reached ({current_attempts}/{cls.MAX_REPLAN_ATTEMPTS})"
                )

            log_agent_event(
                db=db,
                incident_id=incident.id,
                agent='Replanning Agent',
                action=f"Autonomous replan limit reached ({current_attempts}/{cls.MAX_REPLAN_ATTEMPTS}): Human intervention required",
                tool='replan_incident',
                detail={
                    'incident_id': incident.id,
                    'replan_count': current_attempts,
                    'max_attempts': cls.MAX_REPLAN_ATTEMPTS,
                    'reason': 'MAX_REPLAN_ATTEMPTS_EXCEEDED'
                },
                status='HUMAN_INTERVENTION_REQUIRED'
            )
            db.commit()

            return ReplanResult(
                success=False,
                incident_id=incident.id,
                replan_attempt=current_attempts,
                max_attempts=cls.MAX_REPLAN_ATTEMPTS,
                incident_status=incident.status,
                reason="MAX_REPLAN_ATTEMPTS_EXCEEDED: Autonomous replan limit reached; human intervention required."
            )

        # 3. Duplicate Replan / Idempotency Protection
        # Check if there is already an active non-terminal replacement work order
        active_wo = db.query(WorkOrder).filter(
            WorkOrder.incident_id == incident.id,
            WorkOrder.status.in_(['SCHEDULED', 'IN_PROGRESS', 'AWAITING_VERIFICATION', 'ASSIGNED', 'ACCEPTED'])
        ).first()

        if active_wo:
            return ReplanResult(
                success=False,
                incident_id=incident.id,
                replan_attempt=incident.replan_count or 0,
                max_attempts=cls.MAX_REPLAN_ATTEMPTS,
                new_work_order_id=active_wo.id,
                incident_status=incident.status,
                reason=f"Active work order #{active_wo.id} already exists in status '{active_wo.status}'."
            )

        try:
            # 4. State Transition: REOPENED -> REPLANNING
            if incident.status != 'REPLANNING':
                transition_incident(
                    db=db,
                    incident=incident,
                    new_status='REPLANNING',
                    actor='Replanning Agent',
                    reason=f"Entering autonomous recovery cycle (Attempt {current_attempts + 1}/{cls.MAX_REPLAN_ATTEMPTS})"
                )

            # Mark prior active runs as REPLANNED
            active_prev_runs = db.query(AgentRun).filter(
                AgentRun.incident_id == incident.id,
                AgentRun.status == 'RUNNING'
            ).all()
            for pr in active_prev_runs:
                pr.status = 'REPLANNED'
                if not pr.completed_at:
                    pr.completed_at = datetime.now(timezone.utc)

            last_run = db.query(AgentRun).filter(
                AgentRun.incident_id == incident.id
            ).order_by(AgentRun.run_number.desc()).first()
            run_num = (last_run.run_number + 1) if last_run else (current_attempts + 1)

            # Increment replan attempt count
            incident.replan_count = current_attempts + 1
            attempt_num = incident.replan_count

            # Create AgentRun for this recovery attempt
            replan_run = AgentRun(
                organization_id=incident.organization_id or 1,
                incident_id=incident.id,
                run_number=run_num,
                trigger_reason=trigger_reason,
                status='RUNNING',
                started_at=datetime.now(timezone.utc)
            )
            db.add(replan_run)
            db.flush()

            # 5. Determine all previous excluded technicians
            excluded_ids = cls.get_excluded_technician_ids(db, incident.id)
            if exclude_technician_ids:
                excluded_ids.update(exclude_technician_ids)

            # 6. Log Authentic REPLAN Event
            log_agent_event(
                db=db,
                incident_id=incident.id,
                agent_run_id=replan_run.id,
                organization_id=incident.organization_id or 1,
                agent='Replanning Agent',
                action=f"Autonomous replan triggered (Attempt {attempt_num}/{cls.MAX_REPLAN_ATTEMPTS}): Reason={trigger_reason}, Excluded Technicians={list(excluded_ids)}",
                tool='replan_incident',
                detail={
                    'attempt': attempt_num,
                    'max_attempts': cls.MAX_REPLAN_ATTEMPTS,
                    'trigger_reason': trigger_reason,
                    'excluded_technician_ids': list(excluded_ids)
                },
                status='IN_PROGRESS'
            )

            # 7. Reconstruct Operational Understanding, Context, and Priority
            understanding = UnderstandingAgent.run(db, incident.description, incident.room_code)
            context_facts = ContextAgent.run(db, understanding)
            priority_assessment = PriorityAgent.run(db, understanding, context_facts)

            # 8. RESOURCE AGENT: Evaluate Available Candidates excluding prior failures
            resource_decision = ResourceAgent.run(
                db=db,
                incident=incident,
                understanding=understanding,
                context=context_facts,
                exclude_tech_ids=list(excluded_ids)
            )

            if not resource_decision.is_feasible or not resource_decision.selected_technician_id:
                # Log Resource & Replanning failure events
                log_agent_event(
                    db=db,
                    incident_id=incident.id,
                    agent='Resource Agent',
                    action=f"Replanning found no feasible technician meeting constraints (Excluded: {list(excluded_ids)})",
                    tool='find_available_technicians_tool',
                    detail=resource_decision.model_dump(),
                    status='NO_FEASIBLE_RESOURCE'
                )
                log_agent_event(
                    db=db,
                    incident_id=incident.id,
                    agent='Replanning Agent',
                    action=f"Replanning paused: No feasible technician available (Attempt {attempt_num}/{cls.MAX_REPLAN_ATTEMPTS})",
                    tool='replan_incident',
                    detail={'attempt': attempt_num, 'reason': 'NO_FEASIBLE_RESOURCE'},
                    status='WAITING'
                )
                replan_run.status = 'FAILED'
                replan_run.completed_at = datetime.now(timezone.utc)
                # Incident safely remains in REPLANNING
                db.commit()
                return ReplanResult(
                    success=False,
                    incident_id=incident.id,
                    replan_attempt=attempt_num,
                    max_attempts=cls.MAX_REPLAN_ATTEMPTS,
                    previous_technician_ids=list(excluded_ids),
                    incident_status=incident.status,
                    reason="NO_FEASIBLE_RESOURCE: No qualified, available technician found meeting operational constraints."
                )

            selected_tech = db.get(Technician, resource_decision.selected_technician_id)
            log_agent_event(
                db=db,
                incident_id=incident.id,
                agent='Resource Agent',
                action=f"Replanning selected qualified specialist {selected_tech.name} (Score: {resource_decision.score:.1f}/100)",
                tool='find_available_technicians_tool',
                detail=resource_decision.model_dump(),
                status='SUCCESS'
            )

            # 9. SCHEDULING AGENT: Evaluate Room Timetable and Technician Commitments
            scheduling_decision = SchedulingAgent.run(
                db=db,
                incident=incident,
                priority_assessment=priority_assessment,
                context=context_facts,
                resource_decision=resource_decision,
                understanding=understanding
            )

            if not scheduling_decision.scheduled:
                log_agent_event(
                    db=db,
                    incident_id=incident.id,
                    agent='Scheduling Agent',
                    action=f"Replanning could not find conflict-free slot for {selected_tech.name}",
                    tool='schedule_work_order',
                    detail=scheduling_decision.model_dump(),
                    status='CONFLICT' if scheduling_decision.conflict_detected else 'WAITING'
                )
                log_agent_event(
                    db=db,
                    incident_id=incident.id,
                    agent='Replanning Agent',
                    action=f"Replanning paused: Scheduling conflict detected (Attempt {attempt_num}/{cls.MAX_REPLAN_ATTEMPTS})",
                    tool='replan_incident',
                    detail={'attempt': attempt_num, 'reason': 'NO_FEASIBLE_SCHEDULE'},
                    status='WAITING'
                )
                replan_run.status = 'FAILED'
                replan_run.completed_at = datetime.now(timezone.utc)
                # Incident safely remains in REPLANNING
                db.commit()
                return ReplanResult(
                    success=False,
                    incident_id=incident.id,
                    replan_attempt=attempt_num,
                    max_attempts=cls.MAX_REPLAN_ATTEMPTS,
                    previous_technician_ids=list(excluded_ids),
                    selected_technician_id=selected_tech.id,
                    selected_technician_name=selected_tech.name,
                    incident_status=incident.status,
                    reason="NO_FEASIBLE_SCHEDULE: Could not find feasible conflict-free execution slot."
                )

            scheduled_for_dt = calculate_datetime_from_slot(
                scheduling_decision.target_date,
                scheduling_decision.scheduled_start
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
                status='SUCCESS'
            )

            # 10. CREATE NEW WORK ORDER (New DB record; old remains CANCELLED)
            new_wo = SchedulingAgent.create_work_order(
                db=db,
                incident_id=incident.id,
                technician=selected_tech,
                scheduled_for=scheduled_for_dt,
                notes=f"Autonomous replan (Attempt {attempt_num}/{cls.MAX_REPLAN_ATTEMPTS}): Assigned to {selected_tech.name}; Slot: {scheduling_decision.scheduled_start} - {scheduling_decision.scheduled_end} ({scheduling_decision.policy_applied})"
            )
            # Ensure work order is in SCHEDULED status
            new_wo.status = 'SCHEDULED'

            # 11. State Transition: REPLANNING -> SCHEDULED
            transition_incident(
                db=db,
                incident=incident,
                new_status='SCHEDULED',
                actor='Replanning Agent',
                reason=f"Autonomous replanning scheduled new work order #{new_wo.id} with {selected_tech.name}"
            )

            # 12. Log Replanning Agent Success Event
            log_agent_event(
                db=db,
                incident_id=incident.id,
                agent='Replanning Agent',
                action=f"Autonomous replanning succeeded: WorkOrder #{new_wo.id} scheduled for {selected_tech.name} (Attempt {attempt_num}/{cls.MAX_REPLAN_ATTEMPTS})",
                tool='replan_incident',
                detail={
                    'work_order_id': new_wo.id,
                    'technician_id': selected_tech.id,
                    'technician_name': selected_tech.name,
                    'scheduled_for': scheduled_for_dt.isoformat() if scheduled_for_dt else None,
                    'attempt': attempt_num,
                    'max_attempts': cls.MAX_REPLAN_ATTEMPTS,
                    'previous_technicians': list(excluded_ids)
                },
                status='SUCCESS'
            )

            # 13. Trigger Live Operational Observation Snapshot
            affected_eq = ExecutionAgent._find_targeted_affected_equipment(db, incident)
            ObservationAgent.observe(
                db=db,
                incident_id=incident.id,
                work_order_id=new_wo.id,
                affected_equipment_id=affected_eq.id if affected_eq else None
            )

            replan_run.status = 'COMPLETED'
            replan_run.completed_at = datetime.now(timezone.utc)
            db.commit()

            return ReplanResult(
                success=True,
                incident_id=incident.id,
                replan_attempt=attempt_num,
                max_attempts=cls.MAX_REPLAN_ATTEMPTS,
                previous_technician_ids=list(excluded_ids),
                selected_technician_id=selected_tech.id,
                selected_technician_name=selected_tech.name,
                new_work_order_id=new_wo.id,
                scheduled_for=scheduled_for_dt.isoformat() if scheduled_for_dt else None,
                incident_status=incident.status,
                reason=f"Autonomous replan successful: WorkOrder #{new_wo.id} assigned to {selected_tech.name}"
            )

        except HTTPException:
            db.rollback()
            raise
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Replanning failed unexpectedly: {str(e)}"
            )

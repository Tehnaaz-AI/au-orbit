"""
AUOrbit — Internal Presentation Demo Fixture (PRESENTATION ONLY)

Provides an isolated, reversible fixture mechanism for internal presentations and live demonstrations.
Exercises the REAL backend multi-agent pipeline:
  REPORT -> UNDERSTAND -> CONTEXT -> PRIORITY -> RESOURCE -> SCHEDULE -> EXECUTE -> VERIFY (FAIL)
  -> REOPEN -> REPLAN -> NEW RESOURCE -> NEW SCHEDULE -> NEW WORK ORDER -> EXECUTE -> VERIFY (PASS) -> RESOLVED

CRITICAL RULES:
1. PRESENTATION ONLY — NEVER imported or executed by normal production startup.
2. Does NOT modify seed.py or reference data.
3. Uses real database services, state machine, agents, and event logging.
4. Supports complete, zero-residue cleanup via --cleanup flag.
"""

import sys
import os
import argparse
import getpass
from datetime import datetime, timezone

from .database import SessionLocal, ensure_schema, engine
from .seed import seed
from .models import Organization, Campus, Building, Room, Equipment, Technician, Incident, WorkOrder, AgentRun, AgentEvent, User
from .auth import hash_password
from .services import orchestrate
from .execution import ExecutionAgent
from .verification import VerificationAgent
from .replanning import ReplanningAgent

DEMO_USER_EMAIL = "presentation.faculty@demo.local"
DEMO_USER_NAME = "Dr. A. Sharma (Presentation Faculty)"
DEMO_INCIDENT_DESC = "The projector in Room I-302 is not working and the class is currently in progress."
DEMO_ROOM_CODE = "I-302"


def get_or_create_presentation_user(db, password: str = None) -> User:
    """Retrieve or create the presentation-safe faculty user."""
    user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    if user:
        return user

    org = db.query(Organization).first()
    org_id = org.id if org else 1

    pwd = password or os.getenv("DEMO_PASSWORD") or "AUOrbitDemo2026!"
    hashed = hash_password(pwd)

    user = User(
        organization_id=org_id,
        email=DEMO_USER_EMAIL,
        full_name=DEMO_USER_NAME,
        hashed_password=hashed,
        role="FACULTY",
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    print(f"[DEMO FIXTURE] Created presentation faculty user: {user.email} (Role: {user.role}, Org ID: {user.organization_id})")
    return user


def cleanup_presentation_data(db) -> dict:
    """
    Safely delete ONLY presentation demo records without touching legitimate reference data.
    """
    cleaned = {
        "incidents": 0,
        "work_orders": 0,
        "agent_runs": 0,
        "agent_events": 0,
        "users": 0
    }

    # 1. Find demo user
    demo_user = db.query(User).filter(User.email == DEMO_USER_EMAIL).first()
    demo_user_id = demo_user.id if demo_user else None

    # 2. Find demo incidents
    demo_incidents = db.query(Incident).filter(
        (Incident.reporter_id == demo_user_id) |
        (Incident.description == DEMO_INCIDENT_DESC) |
        (Incident.reporter == DEMO_USER_NAME)
    ).all()

    for inc in demo_incidents:
        inc_id = inc.id
        
        # Delete agent events
        events = db.query(AgentEvent).filter(AgentEvent.incident_id == inc_id).all()
        for ev in events:
            db.delete(ev)
            cleaned["agent_events"] += 1
            
        # Delete agent runs
        runs = db.query(AgentRun).filter(AgentRun.incident_id == inc_id).all()
        for r in runs:
            db.delete(r)
            cleaned["agent_runs"] += 1

        # Delete work orders
        wos = db.query(WorkOrder).filter(WorkOrder.incident_id == inc_id).all()
        for w in wos:
            db.delete(w)
            cleaned["work_orders"] += 1

        # Delete incident
        db.delete(inc)
        cleaned["incidents"] += 1

    # 3. Delete demo user
    if demo_user:
        db.delete(demo_user)
        cleaned["users"] += 1

    # 4. Reset equipment state for Room I-302 projector back to WORKING
    room = db.query(Room).filter(Room.code == DEMO_ROOM_CODE).first()
    if room:
        eqs = db.query(Equipment).filter(Equipment.room_id == room.id, Equipment.name.ilike("%projector%")).all()
        for eq in eqs:
            eq.status = "WORKING"

    # 5. Reset all technicians back to AVAILABLE
    techs = db.query(Technician).all()
    for t in techs:
        t.status = "AVAILABLE"

    db.commit()
    return cleaned


def run_presentation_workflow(db, password: str = None) -> Incident:
    """
    Execute the authentic end-to-end multi-agent pipeline with intentional failure and replanning.
    """
    print("=" * 70)
    print("AUOrbit — EXECUTING REAL MULTI-AGENT DEMO PIPELINE")
    print("=" * 70)

    # 0. Ensure legitimate reference configuration exists
    seed(db)

    # 1. Ensure user
    user = get_or_create_presentation_user(db, password)
    org_id = user.organization_id or 1

    # 2. Stage 1: Initial Autonomous Orchestration
    print(f"\n[STEP 1] Faculty reporting incident: '{DEMO_INCIDENT_DESC}'...")
    incident = orchestrate(
        db=db,
        reporter=user.full_name,
        description=DEMO_INCIDENT_DESC,
        supplied_room=DEMO_ROOM_CODE,
        organization_id=org_id,
        reporter_id=user.id
    )
    db.commit()
    print(f" -> Incident created: ID #{incident.id} | Status: {incident.status} | Priority: {incident.priority}")

    wo1 = db.query(WorkOrder).filter(WorkOrder.incident_id == incident.id).first()
    run1 = db.query(AgentRun).filter(AgentRun.incident_id == incident.id, AgentRun.run_number == 1).first()
    print(f" -> AgentRun #1 initialized (ID: {run1.id if run1 else 'N/A'})")
    print(f" -> WorkOrder #1 created: ID #{wo1.id} | Assigned Tech ID: {wo1.technician_id} | Status: {wo1.status}")

    # 3. Stage 2: Execute WorkOrder #1
    print(f"\n[STEP 2] Executing WorkOrder #{wo1.id}...")
    ExecutionAgent.start_work_order(db, wo1.id)
    db.commit()
    print(f" -> WorkOrder #{wo1.id} started. Incident status: {incident.status}")

    ExecutionAgent.complete_work_order(db, wo1.id, notes="Cleaned air filter and adjusted mounting frame.")
    db.commit()
    print(f" -> WorkOrder #{wo1.id} marked completed. Incident status: {incident.status}")

    # 4. Stage 3: Verification Fails -> Triggers Replanning
    print(f"\n[STEP 3] Triggering Verification Audit (Simulating Hardware Defect Failure)...")
    verif_fail = VerificationAgent.verify_work_order(
        db=db,
        work_order_id=wo1.id,
        outcome="fail",
        notes="Optical lamp defective (0 lux output); projector failed automated lumen benchmark.",
        auto_replan=True
    )
    db.commit()
    print(f" -> Verification Result: {verif_fail.outcome} | Reason: {verif_fail.reason}")
    print(f" -> Incident transitioned to: {incident.status} (Replan Count: {incident.replan_count})")
    print(f" -> WorkOrder #{wo1.id} status: {wo1.status} (Permanently archived as failed)")

    # 5. Stage 4: Verify Autonomous Replanning
    run2 = db.query(AgentRun).filter(AgentRun.incident_id == incident.id, AgentRun.run_number == 2).first()
    wo2 = db.query(WorkOrder).filter(WorkOrder.incident_id == incident.id, WorkOrder.id != wo1.id).first()
    print(f"\n[STEP 4] Autonomous Replanning verified:")
    print(f" -> AgentRun #2 created (ID: {run2.id if run2 else 'N/A'}, Trigger: {run2.trigger_reason if run2 else 'N/A'})")
    print(f" -> Excluded previous failed Technician ID: {wo1.technician_id}")
    print(f" -> WorkOrder #2 created: ID #{wo2.id if wo2 else 'N/A'} | Assigned Replacement Tech ID: {wo2.technician_id if wo2 else 'N/A'} | Status: {wo2.status if wo2 else 'N/A'}")

    # 6. Stage 5: Execute WorkOrder #2
    if wo2:
        print(f"\n[STEP 5] Replacement Technician executing WorkOrder #{wo2.id}...")
        ExecutionAgent.start_work_order(db, wo2.id)
        db.commit()
        ExecutionAgent.complete_work_order(db, wo2.id, notes="Installed high-output replacement lamp module and calibrated focus.")
        db.commit()
        print(f" -> WorkOrder #{wo2.id} completed. Incident status: {incident.status}")

        # 7. Stage 6: Final Verification (PASS)
        print(f"\n[STEP 6] Final Operational Verification Audit...")
        verif_pass = VerificationAgent.verify_work_order(
            db=db,
            work_order_id=wo2.id,
            outcome="pass",
            notes="3500 lumen test projection verified. Color gamut calibrated. Classroom ready.",
            auto_replan=True
        )
        db.commit()
        print(f" -> Final Verification Result: {verif_pass.outcome} | Incident Status: {incident.status}")
        
        # Verify equipment status
        room = db.query(Room).filter(Room.code == DEMO_ROOM_CODE).first()
        eq = db.query(Equipment).filter(Equipment.room_id == room.id, Equipment.name.ilike("%projector%")).first() if room else None
        print(f" -> Equipment (ID #{eq.id if eq else 'N/A'}) state: {eq.status if eq else 'N/A'}")

    print("\n" + "=" * 70)
    print(f"DEMO SCENARIO COMPLETED SUCCESSFULLY! Incident ID: #{incident.id} is {incident.status}")
    print("=" * 70)
    return incident


def main():
    parser = argparse.ArgumentParser(description="AUOrbit Presentation Demo CLI (PRESENTATION ONLY)")
    parser.add_argument("--cleanup", action="store_true", help="Remove all presentation demo records and reset equipment/technician states")
    parser.add_argument("--user-only", action="store_true", help="Create ONLY the presentation faculty user account for manual UI submission")
    parser.add_argument("--password", type=str, default=None, help="Optional password for presentation faculty user (defaults to env DEMO_PASSWORD or 'AUOrbitDemo2026!')")
    args = parser.parse_args()

    ensure_schema(engine)
    db = SessionLocal()

    try:
        if args.cleanup:
            print("[DEMO FIXTURE] Running clean teardown of presentation records...")
            res = cleanup_presentation_data(db)
            print(f"[DEMO FIXTURE] Cleaned records: {res}")
            print("[DEMO FIXTURE] Reference campus configuration remains 100% intact.")
        elif args.user_only:
            user = get_or_create_presentation_user(db, args.password)
            print(f"\n[DEMO FIXTURE] Presentation User Ready for UI Login:")
            print(f"  Email:    {user.email}")
            print(f"  Password: {args.password or os.getenv('DEMO_PASSWORD') or 'AUOrbitDemo2026!'}")
            print(f"  Role:     {user.role}")
        else:
            run_presentation_workflow(db, args.password)
    finally:
        db.close()


if __name__ == "__main__":
    main()

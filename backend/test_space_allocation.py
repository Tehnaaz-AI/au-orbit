from app.database import SessionLocal, ensure_schema, engine
from app.models import Incident, WorkOrder, AgentEvent, Room, TimetableEntry
from app.services import orchestrate
from app.seed import seed

ensure_schema(engine)
db = SessionLocal()
seed(db)

print("=== TEST 1: Hardware Projector Issue ===")
inc1 = orchestrate(
    db=db,
    reporter="Dr. Ananya S.",
    description="The projector HDMI cable is broken and smoking in I-302",
    supplied_room="I-302",
    organization_id=1
)
print(f"Incident #{inc1.id} -> Status: {inc1.status}, Category: {inc1.category}")
wos1 = db.query(WorkOrder).filter(WorkOrder.incident_id == inc1.id).all()
print(f"Work Orders created: {len(wos1)} (Assigned Tech IDs: {[w.technician_id for w in wos1]})")
assert len(wos1) > 0, "Hardware issue should have created a work order"

print("\n=== TEST 2: Seating Shortage / Overcrowding Issue ===")
inc2 = orchestrate(
    db=db,
    reporter="Dr. Ananya S.",
    description="Room I-302 is overflowing with 80 students and has insufficient seating for the lecture. Need to relocate class to an empty room.",
    supplied_room="I-302",
    organization_id=1
)
print(f"Incident #{inc2.id} -> Status: {inc2.status}, Category: {inc2.category}")
print(f"Resolution Details:\n  {inc2.resolution}")
wos2 = db.query(WorkOrder).filter(WorkOrder.incident_id == inc2.id).all()
print(f"Work Orders created: {len(wos2)} (Should be 0 for space reallocation)")
assert len(wos2) == 0, "Space reallocation should NOT create a technician work order!"

events2 = db.query(AgentEvent).filter(AgentEvent.incident_id == inc2.id).all()
print("\nAgent Events Logged for Space Allocation:")
for e in events2:
    print(f"  [{e.agent}] {e.action} (Tool: {e.tool}, Status: {e.status})")

print("\nALL DYNAMIC AGENT TESTS PASSED SUCCESSFULLY!")
db.close()

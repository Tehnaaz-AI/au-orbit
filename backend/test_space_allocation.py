from app.database import SessionLocal, ensure_schema, engine
from app.models import Incident, WorkOrder, AgentEvent, Room, TimetableEntry, Technician
from app.services import orchestrate
from app.seed import seed

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

print("\n=== TEST 2: User's Exact Query: Class Insufficient Space ===")
inc2 = orchestrate(
    db=db,
    reporter="Dr. Ananya S.",
    description="The class I-302 is not sufficient for students; please allocate some other room",
    supplied_room="I-302",
    organization_id=1
)
print(f"Incident #{inc2.id} -> Status: {inc2.status}, Category: {inc2.category}")
print(f"Resolution Details:\n  {inc2.resolution}")
wos2 = db.query(WorkOrder).filter(WorkOrder.incident_id == inc2.id).all()
print(f"Work Orders created: {len(wos2)} (Should be 0 for space reallocation)")
assert len(wos2) == 0, "Space reallocation should NOT create a technician work order!"

print("\n=== TEST 3: Plumbing Specialist Dispatch ===")
inc3 = orchestrate(
    db=db,
    reporter="Rahul Sharma (Student)",
    description="There is a severe washroom pipe leak flooding near I-302",
    supplied_room="I-302",
    organization_id=1
)
print(f"Incident #{inc3.id} -> Status: {inc3.status}, Category: {inc3.category}")
wos3 = db.query(WorkOrder).filter(WorkOrder.incident_id == inc3.id).all()
assert len(wos3) > 0, "Plumbing issue should have created a work order"
tech3 = db.get(Technician, wos3[0].technician_id)
print(f"Work Order Assigned To: {tech3.name if tech3 else 'None'} ({tech3.specialty if tech3 else 'None'})")

print("\nALL DYNAMIC AGENT TESTS PASSED SUCCESSFULLY!")
db.close()

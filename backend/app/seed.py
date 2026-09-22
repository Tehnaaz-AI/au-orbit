from .models import Organization, Campus, Building, Department, Room, Equipment, Technician, TimetableEntry, User, WorkOrder
from .auth import hash_password


BLOCK_DEPARTMENTS = {
    'A': 'CSE',
    'B': 'Pharmacy',
    'C': 'Civil',
    'D': 'CSE + AI First Years',
    'E': 'ECE + ECM',
    'F': 'Examination Branch',
    'G': 'Placement Office + Seminar Hall',
    'H': 'CSE Allied Branches',
    'I': 'AI + AIML (2nd, 3rd & 4th Years)'
}

PERIOD_TIMINGS = {
    1: ('09:00', '09:55'),
    2: ('09:55', '10:50'),
    3: ('10:50', '11:45'),
    4: ('11:45', '12:40'),
    5: ('13:20', '14:15'),
    6: ('14:15', '15:10'),
    7: ('15:10', '16:05')
}

AI_FACULTY = {
    'ADS': 'Dr. Meera N.',
    'PP': 'Prof. Rajesh K.',
    'AI': 'Dr. Ananya S.',
    'COA': 'Prof. Vikram V.',
    'COSM': 'Dr. Sunita R.',
    'CE': 'Prof. David P.',
    'ADS LAB': 'Dr. Meera N. / Staff',
    'PP LAB': 'Prof. Rajesh K. / Staff',
    'DOE-I': 'Dr. S. K. Roy',
    'TT': 'Technical Training Team',
    'Certification': 'Industry Mentor',
    'Library': 'Library Staff',
    'Counseling': 'Faculty Mentor',
    'Remedial': 'Academic Support',
    'Sports': 'Physical Director',
    'Activity': 'Student Affairs'
}

def seed(db):
    # 1. Seed Primary Default Tenant Organization (Anurag University)
    org = db.query(Organization).filter(Organization.id == 1).first()
    if not org:
        org = Organization(
            id=1,
            name='Anurag University',
            slug='anurag-univ',
            domain='anurag.edu.in',
            is_active=True
        )
        db.add(org)
        db.flush()

    # 1b. Seed Campus
    campus = db.query(Campus).filter(Campus.organization_id == 1, Campus.code == 'MAIN').first()
    if not campus:
        campus = Campus(
            organization_id=1,
            name='Hyderabad Main Campus',
            code='MAIN'
        )
        db.add(campus)
        db.flush()

    # 1c. Seed Departments
    dept_map = {}
    for code, dept_name in BLOCK_DEPARTMENTS.items():
        existing_dept = db.query(Department).filter(Department.organization_id == 1, Department.code == code).first()
        if not existing_dept:
            new_dept = Department(
                organization_id=1,
                name=dept_name,
                code=code,
                head_name=f"Head of {code}"
            )
            db.add(new_dept)
            db.flush()
            dept_map[code] = new_dept
        else:
            dept_map[code] = existing_dept

    # 1d. Seed Buildings
    building_map = {}
    for block in BLOCK_DEPARTMENTS.keys():
        bld = db.query(Building).filter(Building.organization_id == 1, Building.code == f"BLOCK-{block}").first()
        if not bld:
            bld = Building(
                organization_id=1,
                campus_id=campus.id,
                name=f"Block {block} Academic Complex",
                code=f"BLOCK-{block}",
                floors=5
            )
            db.add(bld)
            db.flush()
        building_map[block] = bld

    # 2. Seed Rooms (Idempotent per room code)
    existing_rooms = {r.code: r for r in db.query(Room).filter(Room.organization_id == 1).all()}
    new_rooms = []

    # Standard blocks A through I
    for block, dept in BLOCK_DEPARTMENTS.items():
        bld_id = building_map.get(block).id if block in building_map else None
        for floor in range(1, 6):
            for suffix in range(1, 12):
                code = f"{block}-{floor}{suffix:02d}"
                if code not in existing_rooms:
                    if suffix == 1:
                        kind = 'SEMINAR_HALL'
                    elif suffix in (10, 11):
                        kind = 'LAB'
                    else:
                        kind = 'CLASSROOM'
                    new_rooms.append(Room(
                        organization_id=1,
                        campus_id=campus.id,
                        building_id=bld_id,
                        code=code,
                        block=block,
                        floor=floor,
                        kind=kind,
                        department=dept,
                        availability='AVAILABLE'
                    ))

    # Ground floor / Special spaces per block
    special_spaces = [
        # Block Ground Facilities
        Room(organization_id=1, campus_id=campus.id, code='A-FEE-COUNTER', block='A', floor=0, kind='ADMIN', department='Finance & Accounts'),
        Room(organization_id=1, campus_id=campus.id, code='B-STATIONERY', block='B', floor=0, kind='STATIONERY', department='Campus Services & Readers'),
        Room(organization_id=1, campus_id=campus.id, code='D-CANTEEN', block='D', floor=0, kind='CANTEEN', department='Food Services'),
        Room(organization_id=1, campus_id=campus.id, code='I-CANTEEN', block='I', floor=0, kind='CANTEEN', department='Food Services'),
        Room(organization_id=1, campus_id=campus.id, code='I-ADMISSION-OFFICE', block='I', floor=0, kind='ADMIN', department='Admissions & Academic Affairs'),
        Room(organization_id=1, campus_id=campus.id, code='G-PLACEMENT-OFFICE', block='G', floor=0, kind='ADMIN', department='Training & Placement Cell'),
        Room(organization_id=1, campus_id=campus.id, code='G-SEMINAR-HALL', block='G', floor=0, kind='SEMINAR_HALL', department='Placement Office + Seminar Hall'),
        # Auditoriums per block
        Room(organization_id=1, campus_id=campus.id, code='A-AUDITORIUM', block='A', floor=0, kind='AUDITORIUM', department='CSE'),
        Room(organization_id=1, campus_id=campus.id, code='B-AUDITORIUM', block='B', floor=0, kind='AUDITORIUM', department='Pharmacy'),
        Room(organization_id=1, campus_id=campus.id, code='C-AUDITORIUM', block='C', floor=0, kind='AUDITORIUM', department='Civil'),
        Room(organization_id=1, campus_id=campus.id, code='D-AUDITORIUM', block='D', floor=0, kind='AUDITORIUM', department='CSE + AI First Years'),
        Room(organization_id=1, campus_id=campus.id, code='E-AUDITORIUM', block='E', floor=0, kind='AUDITORIUM', department='ECE + ECM'),
        Room(organization_id=1, campus_id=campus.id, code='F-AUDITORIUM', block='F', floor=0, kind='AUDITORIUM', department='Examination Branch'),
        Room(organization_id=1, campus_id=campus.id, code='G-AUDITORIUM', block='G', floor=0, kind='AUDITORIUM', department='Central Campus'),
        Room(organization_id=1, campus_id=campus.id, code='H-AUDITORIUM', block='H', floor=0, kind='AUDITORIUM', department='CSE Allied Branches'),
        Room(organization_id=1, campus_id=campus.id, code='I-AUDITORIUM', block='I', floor=0, kind='AUDITORIUM', department='AI + AIML'),
        # Campus Venues & Grounds
        Room(organization_id=1, campus_id=campus.id, code='APJ-HALL', block='A', floor=0, kind='EVENT_SPACE', department='University Central'),
        Room(organization_id=1, campus_id=campus.id, code='SPORTS-COMPLEX', block='S', floor=0, kind='SPORTS', department='Physical Education'),
        Room(organization_id=1, campus_id=campus.id, code='CRICKET-GROUND', block='S', floor=0, kind='SPORTS', department='Physical Education'),
        Room(organization_id=1, campus_id=campus.id, code='VOLLEYBALL-GROUND', block='S', floor=0, kind='SPORTS', department='Physical Education'),
        Room(organization_id=1, campus_id=campus.id, code='FOOTBALL-GROUND', block='S', floor=0, kind='SPORTS', department='Physical Education'),
    ]

    for space in special_spaces:
        if space.code not in existing_rooms:
            new_rooms.append(space)

    if new_rooms:
        db.add_all(new_rooms)
        db.flush()

    # Re-fetch all rooms for Org 1
    all_rooms = {r.code: r for r in db.query(Room).filter(Room.organization_id == 1).all()}

    # 3. Seed Equipment
    existing_equip = {(e.room_id, e.name) for e in db.query(Equipment).filter(Equipment.organization_id == 1).all()}
    new_equip = []

    for code, room in all_rooms.items():
        standard_items = ['Projector', 'Chalk Board', 'Lighting']
        if (room.id, 'Projector') not in existing_equip:
            new_equip.append(Equipment(organization_id=1, room_id=room.id, name='Projector'))
        if (room.id, 'Chalk Board') not in existing_equip:
            new_equip.append(Equipment(organization_id=1, room_id=room.id, name='Chalk Board'))
        if (room.id, 'Lighting') not in existing_equip:
            new_equip.append(Equipment(organization_id=1, room_id=room.id, name='Lighting'))

        if room.kind in ('CLASSROOM', 'LAB', 'SEMINAR_HALL', 'AUDITORIUM'):
            for extra in ['Wi-Fi AP', 'AC / HVAC', 'Furniture']:
                if (room.id, extra) not in existing_equip:
                    new_equip.append(Equipment(organization_id=1, room_id=room.id, name=extra))

        if room.kind == 'LAB':
            if (room.id, 'Workstations') not in existing_equip:
                new_equip.append(Equipment(organization_id=1, room_id=room.id, name='Workstations'))

        if room.kind in ('SEMINAR_HALL', 'AUDITORIUM', 'EVENT_SPACE'):
            if (room.id, 'Sound System / Mic') not in existing_equip:
                new_equip.append(Equipment(organization_id=1, room_id=room.id, name='Sound System / Mic'))

        if room.kind in ('CANTEEN', 'SPORTS', 'STATIONERY', 'ADMIN'):
            for item in ['Water Supply / Plumbing', 'Furniture']:
                if (room.id, item) not in existing_equip:
                    new_equip.append(Equipment(organization_id=1, room_id=room.id, name=item))

    if new_equip:
        db.add_all(new_equip)
        db.flush()

    # 4. Seed Canonical Specialist (Strictly 1 Technician: Arjun Rao)
    arjun = db.query(Technician).filter(Technician.organization_id == 1, Technician.name == 'Arjun Rao').first()
    if not arjun:
        arjun = Technician(organization_id=1, name='Arjun Rao', specialty='AV_ELECTRICAL', phone='9876543210')
        db.add(arjun)
        db.flush()

    # Reassign any old work orders referencing other technicians to Arjun Rao
    db.query(WorkOrder).filter(WorkOrder.technician_id != arjun.id).update({WorkOrder.technician_id: arjun.id}, synchronize_session=False)
    db.flush()

    # Remove unlinked legacy technicians
    legacy_techs = db.query(Technician).filter(
        Technician.organization_id == 1,
        Technician.id != arjun.id,
        Technician.user_id.is_(None)
    ).all()
    for lt in legacy_techs:
        db.delete(lt)
    db.flush()

    # 5. Seed Reference Timetable (Department of AI, B.Tech II-I, AY 2026-27, Regulation R24, Effective 29 June 2026)
    existing_tt_keys = {
        (tt.branch, tt.academic_year, tt.semester, tt.section, tt.day, tt.period)
        for tt in db.query(TimetableEntry).filter(TimetableEntry.organization_id == 1).all()
    }
    
    SECTION_BASE_ROOMS = {
        'AI-A': 'I-302',
        'AI-B': 'I-303',
        'AI-C': 'I-307',
        'AI-D': 'I-308',
        'AI-E': 'I-309',
        'AI-F': 'I-403'
    }

    SECTION_SCHEDULES = {
        'AI-A': {
            'Monday': [('ADS', 1), ('PP', 2), ('AI', 3), ('COA', 4), ('ADS LAB', 5), ('ADS LAB', 6), ('Sports', 7)],
            'Tuesday': [('COSM', 1), ('CE', 2), ('ADS', 3), ('AI', 4), ('PP LAB', 5), ('PP LAB', 6), ('Counseling', 7)],
            'Wednesday': [('PP', 1), ('COA', 2), ('COSM', 3), ('DOE-I', 4), ('TT', 5), ('Certification', 6), ('Library', 7)],
            'Thursday': [('AI', 1), ('ADS', 2), ('CE', 3), ('PP', 4), ('COSM', 5), ('COA', 6), ('Remedial', 7)],
            'Friday': [('COA', 1), ('COSM', 2), ('DOE-I', 3), ('ADS', 4), ('AI', 5), ('PP', 6), ('Activity', 7)],
            'Saturday': [('TT', 1), ('TT', 2), ('Certification', 3), ('Certification', 4), ('Sports', 5), ('Activity', 6), ('Library', 7)]
        },
        'AI-B': {
            'Monday': [('PP', 1), ('COA', 2), ('COSM', 3), ('ADS', 4), ('PP LAB', 5), ('PP LAB', 6), ('Sports', 7)],
            'Tuesday': [('AI', 1), ('ADS', 2), ('CE', 3), ('COA', 4), ('ADS LAB', 5), ('ADS LAB', 6), ('Library', 7)],
            'Wednesday': [('COSM', 1), ('PP', 2), ('AI', 3), ('DOE-I', 4), ('TT', 5), ('Certification', 6), ('Counseling', 7)],
            'Thursday': [('ADS', 1), ('COA', 2), ('PP', 3), ('CE', 4), ('AI', 5), ('COSM', 6), ('Remedial', 7)],
            'Friday': [('DOE-I', 1), ('AI', 2), ('ADS', 3), ('COSM', 4), ('COA', 5), ('PP', 6), ('Activity', 7)],
            'Saturday': [('TT', 1), ('Certification', 2), ('Certification', 3), ('TT', 4), ('Sports', 5), ('Library', 6), ('Activity', 7)]
        },
        'AI-C': {
            'Monday': [('AI', 1), ('COSM', 2), ('ADS', 3), ('PP', 4), ('COA', 5), ('CE', 6), ('Sports', 7)],
            'Tuesday': [('PP', 1), ('COA', 2), ('AI', 3), ('ADS', 4), ('PP LAB', 5), ('PP LAB', 6), ('Counseling', 7)],
            'Wednesday': [('ADS', 1), ('CE', 2), ('COSM', 3), ('DOE-I', 4), ('ADS LAB', 5), ('ADS LAB', 6), ('Library', 7)],
            'Thursday': [('COA', 1), ('AI', 2), ('COSM', 3), ('PP', 4), ('DOE-I', 5), ('ADS', 6), ('Remedial', 7)],
            'Friday': [('CE', 1), ('ADS', 2), ('PP', 3), ('COA', 4), ('AI', 5), ('COSM', 6), ('Activity', 7)],
            'Saturday': [('TT', 1), ('TT', 2), ('Certification', 3), ('Certification', 4), ('Sports', 5), ('Activity', 6), ('Library', 7)]
        },
        'AI-D': {
            'Monday': [('COA', 1), ('ADS', 2), ('PP', 3), ('AI', 4), ('COSM', 5), ('CE', 6), ('Sports', 7)],
            'Tuesday': [('ADS', 1), ('PP', 2), ('COA', 3), ('COSM', 4), ('ADS LAB', 5), ('ADS LAB', 6), ('Library', 7)],
            'Wednesday': [('AI', 1), ('COSM', 2), ('PP', 3), ('DOE-I', 4), ('PP LAB', 5), ('PP LAB', 6), ('Counseling', 7)],
            'Thursday': [('CE', 1), ('ADS', 2), ('AI', 3), ('COA', 4), ('PP', 5), ('COSM', 6), ('Remedial', 7)],
            'Friday': [('COSM', 1), ('COA', 2), ('DOE-I', 3), ('AI', 4), ('ADS', 5), ('PP', 6), ('Activity', 7)],
            'Saturday': [('Certification', 1), ('Certification', 2), ('TT', 3), ('TT', 4), ('Sports', 5), ('Library', 6), ('Activity', 7)]
        },
        'AI-E': {
            'Monday': [('ADS', 1), ('AI', 2), ('COA', 3), ('PP', 4), ('COSM', 5), ('CE', 6), ('Sports', 7)],
            'Tuesday': [('COSM', 1), ('COA', 2), ('PP', 3), ('AI', 4), ('ADS LAB', 5), ('ADS LAB', 6), ('Counseling', 7)],
            'Wednesday': [('PP', 1), ('ADS', 2), ('CE', 3), ('DOE-I', 4), ('PP LAB', 5), ('PP LAB', 6), ('Library', 7)],
            'Thursday': [('AI', 1), ('PP', 2), ('ADS', 3), ('COSM', 4), ('COA', 5), ('DOE-I', 6), ('Remedial', 7)],
            'Friday': [('COA', 1), ('COSM', 2), ('AI', 3), ('ADS', 4), ('PP', 5), ('CE', 6), ('Activity', 7)],
            'Saturday': [('TT', 1), ('TT', 2), ('Certification', 3), ('Certification', 4), ('Sports', 5), ('Activity', 6), ('Library', 7)]
        },
        'AI-F': {
            'Monday': [('PP', 1), ('ADS', 2), ('AI', 3), ('COA', 4), ('COSM', 5), ('CE', 6), ('Sports', 7)],
            'Tuesday': [('AI', 1), ('COSM', 2), ('ADS', 3), ('PP', 4), ('PP LAB', 5), ('PP LAB', 6), ('Library', 7)],
            'Wednesday': [('COA', 1), ('PP', 2), ('COSM', 3), ('DOE-I', 4), ('ADS LAB', 5), ('ADS LAB', 6), ('Counseling', 7)],
            'Thursday': [('ADS', 1), ('AI', 2), ('COA', 3), ('CE', 4), ('PP', 5), ('COSM', 6), ('Remedial', 7)],
            'Friday': [('DOE-I', 1), ('COA', 2), ('PP', 3), ('ADS', 4), ('AI', 5), ('COSM', 6), ('Activity', 7)],
            'Saturday': [('Certification', 1), ('Certification', 2), ('TT', 3), ('TT', 4), ('Sports', 5), ('Library', 6), ('Activity', 7)]
        }
    }

    new_tt_entries = []
    for section, week_sched in SECTION_SCHEDULES.items():
        base_room = SECTION_BASE_ROOMS[section]
        for day, period_list in week_sched.items():
            for subject, period in period_list:
                key = ('AI', '2026-27', 'II-I', section, day, period)
                if key in existing_tt_keys:
                    continue

                start_time, end_time = PERIOD_TIMINGS[period]
                
                if 'LAB' in subject:
                    assigned_room = 'I-310' if section in ('AI-A', 'AI-B', 'AI-C') else 'I-410'
                    activity_type = 'LAB'
                elif subject == 'Sports':
                    assigned_room = 'SPORTS-COMPLEX'
                    activity_type = 'SPORTS'
                elif subject in ('TT', 'Certification'):
                    assigned_room = 'I-101' if section in ('AI-A', 'AI-B', 'AI-C') else 'I-201'
                    activity_type = 'TUTORIAL'
                else:
                    assigned_room = base_room
                    activity_type = 'LECTURE'

                room_obj = all_rooms.get(assigned_room)
                room_id = room_obj.id if room_obj else None
                faculty_name = AI_FACULTY.get(subject, 'Faculty Member')

                new_tt_entries.append(TimetableEntry(
                    organization_id=1,
                    room_id=room_id,
                    room_code=assigned_room,
                    branch='AI',
                    academic_year='2026-27',
                    semester='II-I',
                    section=section,
                    subject=subject,
                    faculty=faculty_name,
                    day=day,
                    period=period,
                    start_time=start_time,
                    end_time=end_time,
                    activity_type=activity_type,
                    is_reference_data=True
                ))

    if new_tt_entries:
        db.add_all(new_tt_entries)

    # 6. Seed Standard Reference University Users (Strictly 1 Person Per Role)
    canonical_users = [
        {"email": "student@anurag.edu.in", "full_name": "Rahul Sharma (Student)", "role": "STUDENT", "department": "Department of AI", "specialty": None},
        {"email": "faculty@anurag.edu.in", "full_name": "Dr. Ananya S. (Faculty)", "role": "FACULTY", "department": "Department of AI", "specialty": None},
        {"email": "technician@anurag.edu.in", "full_name": "Arjun Rao (Technician)", "role": "TECHNICIAN", "department": "Campus Facilities", "specialty": "AV_ELECTRICAL", "tech_name": "Arjun Rao"},
        {"email": "operations.head@anurag.edu.in", "full_name": "Vikram Reddy (Operations Head)", "role": "OPERATIONAL_HEAD", "department": "Campus Operations", "specialty": "FACILITIES_FLEET"},
        {"email": "admin@anurag.edu.in", "full_name": "Campus Operations Admin", "role": "ADMIN", "department": "University Administration", "specialty": None},
        {"email": "superadmin@anurag.edu.in", "full_name": "Platform Super Admin", "role": "SUPER_ADMIN", "department": "IT & Governance", "specialty": None},
    ]

    canonical_emails = {u["email"] for u in canonical_users}
    
    # Remove all legacy/duplicate non-canonical users
    legacy_users = db.query(User).filter(User.organization_id == 1, ~User.email.in_(canonical_emails)).all()
    legacy_user_ids = [lu.id for lu in legacy_users]
    if legacy_user_ids:
        # Unlink foreign key in technicians
        db.query(Technician).filter(Technician.user_id.in_(legacy_user_ids)).update({Technician.user_id: None}, synchronize_session=False)
        db.flush()
        for lu in legacy_users:
            db.delete(lu)
        db.flush()

    # Ensure all canonical users exist with password123
    for u_data in canonical_users:
        u_obj = db.query(User).filter(User.organization_id == 1, User.email == u_data["email"]).first()
        if not u_obj:
            u_obj = User(
                organization_id=1,
                email=u_data["email"],
                full_name=u_data["full_name"],
                hashed_password=hash_password("password123"),
                role=u_data["role"],
                department=u_data["department"],
                specialty=u_data["specialty"],
                is_active=True
            )
            db.add(u_obj)
            db.flush()
        else:
            u_obj.full_name = u_data["full_name"]
            u_obj.role = u_data["role"]
            u_obj.department = u_data["department"]
            u_obj.specialty = u_data["specialty"]
            u_obj.hashed_password = hash_password("password123")
            u_obj.is_active = True

        if u_data.get("tech_name"):
            tech_record = db.query(Technician).filter(Technician.name == u_data["tech_name"]).first()
            if tech_record:
                tech_record.user_id = u_obj.id

    db.commit()

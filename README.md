# AUOrbit — Autonomous University Operations Platform

AUOrbit is an institutional software platform designed to coordinate multi-agent operational dispatch, facilities maintenance, and classroom readiness across modern university campuses.

By fusing Gemini natural-language structured extraction with deterministic backend state authority, timetable-aware scheduling, and automated recovery loops, AUOrbit replaces fragmented, manual operations with verifiable, end-to-end autonomous resolution.

---

## 1. Operational Overview

### The Problem
Traditional campus operations rely on informal messaging channels, siloed ticketing queues, manual phone calls, and delayed responses when classroom infrastructure breaks. This leads to:
- **Disrupted Lectures**: Faulty projectors, lab power loss, or audio failures causing academic downtime.
- **Blind Dispatches**: Technicians dispatched without timetable context, arriving during active lectures or lacking required specialty skills.
- **Unverified Resolutions**: Tickets closed without physical operational verification, requiring duplicate manual follow-ups.

### The Solution
AUOrbit orchestrates campus incidents through an authentic multi-agent lifecycle:
1. **Report**: Student or faculty submits a natural-language description.
2. **Understand**: Gemini parses unstructured problem text into standardized categories and room candidates.
3. **Context**: Context Agent verifies space layout, equipment inventories, and live timetable occupancy.
4. **Prioritize**: Escalates urgency based on active lectures and academic impact.
5. **Resource**: Matches qualified specialists based on specialty, active load, and historical exclusions.
6. **Schedule**: Assigns conflict-free maintenance windows.
7. **Execute**: Technician receives task orders and records physical actions.
8. **Verify**: Verification Agent audits space restoration before incident closure.
9. **Replan (Self-Healing)**: If verification fails or a technician declines, the platform automatically excludes the prior resource, selects a replacement specialist, and restarts execution without human intervention.

---

## 2. Multi-Agent Pipeline & State Machine

```
   REPORT (Student / Faculty)
           │
           ▼
    UNDERSTANDING AGENT (Gemini NL Extraction)
           │
           ▼
      CONTEXT AGENT (Campus Space & Timetable Validation)
           │
           ▼
     PRIORITY AGENT (Timetable-Aware Urgency Escalation)
           │
           ▼
     RESOURCE AGENT (Specialist Capability Scoring)
           │
           ▼
    SCHEDULING AGENT (Slot Conflict Resolution)
           │
           ▼
    EXECUTION AGENT (Technician Work Order Logging)
           │
           ▼
   VERIFICATION AGENT (Sensor / Operational Audit)
           │
      ┌────┴────────────────────────┐
      ▼ (PASS)                      ▼ (FAIL / REJECTION)
   RESOLVED                      REOPENED / REPLANNING
                                    │
                                    ▼
                             REPLANNING AGENT
                         (Historical Exclusion +
                          New Specialist Selection)
                                    │
                                    ▼
                             NEW AGENT RUN
```

---

## 3. Technology Stack

- **Backend**: FastAPI (Python 3.11+), SQLAlchemy ORM, Pydantic v2
- **Database**: PostgreSQL / Supabase (with connection pooling and transaction safety)
- **AI Layer**: Google Gemini (`gemini-2.0-flash`) for structured JSON extraction
- **Frontend**: React 19, TypeScript, Vite, Vanilla CSS design token system (Burnt Sienna brand identity)
- **Real-Time Streaming**: Server-Sent Events (SSE) correlated with `AgentRun` and `AgentEvent` audit history
- **Security**: JWT tokens (HMAC-SHA256), PBKDF2 password hashing, RBAC, multi-tenant organization scoping

---

## 4. Repository Structure

```
AUOrbit/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── agents.py             # Multi-agent implementations & Gemini extraction
│   │   ├── auth.py               # RBAC, JWT, PBKDF2 hashing, tenant scoping
│   │   ├── bootstrap_admin.py    # Safe first-admin provisioning CLI
│   │   ├── config.py             # Environment configuration & validation
│   │   ├── database.py           # PostgreSQL pooling & schema initialization
│   │   ├── events.py             # In-process SSE broadcaster & event dispatch
│   │   ├── execution.py          # Work order tracking & operational state rules
│   │   ├── main.py               # FastAPI routers & lifecycle handlers
│   │   ├── models.py             # SQLAlchemy multi-tenant schema models
│   │   ├── notifications.py      # Non-blocking WhatsApp / Twilio alerting
│   │   ├── replanning.py         # Autonomous replanning & resource exclusion
│   │   ├── schemas.py            # Pydantic request / response schemas
│   │   ├── seed.py               # University reference data provisioning
│   │   ├── services.py           # Core deterministic orchestration engine
│   │   ├── state_machine.py      # Incident state transition guardrails
│   │   ├── tools.py              # Operational tool registry
│   │   └── verification.py       # Independent verification rules engine
│   ├── integrations/
│   │   └── n8n/                  # Optional external webhook workflow
│   ├── .env.example
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AdminConsole.tsx
│   │   │   ├── AgentExecutionTracker.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FacultyPortal.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── IncidentDetailModal.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── ResourcesView.tsx
│   │   │   ├── StudentPortal.tsx
│   │   │   ├── TechnicianPortal.tsx
│   │   │   └── WorkOrdersView.tsx
│   │   ├── api.ts                # REST & SSE client
│   │   ├── main.tsx              # App root & navigation router
│   │   ├── style.css             # Burnt Sienna design token system
│   │   └── types.ts              # Domain & API TypeScript definitions
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vercel.json
│   └── .env.example
├── README.md
└── .gitignore
```

---

## 5. Environment Variables & Secrets

### Backend (`backend/.env`)

```env
# Production PostgreSQL (Supabase / Managed PostgreSQL)
DATABASE_URL=postgresql+psycopg://postgres.<PROJECT_REF>:<DB_PASSWORD>@aws-0-<REGION>.pooler.supabase.com:6543/postgres

# Cryptographic JWT Secret (Minimum 32 random characters)
JWT_SECRET_KEY=generate_a_secure_64_character_random_hex_string_here

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
AI_PROVIDER=gemini
AI_MODEL=gemini-2.0-flash

# CORS Allowed Origins (Comma-separated)
CORS_ORIGINS=https://auorbit.vercel.app,http://localhost:5173

# Environment Flag
ENV=production
```

### Frontend (`frontend/.env`)

```env
# Deployed Backend API URL
VITE_API_BASE_URL=https://auorbit-backend.onrender.com/api
```

---

## 6. Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Configure .env with your GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

---

## 7. First Administrator Provisioning

Public self-registration is strictly restricted to `STUDENT` and `FACULTY` roles. Privileged roles (`SUPER_ADMIN`, `UNIVERSITY_ADMIN`, `ADMIN`, `TECHNICIAN`) cannot be registered through public forms.

To provision the first university administrator:

### Option A: Via Environment Variables (Automated)
```bash
cd backend
ADMIN_EMAIL="admin@anurag.edu.in" \
ADMIN_PASSWORD="YourSecurePassword123!" \
ADMIN_NAME="Campus Administrator" \
ADMIN_ROLE="SUPER_ADMIN" \
python -m app.bootstrap_admin
```

### Option B: Interactive CLI Prompt
```bash
cd backend
python -m app.bootstrap_admin
```
The script will prompt for email, full name, and password securely via masked terminal input and provision the account within the authoritative organization tenant.

---

## 8. Cloud Deployment Guide

### A. Database (Supabase PostgreSQL)
1. Log in to [Supabase](https://supabase.com) and create a project.
2. Go to **Project Settings** → **Database** → **Connection string** → **URI**.
3. Select the **Transaction Pooler** connection string (port 6543) or Direct connection (port 5432).
4. Set the connection string as `DATABASE_URL` in your backend deployment.

### B. Backend Deployment (Render)
1. Log in to [Render](https://render.com) and click **New** → **Web Service**.
2. Connect your Git repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables:
   - `DATABASE_URL`: Your Supabase PostgreSQL URI
   - `JWT_SECRET_KEY`: Long random hex string
   - `GEMINI_API_KEY`: Your Google AI Studio API key
   - `CORS_ORIGINS`: Your Vercel frontend URL
   - `ENV`: `production`

### C. Frontend Deployment (Vercel)
1. Log in to [Vercel](https://vercel.com) and import the Git repository.
2. Configure project settings:
   - **Root Directory**: `frontend`
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://<your-render-backend-url>.onrender.com/api`
4. Deploy.

---

## 9. Security & Multi-Tenant Model

- **Tenant Scoping**: All operational tables (`incidents`, `work_orders`, `agent_events`, `agent_runs`, `rooms`, `equipment`, `technicians`, `timetable_entries`) include an `organization_id` foreign key.
- **Server-Authoritative Identity**: The backend derives the active `organization_id` exclusively from the verified JWT payload and database user record.
- **RBAC Boundaries**:
  - `STUDENT`: Create incidents, view personal reports, track live execution status.
  - `FACULTY`: Create classroom incidents, view departmental status, verify repairs.
  - `TECHNICIAN`: View assigned work orders, log operational actions, mark completed or declined.
  - `ADMIN` / `UNIVERSITY_ADMIN`: Campus operational dashboard, full work order assignment, equipment registry, reference timetables.
  - `SUPER_ADMIN`: Cross-organization tenant management and platform administration.

---

## 10. Real-Time SSE Architecture & Scalability Boundary

### Current Implementation (Single Instance)
- Incident state transitions and agent execution events are broadcast via an in-process asynchronous `EventBroadcaster`.
- Frontend clients open a persistent connection to `GET /api/incidents/{incident_id}/stream`.
- **Database is the Source of Truth**: The broadcaster only pushes events after successful database transactions. If SSE reconnects, historical events and `AgentRuns` replay directly from PostgreSQL.

### Horizontal Scaling Roadmap
- In a horizontally scaled multi-worker deployment, the in-process broadcaster will be connected to PostgreSQL `LISTEN`/`NOTIFY` or a Redis pub/sub channel.
- Incident run sequences (`run_number = max + 1`) should use database row-level locking (`SELECT FOR UPDATE`) or a dedicated Postgres sequence for concurrent worker replanning.

---

## 11. University Reference Configuration

When the database is initialized, AUOrbit provisions idempotent reference campus infrastructure:
- **Campus**: Anurag University Main Campus (Hyderabad)
- **Buildings & Departments**: Academic Blocks A through I (CSE, AI/AIML, Pharmacy, Civil, ECE, Examination Branch, Seminar Halls)
- **Spaces & Equipment**: 27+ lecture halls, laboratories, smart boards, audio amplifiers, HVAC, and power backup units
- **Reference Timetable**: AY 2026-27 Regulation R24 schedule providing contextual evidence for priority escalation during active class periods
- **Zero Operational Clutter**: Fresh production installations start with **0 incidents, 0 fake complaints, and 0 fake work orders**.

---

## 12. Internal Presentation Demo (Presentation Only)

> [!WARNING]
> **PRESENTATION FIXTURE ONLY — DO NOT USE IN PRODUCTION**  
> The presentation fixture module (`app.presentation_demo`) is designed strictly for internal live demonstrations and rehearsals. It is completely isolated and is **never** executed by normal application startup or cloud production deployments.

### Overview
The fixture demonstrates AUOrbit's autonomous self-healing capability with an end-to-end classroom projector breakdown scenario:
- **Reporter:** `presentation.faculty@demo.local` (Role: `FACULTY`, Anurag University)
- **Incident:** *"The projector in Room I-302 is not working and the class is currently in progress."*
- **Pipeline:** `REPORT` → `UNDERSTAND` → `CONTEXT` → `PRIORITY (HIGH)` → `RESOURCE (Tech #1)` → `SCHEDULE` → `EXECUTE` → `VERIFY (FAIL: Optical lamp defect)` → `REOPEN` → `REPLAN (Exclude Tech #1)` → `RESOURCE (Tech #2)` → `SCHEDULE` → `EXECUTE` → `VERIFY (PASS: 3500 lux calibrated)` → `RESOLVED`

### Commands

#### Option A: Run Full Autonomous Workflow via CLI
Executes all stages of the multi-agent pipeline from report creation to verification failure, autonomous replanning, second execution, and resolution:
```bash
cd backend
python -m app.presentation_demo
```

#### Option B: Provision User for Live UI Demo
Creates only the presentation faculty user so the presenter can log in and submit the report manually via the frontend UI:
```bash
cd backend
python -m app.presentation_demo --user-only
```
- **Login Email:** `presentation.faculty@demo.local`
- **Password:** `AUOrbitDemo2026!` (or custom value supplied via `DEMO_PASSWORD` env variable)
- **Role:** `FACULTY`

#### Option C: Zero-Residue Cleanup
Deletes all presentation records (`Incidents`, `WorkOrders`, `AgentRuns`, `AgentEvents`, and presentation `User`), resets the Room I-302 projector back to `WORKING`, and resets technician statuses back to `AVAILABLE`:
```bash
cd backend
python -m app.presentation_demo --cleanup
```

---

## License & Operational Notice
Built for autonomous campus operations. All institutional and timetable records represent reference configuration data.


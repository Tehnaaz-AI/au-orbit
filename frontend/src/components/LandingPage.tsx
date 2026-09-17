import React, { useState } from 'react';
import { 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  RefreshCw, 
  Cpu, 
  Layers, 
  Clock, 
  Database, 
  UserCheck, 
  Activity, 
  ChevronRight,
  AlertTriangle, 
  Wrench, 
  Calendar, 
  Sparkles, 
  MapPin, 
  Check,
  Zap, 
  Radio, 
  Lock, 
  Flame,
  ClipboardList
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onTestScenario?: (description: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const [activePipelineStep, setActivePipelineStep] = useState(0);

  const pipelineSteps = [
    { name: 'REPORT', title: 'Natural Language Input', desc: 'Faculty or student submits plain English issue description without manual categorization.', icon: <Sparkles size={16} /> },
    { name: 'UNDERSTAND', title: 'Structured Extraction', desc: 'Extracts problem category, room location, and urgency with deterministic tool fallback.', icon: <Cpu size={16} /> },
    { name: 'CONTEXT', title: 'Campus Timetable Context', desc: 'Validates room space, equipment inventory, and active timetable schedules.', icon: <MapPin size={16} /> },
    { name: 'PRIORITIZE', title: 'Dynamic Urgency Escalation', desc: 'Escalates priority to High or Emergency if active lectures or exams are in progress.', icon: <Flame size={16} /> },
    { name: 'RESOURCE', title: 'Specialist Scoring', desc: 'Scores technicians by specialty match, active workload, and historical exclusions.', icon: <Wrench size={16} /> },
    { name: 'SCHEDULE', title: 'Conflict-Free Slot', desc: 'Allocates execution maintenance window adhering to campus operational policies.', icon: <Calendar size={16} /> },
    { name: 'EXECUTE', title: 'Digital Work Order', desc: 'Assigned specialist receives work order, performs repair, and records field notes.', icon: <Activity size={16} /> },
    { name: 'VERIFY', title: 'Operational Verification', desc: 'Audits physical restoration and space readiness before closing the incident.', icon: <Shield size={16} /> },
    { name: 'REPLAN', title: 'Autonomous Recovery Loop', desc: 'If verification fails, excludes prior resource and dispatches replacement autonomously.', icon: <RefreshCw size={16} /> }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 1. HERO SECTION */}
      <section style={{ 
        position: 'relative',
        borderBottom: '1px solid var(--border-subtle)', 
        padding: '5rem 1.5rem 4.5rem', 
        background: 'radial-gradient(ellipse at 50% 20%, rgba(227, 83, 54, 0.07) 0%, rgba(245, 245, 220, 0.3) 60%, var(--bg-page) 100%)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto' }}>
          
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.35rem 0.95rem', 
            background: '#FFFFFF', 
            borderRadius: 'var(--radius-full)', 
            border: '1px solid var(--border-default)',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-dark)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Autonomous University Operations
            </span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', lineHeight: 1.15, marginBottom: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
            From campus complaint to verified resolution — <span style={{ color: 'var(--color-primary)' }}>autonomously coordinated.</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-body)', maxWidth: '720px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            AUOrbit orchestrates natural-language reports, timetable context, specialist dispatch, independent physical verification, and self-healing recovery across university facilities.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-primary btn-lg" 
              onClick={onGetStarted}
            >
              Access Operations Console <ArrowRight size={16} />
            </button>
            <button 
              type="button" 
              className="btn btn-secondary btn-lg" 
              onClick={onSignIn}
            >
              Sign In to Portal
            </button>
          </div>

        </div>
      </section>

      {/* 2. HOW IT WORKS: 9-STAGE PIPELINE */}
      <section id="how-it-works" style={{ padding: '4.5rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Multi-Agent Architecture
            </span>
            <h2 style={{ fontSize: '1.85rem', marginTop: '0.25rem', color: 'var(--text-main)' }}>
              9-Stage Autonomous Lifecycle
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '640px', margin: '0.4rem auto 0' }}>
              Every incident transitions through deterministic operational checkpoints without requiring manual administrative triage.
            </p>
          </div>

          {/* Pipeline Interactive Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '0.4rem', marginBottom: '1.5rem' }}>
            {pipelineSteps.map((step, idx) => {
              const isActive = activePipelineStep === idx;
              return (
                <button
                  key={step.name}
                  type="button"
                  onClick={() => setActivePipelineStep(idx)}
                  style={{
                    padding: '0.65rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--color-primary)' : 'var(--border-subtle)',
                    background: isActive ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isActive ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                    0{idx + 1}
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                    {step.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Step Showcase Card */}
          <div className="card" style={{ padding: '1.75rem', background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' 
              }}>
                {pipelineSteps[activePipelineStep].icon}
              </div>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <span className="badge badge-role" style={{ marginBottom: '0.35rem' }}>
                  Stage 0{activePipelineStep + 1} · {pipelineSteps[activePipelineStep].name}
                </span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {pipelineSteps[activePipelineStep].title}
                </h3>
                <p style={{ color: 'var(--text-body)', fontSize: '0.92rem', margin: 0 }}>
                  {pipelineSteps[activePipelineStep].desc}
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. PRODUCT PREVIEW: LIVE TIMELINE & SELF-HEALING */}
      <section id="architecture" style={{ padding: '4.5rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-page)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="badge badge-neutral" style={{ marginBottom: '0.35rem' }}>
              Product Preview / Example Workflow
            </span>
            <h2 style={{ fontSize: '1.85rem', color: 'var(--text-main)' }}>
              Self-Healing Replanning Architecture
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '640px', margin: '0.4rem auto 0' }}>
              If physical verification detects an unresolved issue, AUOrbit triggers an autonomous replanning loop to assign a replacement specialist and verify recovery.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            
            {/* Run #1 Preview Card */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span className="badge badge-neutral mono">RUN 01</span>
                <span className="badge badge-danger">Verification Failed</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.84rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Understanding: Extracted Audio-Visual defect
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Context: Room I-302 (Active AI Lecture)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Priority: Escalated to EMERGENCY
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Resource: Assigned Specialist #1
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-error-text)', fontWeight: 600 }}>
                  <AlertTriangle size={14} /> Verification: Physical defect persists (Replan triggered)
                </li>
              </ul>
            </div>

            {/* Run #2 Preview Card */}
            <div className="card" style={{ padding: '1.25rem', borderColor: 'var(--status-success-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span className="badge badge-success mono">RUN 02</span>
                <span className="badge badge-success">Resolved & Verified</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.84rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <RefreshCw size={14} color="var(--color-primary)" /> Replanning: Specialist #1 excluded
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Resource: Alternate Specialist Assigned
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Schedule: Work Order #2 Generated
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Execute: Hardware calibration completed
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--status-success-text)', fontWeight: 700 }}>
                  <CheckCircle size={14} /> Verification: PASS (Classroom Restored)
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* 4. ROLES SECTION */}
      <section id="roles" style={{ padding: '4.5rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Role-Based Experience
            </span>
            <h2 style={{ fontSize: '1.85rem', color: 'var(--text-main)' }}>
              Tailored Portals for Campus Stakeholders
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            
            <div className="card">
              <span className="stat-label">Students</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)' }}>Frictionless Reporting</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Natural-language problem intake with live real-time status tracking and no technical jargon.
              </p>
            </div>

            <div className="card">
              <span className="stat-label">Faculty</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)' }}>Classroom Priority</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Timetable-linked space selector, automatic lecture urgency escalation, and sign-off verification.
              </p>
            </div>

            <div className="card">
              <span className="stat-label">Technicians</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)' }}>Work Order Queue</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                Structured task management with Start Job, field calibration notes, and completion triggers.
              </p>
            </div>

            <div className="card">
              <span className="stat-label">Administrators</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)' }}>Full Oversight</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                University-wide incident stream, specialist fleet capacity, room inventory, and agent telemetry.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section style={{ padding: '4.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-page)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Ready to experience autonomous operations?
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '1rem', marginBottom: '1.75rem' }}>
            Sign in with 1-click role presets to explore student, faculty, technician, and administrative workflows.
          </p>
          <button 
            type="button" 
            className="btn btn-primary btn-lg" 
            onClick={onSignIn}
          >
            Launch AUOrbit Portal <ArrowRight size={16} />
          </button>
        </div>
      </section>

    </div>
  );
};

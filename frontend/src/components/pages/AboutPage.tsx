import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Cpu, 
  RotateCcw, 
  Building2, 
  Calendar, 
  Users, 
  ArrowRight,
  Sparkles,
  GitBranch,
  Layers,
  CheckCircle2
} from 'lucide-react';

interface AboutPageProps {
  onBackToApp: () => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBackToApp }) => {
  const agents = [
    { name: 'Understanding Agent', desc: 'Parses noisy student/faculty reports and extracts problem category & urgency.' },
    { name: 'Context Agent', desc: 'Queries physical space topology, building floor, and instructional equipment.' },
    { name: 'Priority Agent', desc: 'Cross-references active lecture timetables to escalate disruptive outages.' },
    { name: 'Resource Agent', desc: 'Scores technician capability, current active workload, and proximity.' },
    { name: 'Scheduling Agent', desc: 'Calculates non-disruptive maintenance windows using timetable gaps.' },
    { name: 'Execution Agent', desc: 'Dispatches work orders to specialist mobile devices via WhatsApp & Web.' },
    { name: 'Observation Agent', desc: 'Monitors real-time task progress, timestamps, and technician check-ins.' },
    { name: 'Verification Agent', desc: 'Enforces independent faculty and ops head sign-off with before/after photos.' },
    { name: 'Replanning Agent', desc: 'Self-heals failed jobs by excluding unverified techs and rescheduling replacements.' }
  ];

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '3rem' }}>
      
      {/* Hero Header */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="card card-interactive"
        style={{ padding: '2.5rem 2rem', background: 'linear-gradient(135deg, #FFFFFF 0%, var(--color-primary-subtle) 100%)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span className="badge badge-role">Institutional Architecture</span>
          <span className="badge badge-neutral mono">v2.0.26</span>
        </div>

        <h1 style={{ fontSize: '2.1rem', color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: 1.2 }}>
          AUOrbit — Autonomous University Operations
        </h1>

        <p style={{ fontSize: '1.05rem', color: 'var(--text-body)', maxWidth: 760, lineHeight: 1.6 }}>
          AUOrbit turns raw natural-language campus problems into <span className="word-highlight">coordinated operational workflows</span> using 
          specialized autonomous agents, <span className="word-highlight-soft">real classroom context</span>, academic timetables, resource allocation, and <span className="word-highlight">closed-loop verification</span>.
        </p>

        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={onBackToApp}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            Return to Operational Hub <ArrowRight size={14} />
          </button>
        </div>
      </motion.div>

      {/* 9-Agent Operational Pipeline */}
      <div>
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Cpu size={22} color="var(--color-primary)" />
            The 9-Agent Autonomous Lifecycle
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Every incident flows deterministically through specialized agent stages with audit logging and SSE telemetry.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '0.85rem' }}>
          {agents.map((ag, i) => (
            <motion.div
              key={ag.name}
              whileHover={{ y: -3 }}
              className="card card-interactive"
              style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-primary-dark)' }}>
                  Stage {i + 1}: {ag.name}
                </span>
                <span className="badge badge-neutral mono" style={{ fontSize: '0.7rem' }}>Agent #{i + 1}</span>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', margin: 0 }}>
                {ag.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Core Architectural Pillars */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Calendar size={18} />
          </div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>Timetable-Aware Escalation</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
            Incidents reported in classrooms with active lecture sessions automatically receive Emergency priority and instant specialist dispatch.
          </p>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={18} />
          </div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>Closed-Loop Evidence Audit</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
            Work is never marked resolved until independent visual evidence is verified by faculty or operational leadership.
          </p>
        </div>

        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GitBranch size={18} />
          </div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', margin: 0 }}>Autonomous Multi-Agent Replanning</h3>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0 }}>
            If a repair is rejected or declined, AUOrbit autonomously replans: excludes the failed specialist, selects a backup, and reschedules without manual intervention.
          </p>
        </div>
      </div>

    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
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
  Flame
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onTestScenario?: (description: string) => void;
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.45, ease: "easeOut" } 
  }
};

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
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      
      {/* 1. HERO SECTION WITH AMBIENT GLOW */}
      <section style={{ 
        position: 'relative',
        borderBottom: '1px solid var(--border-subtle)', 
        padding: '5.5rem 1.5rem 5rem', 
        background: 'radial-gradient(ellipse at 50% 20%, rgba(227, 83, 54, 0.08) 0%, rgba(245, 245, 220, 0.4) 60%, var(--bg-page) 100%)',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        {/* Ambient Floating Orbs */}
        <div className="ambient-glow" style={{ top: '-10%', left: '10%' }} />
        <div className="ambient-glow" style={{ top: '20%', right: '10%', background: 'radial-gradient(circle, rgba(160, 82, 45, 0.09) 0%, transparent 70%)' }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          <motion.div 
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45 }}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.4rem 1.1rem', 
              background: 'rgba(255, 255, 255, 0.88)', 
              backdropFilter: 'blur(10px)',
              borderRadius: 'var(--radius-full)', 
              border: '1px solid var(--border-default)',
              marginBottom: '1.75rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span className="pulse-dot" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-dark)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Autonomous University Operations
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.08 }}
            style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.4rem)', lineHeight: 1.15, marginBottom: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}
          >
            From campus complaint to verified resolution — <span className="gradient-title">autonomously coordinated.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.16 }}
            style={{ fontSize: '1.1rem', color: 'var(--text-body)', maxWidth: '720px', margin: '0 auto 2rem', lineHeight: 1.6 }}
          >
            AUOrbit orchestrates natural-language reports, timetable context, specialist dispatch, independent physical verification, and self-healing recovery across university facilities.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.button 
              whileHover={{ scale: 1.04, y: -2, boxShadow: '0 8px 20px rgba(227, 83, 54, 0.28)' }}
              whileTap={{ scale: 0.96 }}
              type="button" 
              className="btn btn-primary btn-lg" 
              onClick={onGetStarted}
            >
              Access Operations Console <ArrowRight size={16} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              type="button" 
              className="btn btn-secondary btn-lg" 
              onClick={onSignIn}
            >
              Sign In to Portal
            </motion.button>
          </motion.div>

        </div>
      </section>

      {/* 2. HOW IT WORKS: 9-STAGE PIPELINE */}
      <section id="how-it-works" style={{ padding: '5rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={containerVariants}
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          >
            <motion.span variants={itemVariants} style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Multi-Agent Architecture
            </motion.span>
            <motion.h2 variants={itemVariants} style={{ fontSize: '1.85rem', marginTop: '0.25rem', color: 'var(--text-main)' }}>
              9-Stage Autonomous Lifecycle
            </motion.h2>
            <motion.p variants={itemVariants} style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '640px', margin: '0.4rem auto 0' }}>
              Every incident transitions through deterministic operational checkpoints without requiring manual administrative triage.
            </motion.p>
          </motion.div>

          {/* Pipeline Interactive Tabs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '0.45rem', marginBottom: '1.5rem' }}>
            {pipelineSteps.map((step, idx) => {
              const isActive = activePipelineStep === idx;
              return (
                <motion.button
                  key={step.name}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => setActivePipelineStep(idx)}
                  style={{
                    padding: '0.7rem 0.5rem',
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
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(227, 83, 54, 0.15)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isActive ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                    0{idx + 1}
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700 }}>
                    {step.name}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* Active Step Showcase Card with AnimatePresence */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activePipelineStep}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              className="card card-interactive" 
              style={{ padding: '1.85rem', background: 'var(--bg-surface)', borderColor: 'var(--border-default)' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem', flexWrap: 'wrap' }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
                  boxShadow: '0 4px 12px rgba(227, 83, 54, 0.12)'
                }}>
                  {pipelineSteps[activePipelineStep].icon}
                </div>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <span className="badge badge-role" style={{ marginBottom: '0.35rem' }}>
                    Stage 0{activePipelineStep + 1} · {pipelineSteps[activePipelineStep].name}
                  </span>
                  <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                    {pipelineSteps[activePipelineStep].title}
                  </h3>
                  <p style={{ color: 'var(--text-body)', fontSize: '0.94rem', margin: 0, lineHeight: 1.6 }}>
                    {pipelineSteps[activePipelineStep].desc}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* 3. PRODUCT PREVIEW: LIVE TIMELINE & SELF-HEALING */}
      <section id="architecture" style={{ padding: '5rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-page)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={containerVariants}
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          >
            <motion.span variants={itemVariants} className="badge badge-neutral" style={{ marginBottom: '0.35rem' }}>
              Product Preview / Example Workflow
            </motion.span>
            <motion.h2 variants={itemVariants} style={{ fontSize: '1.85rem', color: 'var(--text-main)' }}>
              Self-Healing Replanning Architecture
            </motion.h2>
            <motion.p variants={itemVariants} style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: '640px', margin: '0.4rem auto 0' }}>
              If physical verification detects an unresolved issue, AUOrbit triggers an autonomous replanning loop to assign a replacement specialist and verify recovery.
            </motion.p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            
            {/* Run #1 Preview Card */}
            <motion.div 
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="card card-interactive" 
              style={{ padding: '1.35rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span className="badge badge-neutral mono">RUN 01</span>
                <span className="badge badge-danger">Verification Failed</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.86rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Understanding: Extracted Audio-Visual defect
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Context: Room I-302 (Active AI Lecture)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Priority: Escalated to EMERGENCY
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Resource: Assigned Specialist #1
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--status-error-text)', fontWeight: 600 }}>
                  <AlertTriangle size={14} /> Verification: Physical defect persists (Replan triggered)
                </li>
              </ul>
            </motion.div>

            {/* Run #2 Preview Card */}
            <motion.div 
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="card card-interactive" 
              style={{ padding: '1.35rem', borderColor: 'var(--status-success-border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span className="badge badge-success mono">RUN 02</span>
                <span className="badge badge-success">Resolved & Verified</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.86rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <RefreshCw size={14} color="var(--color-primary)" /> Replanning: Specialist #1 excluded
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Resource: Alternate Specialist Assigned
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Schedule: Work Order #2 Generated
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success-text)" /> Execute: Hardware calibration completed
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--status-success-text)', fontWeight: 700 }}>
                  <CheckCircle size={14} /> Verification: PASS (Classroom Restored)
                </li>
              </ul>
            </motion.div>

          </div>

        </div>
      </section>

      {/* 4. ROLES SECTION */}
      <section id="roles" style={{ padding: '5rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={containerVariants}
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          >
            <motion.span variants={itemVariants} style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Role-Based Experience
            </motion.span>
            <motion.h2 variants={itemVariants} style={{ fontSize: '1.85rem', color: 'var(--text-main)' }}>
              Tailored Portals for Campus Stakeholders
            </motion.h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            
            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="card card-interactive"
            >
              <span className="stat-label">Students</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)' }}>Frictionless Reporting</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                Natural-language problem intake with live real-time status tracking and zero technical jargon.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="card card-interactive"
            >
              <span className="stat-label">Faculty</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)' }}>Classroom Priority</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                Timetable-linked space selector, automatic lecture urgency escalation, and sign-off verification.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="card card-interactive"
            >
              <span className="stat-label">Technicians</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)' }}>Work Order Queue</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                Structured task management with Start Job, field calibration notes, and completion triggers.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="card card-interactive"
            >
              <span className="stat-label">Administrators</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)' }}>Full Oversight</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                University-wide incident stream, specialist fleet capacity, room inventory, and agent telemetry.
              </p>
            </motion.div>

          </div>

        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center', background: 'var(--bg-page)', position: 'relative', overflow: 'hidden' }}>
        <div className="ambient-glow" style={{ bottom: '-20%', left: '35%' }} />
        
        <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '2.1rem', color: 'var(--text-main)', marginBottom: '0.75rem' }}>
            Ready to experience autonomous operations?
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '1.05rem', marginBottom: '1.75rem' }}>
            Sign in with 1-click role presets to explore student, faculty, technician, and administrative workflows.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05, y: -2, boxShadow: '0 8px 22px rgba(227, 83, 54, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            type="button" 
            className="btn btn-primary btn-lg" 
            onClick={onSignIn}
          >
            Launch AUOrbit Portal <ArrowRight size={16} />
          </motion.button>
        </div>
      </section>

    </div>
  );
};

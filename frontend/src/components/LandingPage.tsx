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
  Flame,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock
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
      staggerChildren: 0.08,
      delayChildren: 0.05
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { duration: 0.45, ease: "easeOut" } 
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn }) => {
  const [activePipelineStep, setActivePipelineStep] = useState(0);

  const pipelineSteps = [
    { name: 'REPORT', title: 'Multimodal Problem Intake', desc: 'Faculty, students, or staff submit natural language descriptions with photo/video problem evidence.', icon: <Sparkles size={16} /> },
    { name: 'UNDERSTAND', title: 'Structured Extraction', desc: 'Identifies problem category, equipment item, and spatial coordinates with deterministic tool fallback.', icon: <Cpu size={16} /> },
    { name: 'CONTEXT', title: 'Campus Spatial & Timetable Context', desc: 'Validates room space, equipment telemetry, active instructional schedules, and lecture impact.', icon: <MapPin size={16} /> },
    { name: 'PRIORITIZE', title: 'Dynamic Urgency Escalation', desc: 'Escalates priority to High or Emergency if active lectures, labs, or scheduled exams are impacted.', icon: <Flame size={16} /> },
    { name: 'RESOURCE', title: 'Specialist Scoring & Selection', desc: 'Scores technicians by specialty match, active workload, and historical verification exclusions.', icon: <Wrench size={16} /> },
    { name: 'SCHEDULE', title: 'Conflict-Free Slot Allocation', desc: 'Allocates execution maintenance window adhering to campus operational timetables.', icon: <Calendar size={16} /> },
    { name: 'EXECUTE', title: 'Digital Work Order & Proof', desc: 'Assigned specialist starts job, records calibration notes, and uploads photo/video repair evidence.', icon: <Activity size={16} /> },
    { name: 'VERIFY', title: 'Side-by-Side Visual Audit', desc: 'Faculty, Operational Head, or independent agents compare Before vs After proof to certify readiness.', icon: <Shield size={16} /> },
    { name: 'REPLAN', title: 'Autonomous Recovery Loop', desc: 'If verification fails, excludes prior specialist and autonomously dispatches replacement.', icon: <RefreshCw size={16} /> }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      
      {/* 1. HERO SECTION WITH AMBIENT GLOW */}
      <section style={{ 
        position: 'relative',
        borderBottom: '1px solid var(--border-subtle)', 
        padding: '5.5rem 1.5rem 5rem', 
        background: 'radial-gradient(ellipse at 50% 18%, rgba(227, 83, 54, 0.09) 0%, rgba(245, 245, 220, 0.45) 55%, var(--bg-page) 100%)',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        {/* Ambient Floating Orbs */}
        <div className="ambient-glow" style={{ top: '-10%', left: '10%' }} />
        <div className="ambient-glow" style={{ top: '20%', right: '10%', background: 'radial-gradient(circle, rgba(160, 82, 45, 0.09) 0%, transparent 70%)' }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          
          {/* Soft Gradient Light Beam Falling Directly onto Middle Text */}
          <div className="theatrical-spotlight-container" aria-hidden="true">
            <div className="spotlight-conic-shaft" />
            <div className="spotlight-rays-overlay" />
            
            {/* Floating Suspended Dust Particles in Light Shaft */}
            <div className="spotlight-dust-mote mote-1" />
            <div className="spotlight-dust-mote mote-2" />
            <div className="spotlight-dust-mote mote-3" />
            <div className="spotlight-dust-mote mote-4" />
            <div className="spotlight-dust-mote mote-5" />
            <div className="spotlight-dust-mote mote-6" />
            <div className="spotlight-dust-mote mote-7" />
          </div>

          <motion.div 
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45 }}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.65rem', 
              padding: '0.4rem 1.15rem', 
              background: 'var(--bg-card)', 
              backdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-full)', 
              border: '1px solid var(--border-default)',
              marginBottom: '1.5rem',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span className="pulse-dot" />
            <img src="/logo.png" alt="AUOrbit" style={{ height: 22, objectFit: 'contain' }} />
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--color-primary-dark)', letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-heading)' }}>
              Autonomous Campus Operations
            </span>
          </motion.div>

          <motion.h1 
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: { staggerChildren: 0.09, delayChildren: 0.05 }
              }
            }}
            style={{ fontSize: 'clamp(2.3rem, 4.8vw, 3.6rem)', lineHeight: 1.15, marginBottom: '1.25rem', color: 'var(--text-main)', letterSpacing: '-0.03em', fontFamily: 'var(--font-heading)', fontWeight: 800 }}
          >
            {["From", "campus", "complaint", "to", "verified", "resolution", "—"].map((word, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
                  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: 'easeOut' } }
                }}
                style={{ display: 'inline-block', marginRight: '0.3em' }}
              >
                {word}
              </motion.span>
            ))}
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: 'easeOut' } }
              }}
              className="word-highlight"
              style={{ display: 'inline-block', marginRight: '0.3em' }}
            >
              autonomously
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 18, filter: 'blur(4px)' },
                visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: 'easeOut' } }
              }}
              className="word-highlight-soft"
              style={{ display: 'inline-block' }}
            >
              coordinated.
            </motion.span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 16, filter: 'blur(2px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, delay: 0.35 }}
            style={{ fontSize: '1.12rem', color: 'var(--text-body)', maxWidth: '740px', margin: '0 auto 2rem', lineHeight: 1.6 }}
          >
            AUOrbit orchestrates <span className="word-highlight-soft">multimodal reporting</span>, real timetable context, <span className="word-highlight">specialist dispatch</span>, side-by-side Before/After verification, and <span className="word-highlight-soft">self-healing</span> replanning loops across campus facilities.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24 }}
            style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            <motion.button 
              whileHover={{ scale: 1.04, y: -2, boxShadow: '0 8px 22px rgba(227, 83, 54, 0.28)' }}
              whileTap={{ scale: 0.96 }}
              type="button" 
              className="btn btn-primary" 
              onClick={onGetStarted}
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.95rem' }}
            >
              Access Operations Console <ArrowRight size={16} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              type="button" 
              className="btn btn-secondary" 
              onClick={onSignIn}
              style={{ padding: '0.65rem 1.4rem', fontSize: '0.95rem' }}
            >
              Sign In to Portal
            </motion.button>
          </motion.div>

          {/* Real-time Capability Pills */}
          <motion.div 
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.32 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', marginTop: '2.5rem', flexWrap: 'wrap' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <CheckCircle2 size={15} color="var(--primary-dark)" /> 9-Agent Deterministic Pipeline
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <ShieldCheck size={15} color="var(--primary-dark)" /> Before vs. After Visual Proof
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Lock size={15} color="var(--primary-dark)" /> Strict RBAC & Tenant Isolation
            </div>
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
            <motion.span variants={itemVariants} style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-heading)' }}>
              Multi-Agent Architecture
            </motion.span>
            <motion.h2 variants={itemVariants} style={{ fontSize: '1.95rem', marginTop: '0.25rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
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
                    padding: '0.75rem 0.5rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: isActive ? 'var(--primary-dark)' : 'var(--border-subtle)',
                    background: isActive ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                    color: isActive ? 'var(--primary-dark)' : 'var(--text-main)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isActive ? '0 4px 12px rgba(227, 83, 54, 0.15)' : 'none'
                  }}
                >
                  <span style={{ fontSize: '0.68rem', fontWeight: 700, color: isActive ? 'var(--primary-dark)' : 'var(--text-muted)' }}>
                    0{idx + 1}
                  </span>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
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
                  width: 50, height: 50, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)',
                  boxShadow: '0 4px 12px rgba(227, 83, 54, 0.12)'
                }}>
                  {pipelineSteps[activePipelineStep].icon}
                </div>
                <div style={{ flex: 1, minWidth: '240px' }}>
                  <span className="badge badge-role" style={{ marginBottom: '0.35rem' }}>
                    Stage 0{activePipelineStep + 1} · {pipelineSteps[activePipelineStep].name}
                  </span>
                  <h3 style={{ fontSize: '1.35rem', color: 'var(--text-main)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
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
              Operational Architecture
            </motion.span>
            <motion.h2 variants={itemVariants} style={{ fontSize: '1.95rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
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
              style={{ padding: '1.4rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span className="badge badge-neutral mono">RUN 01</span>
                <span className="badge badge-danger">Verification Failed</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.86rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success)" /> Understanding: Extracted Audio-Visual defect
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success)" /> Context: Room I-302 (Active AI Lecture)
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success)" /> Priority: Escalated to EMERGENCY
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success)" /> Resource: Assigned Specialist #1
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--status-danger)', fontWeight: 600 }}>
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
              style={{ padding: '1.4rem', borderColor: 'var(--status-success-border)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span className="badge badge-success mono">RUN 02</span>
                <span className="badge badge-success">Resolved & Verified</span>
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.86rem' }}>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <RefreshCw size={14} color="var(--primary-dark)" /> Replanning: Specialist #1 excluded
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success)" /> Resource: Alternate Specialist Assigned
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success)" /> Schedule: Work Order #2 Generated
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Check size={14} color="var(--status-success)" /> Execute: Hardware calibration completed with proof
                </li>
                <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--status-success)', fontWeight: 700 }}>
                  <CheckCircle size={14} /> Verification: PASS (Classroom Restored)
                </li>
              </ul>
            </motion.div>

          </div>

        </div>
      </section>

      {/* 4. ROLES SECTION (Includes Operational Head) */}
      <section id="roles" style={{ padding: '5rem 1.5rem', borderBottom: '1px solid var(--border-subtle)', background: '#FFFFFF' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            variants={containerVariants}
            style={{ textAlign: 'center', marginBottom: '2.5rem' }}
          >
            <motion.span variants={itemVariants} style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--primary-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-heading)' }}>
              Role-Based Experience
            </motion.span>
            <motion.h2 variants={itemVariants} style={{ fontSize: '1.95rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              Tailored Portals for Campus Stakeholders
            </motion.h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.15rem' }}>
            
            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="card card-interactive"
            >
              <span className="stat-label">Students</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>Frictionless Reporting</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                Natural-language problem intake with photo/video upload and real-time status tracking.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="card card-interactive"
            >
              <span className="stat-label">Faculty</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>Classroom Priority</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                Timetable-linked space selector, automatic lecture urgency escalation, and sign-off verification.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="card card-interactive"
            >
              <span className="stat-label">Technicians</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>Work Order Queue</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                Shift status toggles, Start Job triggers, resolution proof uploads, and completion logging.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="card card-interactive"
            >
              <span className="stat-label">Operational Heads</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>Campus Oversight</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                Reassign work orders, inspect Before/After evidence, and perform authoritative resolution audits.
              </p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="card card-interactive"
            >
              <span className="stat-label">Super Admins</span>
              <h3 style={{ fontSize: '1.05rem', margin: '0.25rem 0 0.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>Full Governance</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.55 }}>
                Manage user roster, toggle venue/equipment availability, and view autonomous agent telemetry.
              </p>
            </motion.div>

          </div>

        </div>
      </section>

      {/* 5. CALL TO ACTION */}
      <section style={{ padding: '5rem 1.5rem', textAlign: 'center', background: 'var(--bg-page)', position: 'relative', overflow: 'hidden' }}>
        <div className="ambient-glow" style={{ bottom: '-20%', left: '35%' }} />
        
        <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{ fontSize: '2.1rem', color: 'var(--text-main)', marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>
            Ready to experience autonomous operations?
          </h2>
          <p style={{ color: 'var(--text-body)', fontSize: '1.05rem', marginBottom: '1.75rem' }}>
            Sign in with 1-click role presets to explore student, faculty, technician, and administrative workspaces.
          </p>
          <motion.button 
            whileHover={{ scale: 1.05, y: -2, boxShadow: '0 8px 22px rgba(227, 83, 54, 0.3)' }}
            whileTap={{ scale: 0.95 }}
            type="button" 
            className="btn btn-primary" 
            onClick={onSignIn}
            style={{ padding: '0.75rem 1.6rem', fontSize: '1rem' }}
          >
            Launch AUOrbit Portal <ArrowRight size={16} />
          </motion.button>
        </div>
      </section>

    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { 
  ArrowRight, CheckCircle2, Shield, RefreshCw, Cpu, 
  Layers, Clock, Database, UserCheck, Activity, ChevronRight,
  AlertTriangle, Wrench, Calendar, Sparkles, MapPin, Check,
  Zap, Radio, Eye, Lock, ArrowUpRight, Flame
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onTestScenario?: (description: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn, onTestScenario }) => {
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'FACULTY' | 'TECHNICIAN' | 'ADMIN'>('FACULTY');
  const [activePipelineStep, setActivePipelineStep] = useState(0);

  const pipelineSteps = [
    { name: 'REPORT', title: 'Natural Language Input', desc: 'Faculty or student submits plain English issue description without manual categorization', icon: <Sparkles size={16} /> },
    { name: 'UNDERSTAND', title: 'Structured Extraction', desc: 'Gemini AI extracts problem type, space code, and urgency with deterministic fallback', icon: <Cpu size={16} /> },
    { name: 'CONTEXT', title: 'Campus Timetable Context', desc: 'Context Agent validates room location, equipment catalog, and live lecture occupancy', icon: <MapPin size={16} /> },
    { name: 'PRIORITISE', title: 'Dynamic Urgency Escalation', desc: 'Escalates priority to HIGH/EMERGENCY if active lecture is in progress in that space', icon: <Flame size={16} /> },
    { name: 'RESOURCE', title: 'Specialist Scoring', desc: 'Resource Agent scores technicians by specialty, workload, and historical exclusions', icon: <Wrench size={16} /> },
    { name: 'SCHEDULE', title: 'Conflict-Free Slot', desc: 'Scheduling Agent books maintenance window adhering to institutional policy', icon: <Calendar size={16} /> },
    { name: 'EXECUTE', title: 'Digital Work Order', desc: 'Assigned specialist receives work order, starts task, and records field notes', icon: <Activity size={16} /> },
    { name: 'VERIFY', title: 'Operational Verification', desc: 'Verification Agent audits physical space restoration before incident sign-off', icon: <CheckCircle2 size={16} /> },
    { name: 'REPLAN', title: 'Autonomous Recovery Loop', desc: 'If verification fails, excludes technician and dispatches replacement autonomously', icon: <RefreshCw size={16} /> }
  ];

  const recoverySteps = [
    {
      step: '1',
      title: 'Initial Autonomous Dispatch (Run #1)',
      desc: 'Faculty reports faulty projector in Room I-302. System assesses active lecture timetable, assigns specialist Arjun R., and creates Work Order #1.',
      status: 'ASSIGNED',
      badgeClass: 'badge-info',
      color: '#2563EB'
    },
    {
      step: '2',
      title: 'Physical Verification Failure',
      desc: 'Specialist completes work, but independent optical audit detects defective lamp (0 lux output). Work Order #1 is cancelled; technician added to exclusion list.',
      status: 'VERIFICATION_FAILED',
      badgeClass: 'badge-danger',
      color: '#DC2626'
    },
    {
      step: '3',
      title: 'Autonomous Replanning (Run #2)',
      desc: 'Replanning Agent excludes prior technician, selects alternative specialist Kavya S., creates replacement Work Order #2, and reschedules execution.',
      status: 'AUTONOMOUS_RECOVERY',
      badgeClass: 'badge-replan',
      color: '#D97706'
    },
    {
      step: '4',
      title: 'Verified Resolution & Space Ready',
      desc: 'Replacement specialist installs high-lumen optical unit. Verification audit confirms 3500 lux output. Room I-302 returns to WORKING state.',
      status: 'RESOLVED',
      badgeClass: 'badge-success',
      color: '#16A34A'
    }
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.5, ease: "easeOut" } 
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-page)', minHeight: '100vh', display: 'flex', flexDirection: 'column', overflowX: 'hidden' }}>
      
      {/* 1. HERO SECTION WITH AMBIENT GLOW */}
      <section style={{ 
        position: 'relative',
        borderBottom: '1px solid var(--border-subtle)', 
        padding: '6rem 1.5rem 5rem', 
        background: 'radial-gradient(ellipse at 50% 20%, rgba(227, 83, 54, 0.08) 0%, rgba(245, 245, 220, 0.4) 60%, var(--bg-page) 100%)',
        overflow: 'hidden'
      }}>
        {/* Ambient decorative light orbs */}
        <div className="ambient-glow" style={{ top: '-10%', left: '15%' }} />
        <div className="ambient-glow" style={{ top: '20%', right: '10%', background: 'radial-gradient(circle, rgba(160, 82, 45, 0.1) 0%, transparent 70%)' }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          
          <motion.div 
            initial={{ opacity: 0, y: -16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '0.6rem', 
              padding: '0.45rem 1.15rem', 
              background: 'rgba(255, 255, 255, 0.85)', 
              backdropFilter: 'blur(8px)',
              borderRadius: 'var(--radius-full)', 
              border: '1px solid var(--color-primary-soft)',
              marginBottom: '1.75rem',
              boxShadow: '0 4px 14px rgba(227, 83, 54, 0.1)'
            }}
          >
            <span className="pulse-dot" />
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-dark)', letterSpacing: '0.02em' }}>
              Deterministic Multi-Agent Campus Operations Platform
            </span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            style={{ 
              fontSize: 'clamp(2.4rem, 5.5vw, 4rem)', 
              fontWeight: 800, 
              letterSpacing: '-0.035em', 
              color: 'var(--text-main)', 
              marginBottom: '1.4rem',
              lineHeight: 1.12 
            }}
          >
            From Campus Breakdown to <br />
            <span className="gradient-title">Verified Resolution</span> Autonomously.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            style={{ 
              fontSize: 'clamp(1.05rem, 2.1vw, 1.25rem)', 
              color: 'var(--text-body)', 
              maxWidth: '840px', 
              margin: '0 auto 2.75rem',
              lineHeight: 1.65 
            }}
          >
            AUOrbit fuses <b>Gemini structured understanding</b> with <b>deterministic timetable authority</b>, automated specialist allocation, and closed-loop self-healing recovery for modern universities.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}
          >
            <motion.button 
              type="button"
              className="btn btn-primary btn-lg" 
              onClick={onGetStarted}
              whileHover={{ scale: 1.03, y: -2, boxShadow: '0 12px 24px -4px rgba(227, 83, 54, 0.3)' }}
              whileTap={{ scale: 0.97 }}
              style={{ padding: '0.9rem 2.2rem', fontSize: '1.05rem' }}
            >
              Launch Live Platform <ArrowRight size={18} />
            </motion.button>
            <motion.button 
              type="button"
              className="btn btn-secondary btn-lg"
              whileHover={{ scale: 1.03, y: -2, borderColor: 'var(--color-primary)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{ padding: '0.9rem 2rem', fontSize: '1.05rem' }}
            >
              Explore Agent Architecture
            </motion.button>
          </motion.div>

        </div>
      </section>

      {/* 2. PROBLEM & SOLUTION CONTRAST */}
      <section style={{ padding: '5rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '3.25rem' }}
          >
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Why Campus Operations Break Down
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--text-muted)' }}>
              Traditional facilities ticketing operates in silos, blind to live academic timetables and devoid of post-repair verification.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.75rem' }}>
            
            {/* Legacy Operations Card */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5, boxShadow: '0 12px 24px -6px rgba(47, 47, 47, 0.08)' }}
              className="card" 
              style={{ borderLeft: '4px solid var(--border-default)', background: '#FFFFFF', padding: '1.75rem' }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.04em' }}>
                Fragmented Legacy Operations
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--text-body)' }}>
                  <span style={{ color: 'var(--status-error-text)', fontWeight: 800 }}>✕</span>
                  <span>Ambiguous problem reporting across uncoordinated WhatsApp groups without physical room validation.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--text-body)' }}>
                  <span style={{ color: 'var(--status-error-text)', fontWeight: 800 }}>✕</span>
                  <span>Technicians dispatched blindly without knowing active timetable schedules, disrupting live lectures.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--text-body)' }}>
                  <span style={{ color: 'var(--status-error-text)', fontWeight: 800 }}>✕</span>
                  <span>Zero physical verification when tickets close; incomplete repairs require repeated manual complaints.</span>
                </li>
              </ul>
            </motion.div>

            {/* AUOrbit Autonomous Flow Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              whileHover={{ y: -5, boxShadow: '0 16px 30px -6px rgba(227, 83, 54, 0.16)', borderColor: 'var(--color-primary-soft)' }}
              className="card" 
              style={{ borderLeft: '4px solid var(--color-primary)', background: '#FFFFFF', padding: '1.75rem' }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.04em' }}>
                AUOrbit Autonomous Orchestration
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--text-body)' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Gemini extraction interprets natural language into standardized equipment classifications & space codes.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--text-body)' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Timetable-aware priority escalation matches qualified specialists with live workload balancing.</span>
                </li>
                <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.92rem', color: 'var(--text-body)' }}>
                  <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span>Independent verification audits and self-healing replanning automatically resolve failed repairs.</span>
                </li>
              </ul>
            </motion.div>

          </div>

        </div>
      </section>

      {/* 3. HOW AUORBIT WORKS: OPERATIONAL PIPELINE */}
      <section id="how-it-works" style={{ padding: '5rem 1.5rem', background: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <span className="badge badge-role" style={{ marginBottom: '0.5rem' }}>Deterministic Multi-Agent Pipeline</span>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              How AUOrbit Coordinates Execution
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--text-muted)' }}>
              Every campus incident passes through an authentic 9-stage operational lifecycle with server-authoritative state guardrails.
            </p>
          </motion.div>

          {/* Interactive Pipeline Steps Navigator */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
            gap: '0.45rem', 
            marginBottom: '2rem',
            padding: '0.75rem',
            background: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            {pipelineSteps.map((step, idx) => {
              const isSelected = activePipelineStep === idx;
              return (
                <motion.button
                  key={step.name}
                  type="button"
                  onClick={() => setActivePipelineStep(idx)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.55rem 0.35rem',
                    borderRadius: 'var(--radius-xs)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--color-primary)' : 'transparent',
                    background: isSelected ? 'var(--color-primary-subtle)' : '#FFFFFF',
                    color: isSelected ? 'var(--color-primary-dark)' : 'var(--text-main)',
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: '0.72rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ color: isSelected ? 'var(--color-primary)' : 'var(--text-dim)', marginBottom: 2 }}>
                    {step.icon}
                  </div>
                  <span>{step.name}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Active Step Showcase Card */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={activePipelineStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="card"
              style={{ 
                padding: '1.75rem', 
                background: 'linear-gradient(135deg, #FFFFFF 0%, var(--bg-surface) 100%)', 
                borderColor: 'var(--color-primary-soft)',
                boxShadow: 'var(--shadow-md)',
                marginBottom: '3rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>Stage 0{activePipelineStep + 1}</span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>
                  {pipelineSteps[activePipelineStep].title}
                </h3>
              </div>
              <p style={{ fontSize: '0.95rem', color: 'var(--text-body)', lineHeight: 1.6 }}>
                {pipelineSteps[activePipelineStep].desc}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Grid of Core Pipeline Architecture Cards */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '1.5rem' }}
          >
            
            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 16px 28px -6px rgba(227, 83, 54, 0.14)' }} className="card-interactive">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-role">01</span>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Natural Language Understanding</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Gemini structured extraction interprets messy reports into category, problem type, and target room, backed by deterministic rule-based fallback.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 16px 28px -6px rgba(227, 83, 54, 0.14)' }} className="card-interactive">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-role">02</span>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Campus Context & Timetable</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Context Agent validates physical room existence, equipment inventories, and current academic timetable occupancy to evaluate operational impact.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 16px 28px -6px rgba(227, 83, 54, 0.14)' }} className="card-interactive">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-role">03</span>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Specialist Scoring & Scheduling</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Resource Agent evaluates technical specialty, active workload, and historical exclusions. Scheduling Agent finds conflict-free maintenance windows.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 16px 28px -6px rgba(227, 83, 54, 0.14)' }} className="card-interactive">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-role">04</span>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Controlled Execution & Observation</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Authorized technicians receive work orders, record operational actions, and transition equipment status within strict state machine constraints.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 16px 28px -6px rgba(227, 83, 54, 0.14)' }} className="card-interactive">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-role">05</span>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Independent Verification</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                Verification Agent validates that the restored space is fully operational and timetable conflicts are resolved before closing the incident.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 16px 28px -6px rgba(227, 83, 54, 0.14)' }} className="card-interactive" style={{ borderColor: 'var(--status-replan-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span className="badge badge-replan">06</span>
                <h3 style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>Autonomous Self-Healing Replanning</h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                If verification fails or a technician declines, Replanning Agent automatically excludes the prior resource and assigns an alternative specialist.
              </p>
            </motion.div>

          </motion.div>

        </div>
      </section>

      {/* 4. ENTERPRISE CAPABILITIES SECTION */}
      <section id="capabilities" style={{ padding: '5rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '3.25rem' }}
          >
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Enterprise Operational Capabilities
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--text-muted)' }}>
              Engineered specifically for complex university campuses with hundreds of teaching spaces and active lecture schedules.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}
          >
            
            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 14px 28px -6px rgba(227, 83, 54, 0.15)' }} className="card-interactive">
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '0.85rem' }}>
                <Sparkles size={22} />
              </div>
              <h3 style={{ fontSize: '1.02rem', marginBottom: '0.35rem' }}>Natural Language Extraction</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Interprets natural-language descriptions into structured classifications without forcing users into rigid ticket drop-downs.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 14px 28px -6px rgba(227, 83, 54, 0.15)' }} className="card-interactive">
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '0.85rem' }}>
                <Calendar size={22} />
              </div>
              <h3 style={{ fontSize: '1.02rem', marginBottom: '0.35rem' }}>Timetable Awareness</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Cross-references reference class schedules to escalate emergency priorities and prevent noisy maintenance during lectures.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 14px 28px -6px rgba(227, 83, 54, 0.15)' }} className="card-interactive">
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '0.85rem' }}>
                <Wrench size={22} />
              </div>
              <h3 style={{ fontSize: '1.02rem', marginBottom: '0.35rem' }}>Specialist Allocation</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Matches technician specialties (AV, Electrical, AC, Network, Plumbing) with dynamic workload scoring.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 14px 28px -6px rgba(227, 83, 54, 0.15)' }} className="card-interactive">
              <div style={{ width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', marginBottom: '0.85rem' }}>
                <RefreshCw size={22} />
              </div>
              <h3 style={{ fontSize: '1.02rem', marginBottom: '0.35rem' }}>Autonomous Recovery</h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Self-healing state machine automatically replans on verification failure or technician decline without manual intervention.
              </p>
            </motion.div>

          </motion.div>

        </div>
      </section>

      {/* 5. AUTONOMOUS RECOVERY WALKTHROUGH */}
      <section style={{ padding: '5rem 1.5rem', background: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '3rem' }}
          >
            <span className="badge badge-replan" style={{ marginBottom: '0.5rem' }}>Resilient Architecture</span>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Autonomous Self-Healing in Action
            </h2>
            <p style={{ maxWidth: '600px', margin: '0 auto', color: 'var(--text-muted)' }}>
              How AUOrbit guarantees resolution continuity when physical repairs encounter unexpected obstacles.
            </p>
          </motion.div>

          <div className="card" style={{ padding: '2.25rem', background: '#FFFFFF', boxShadow: 'var(--shadow-md)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              {recoverySteps.map((rec, index) => (
                <motion.div 
                  key={rec.step} 
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ x: 4 }}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '1.15rem' }}
                >
                  <div style={{ 
                    width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary-subtle)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: rec.color, flexShrink: 0,
                    border: `1px solid ${rec.color}33`, fontSize: '0.9rem'
                  }}>
                    {rec.step}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <h4 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{rec.title}</h4>
                      <span className={`badge ${rec.badgeClass}`} style={{ fontSize: '0.68rem' }}>{rec.status}</span>
                    </div>
                    <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                      {rec.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* 6. ROLE-BASED WORKSPACES */}
      <section id="roles" style={{ padding: '5rem 1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '2.75rem' }}
          >
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Tailored Role-Based Workspaces
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--text-muted)' }}>
              Every campus stakeholder interacts with purpose-built operational interfaces.
            </p>
          </motion.div>

          {/* Role Tabs with Framer Motion hover & active transitions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.65rem', marginBottom: '2.25rem', flexWrap: 'wrap' }}>
            {[
              { role: 'STUDENT', label: 'Student' },
              { role: 'FACULTY', label: 'Faculty' },
              { role: 'TECHNICIAN', label: 'Technician' },
              { role: 'ADMIN', label: 'University Admin' }
            ].map(tab => (
              <motion.button
                key={tab.role}
                type="button"
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                className={`btn ${selectedRole === tab.role ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedRole(tab.role as any)}
                style={{ padding: '0.55rem 1.5rem', fontSize: '0.9rem' }}
              >
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* Active Role Card */}
          <AnimatePresence mode="wait">
            <motion.div 
              key={selectedRole}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="card" 
              style={{ padding: '2.5rem', maxWidth: '800px', margin: '0 auto', background: '#FFFFFF', boxShadow: 'var(--shadow-md)' }}
            >
              {selectedRole === 'STUDENT' && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem', color: 'var(--text-main)' }}>Student Experience</h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Fast natural-language incident submission with live tracking of campus facilities, classroom issues, and repair timelines.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral">Quick NL Reporting</span>
                    <span className="badge badge-neutral">Personal Incident History</span>
                    <span className="badge badge-neutral">Live Resolution Status</span>
                  </div>
                </div>
              )}
              {selectedRole === 'FACULTY' && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem', color: 'var(--text-main)' }}>Faculty Experience</h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Classroom-aware reporting linked to teaching schedules, immediate priority escalation during lecture periods, and verified equipment restoration.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral">Lecture Timetable Link</span>
                    <span className="badge badge-neutral">Emergency Escalation</span>
                    <span className="badge badge-neutral">Restoration Verification</span>
                  </div>
                </div>
              )}
              {selectedRole === 'TECHNICIAN' && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem', color: 'var(--text-main)' }}>Technician Experience</h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Focused work-order queue filtered by specialty, slot timing, room location, execution notes, and one-click completion or decline action.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral">Specialty Dispatch</span>
                    <span className="badge badge-neutral">Execution Logging</span>
                    <span className="badge badge-neutral">Autonomous Reassignment on Decline</span>
                  </div>
                </div>
              )}
              {selectedRole === 'ADMIN' && (
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.65rem', color: 'var(--text-main)' }}>University Admin Console</h3>
                  <p style={{ fontSize: '0.92rem', color: 'var(--text-body)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Campus-wide operational oversight, technician utilization metrics, equipment health analytics, reference timetable management, and multi-tenant controls.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-neutral">Campus Fleet Analytics</span>
                    <span className="badge badge-neutral">Replan Rate Monitoring</span>
                    <span className="badge badge-neutral">Resource & Timetable Governance</span>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

        </div>
      </section>

      {/* 7. ARCHITECTURAL SEPARATION */}
      <section id="architecture" style={{ padding: '5rem 1.5rem', background: '#FFFFFF', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            style={{ textAlign: 'center', marginBottom: '3.25rem' }}
          >
            <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
              Architectural Separation of Concerns
            </h2>
            <p style={{ maxWidth: '640px', margin: '0 auto', color: 'var(--text-muted)' }}>
              Strict boundaries ensure reliability, tenant auditability, and deterministic security.
            </p>
          </motion.div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}
          >
            
            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 16px 28px -6px rgba(227, 83, 54, 0.14)' }} className="card-interactive" style={{ textAlign: 'center', padding: '1.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--color-primary)' }}>
                <Cpu size={24} />
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>LLM Extraction</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Interprets natural language into structured candidate data without direct database write permissions.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 16px 28px -6px rgba(227, 83, 54, 0.14)' }} className="card-interactive" style={{ textAlign: 'center', padding: '1.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--color-primary)' }}>
                <Shield size={24} />
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Backend Authority</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Validates RBAC, tenant isolation, and state machine transition rules deterministically.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 16px 28px -6px rgba(227, 83, 54, 0.14)' }} className="card-interactive" style={{ textAlign: 'center', padding: '1.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--color-primary)' }}>
                <Database size={24} />
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>PostgreSQL Reality</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                PostgreSQL is the single source of truth. AgentEvents record authoritative execution history.
              </p>
            </motion.div>

            <motion.div variants={itemVariants} whileHover={{ y: -6, boxShadow: '0 16px 28px -6px rgba(227, 83, 54, 0.14)' }} className="card-interactive" style={{ textAlign: 'center', padding: '1.75rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--color-primary)' }}>
                <Activity size={24} />
              </div>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.5rem' }}>Real-Time SSE</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Server-Sent Events deliver post-commit transaction updates with automatic reconnection and replay.
              </p>
            </motion.div>

          </motion.div>

        </div>
      </section>

      {/* 8. CALL TO ACTION */}
      <section style={{ padding: '6rem 1.5rem', background: 'linear-gradient(180deg, var(--bg-page) 0%, #FFFFFF 100%)', textAlign: 'center', position: 'relative' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', marginBottom: '1.15rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}
          >
            Bring Autonomous Operations to Your Campus
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{ fontSize: '1.1rem', color: 'var(--color-text)', marginBottom: '2.25rem', lineHeight: 1.6 }}
          >
            Transform classroom maintenance and operational coordination with deterministic agent intelligence and verified institutional recovery.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}
          >
            <motion.button 
              type="button"
              className="btn btn-primary btn-lg" 
              onClick={onGetStarted}
              whileHover={{ scale: 1.04, y: -2, boxShadow: '0 14px 28px -4px rgba(227, 83, 54, 0.35)' }}
              whileTap={{ scale: 0.97 }}
              style={{ padding: '0.95rem 2.5rem', fontSize: '1.1rem' }}
            >
              Sign In to AUOrbit <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

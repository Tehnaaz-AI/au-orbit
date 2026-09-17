import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, AgentEvent, AgentRun } from '../types';
import { api } from '../api';
import { 
  GitBranch, 
  Radio, 
  Code, 
  Check, 
  X,
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Cpu,
  Sparkles,
  MapPin,
  Flame,
  Wrench,
  Calendar,
  Activity,
  Shield,
  RefreshCw,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers
} from 'lucide-react';

interface AgentExecutionTrackerProps {
  incident: Incident;
  compact?: boolean;
}

interface AgentStage {
  id: string;
  name: string;
  role: string;
  icon: React.ReactNode;
  description: string;
  detailKey?: string;
}

const AGENT_STAGES: AgentStage[] = [
  { id: 'intake', name: 'Problem Intake', role: 'Multimodal Ingestion', icon: <Sparkles size={16} />, description: 'Ingests reported complaint and photo/video attachments.' },
  { id: 'understanding', name: 'Understanding Agent', role: 'Entity & Intent Parser', icon: <Cpu size={16} />, description: 'Extracts spatial coordinates, problem category, and failure signals.' },
  { id: 'context', name: 'Context Agent', role: 'Spatial & Timetable Resolver', icon: <MapPin size={16} />, description: 'Cross-checks room inventory, active courses, and equipment state.' },
  { id: 'prioritization', name: 'Prioritization Agent', role: 'Urgency Escalator', icon: <Flame size={16} />, description: 'Escalates priority to Emergency or High if lectures/exams are impacted.' },
  { id: 'resource', name: 'Resource Agent', role: 'Specialist Matcher', icon: <Wrench size={16} />, description: 'Scores and selects qualified technicians based on historical capability.' },
  { id: 'scheduling', name: 'Scheduling Agent', role: 'Slot Allocator', icon: <Calendar size={16} />, description: 'Books non-conflicting maintenance window adhering to policy.' },
  { id: 'execution', name: 'Execution Agent', role: 'Field Dispatch Orchestrator', icon: <Activity size={16} />, description: 'Dispatches work order, tracks technician actions, and receives repair proof.' },
  { id: 'verification', name: 'Verification Agent', role: 'Physical Audit Sign-Off', icon: <Shield size={16} />, description: 'Audits visual Before/After evidence and verifies restored space readiness.' },
  { id: 'replanning', name: 'Replanning Agent', role: 'Self-Healing Recovery', icon: <RefreshCw size={16} />, description: 'Autonomously re-evaluates and excludes failed resources if verification fails.' }
];

export const AgentExecutionTracker: React.FC<AgentExecutionTrackerProps> = ({ incident, compact = false }) => {
  const [events, setEvents] = useState<AgentEvent[]>(incident.events || []);
  const [selectedEventDetails, setSelectedEventDetails] = useState<AgentEvent | null>(null);
  const [showTechnicalDrawer, setShowTechnicalDrawer] = useState(false);

  // Simulation Mode State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0);
  const [simSpeed, setSimSpeed] = useState<number>(1800); // ms per step

  // Sync with incident updates
  useEffect(() => {
    if (incident.events) {
      setEvents(incident.events);
    }
  }, [incident.events]);

  // Subscribe to live Server-Sent Events (SSE)
  useEffect(() => {
    if (!incident.id) return;

    const unsubscribe = api.subscribeIncidentStream(
      incident.id,
      (newEvent: AgentEvent) => {
        setEvents(prev => {
          if (prev.some(e => e.id === newEvent.id)) {
            return prev;
          }
          return [...prev, newEvent];
        });
      },
      (err) => {
        console.debug('SSE stream status update:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [incident.id]);

  // Simulation Timer
  useEffect(() => {
    let timer: any = null;
    if (isSimulating) {
      timer = setInterval(() => {
        setSimStep(prev => {
          if (prev >= AGENT_STAGES.length - 1) {
            setIsSimulating(false);
            return prev;
          }
          return prev + 1;
        });
      }, simSpeed);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isSimulating, simSpeed]);

  const runs: AgentRun[] = incident.runs || [];
  const run1Events = events.filter(e => e.agent_run_id === (runs[0]?.id || 1) || (!e.agent_run_id && runs.length <= 1));
  const run2Events = runs.length > 1 ? events.filter(e => e.agent_run_id === runs[1]?.id) : [];

  const currentStageIndex = isSimulating 
    ? simStep 
    : incident.status === 'RESOLVED' || incident.status === 'CLOSED'
    ? 7
    : incident.status === 'AWAITING_VERIFICATION'
    ? 7
    : incident.status === 'IN_PROGRESS'
    ? 6
    : incident.status === 'SCHEDULED'
    ? 5
    : incident.status === 'ASSIGNED'
    ? 4
    : incident.status === 'PRIORITIZED'
    ? 3
    : incident.status === 'UNDERSTOOD'
    ? 1
    : incident.status === 'REPLANNING' || (incident.replan_count > 0)
    ? 8
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Simulation Control & Live Stream Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0.85rem 1.15rem',
        background: 'linear-gradient(135deg, #FFFDF9 0%, #FFF2E8 100%)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid var(--color-primary)',
        borderRadius: 'var(--radius-md)',
        flexWrap: 'wrap',
        gap: '0.75rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span className="pulse-dot" style={{ backgroundColor: 'var(--color-primary)' }} />
          <div>
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
              Autonomous 9-Agent Simulation & Live Telemetry
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Active Incident #{incident.id} · Priority: <b>{incident.priority}</b> · Status: <b>{incident.status}</b>
            </div>
          </div>
        </div>

        {/* Simulation Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn-sm ${isSimulating ? 'btn-danger' : 'btn-primary'}`}
            onClick={() => {
              if (isSimulating) {
                setIsSimulating(false);
              } else {
                if (simStep >= AGENT_STAGES.length - 1) setSimStep(0);
                setIsSimulating(true);
              }
            }}
            style={{ fontSize: '0.76rem', padding: '0.3rem 0.7rem' }}
          >
            {isSimulating ? <Pause size={13} /> : <Play size={13} />}
            {isSimulating ? 'Pause Simulation' : 'Run Simulation'}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSimStep(prev => (prev < AGENT_STAGES.length - 1 ? prev + 1 : 0))}
            style={{ fontSize: '0.76rem', padding: '0.3rem 0.6rem' }}
            title="Step Forward"
          >
            <FastForward size={13} /> Step
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setIsSimulating(false);
              setSimStep(0);
            }}
            style={{ fontSize: '0.76rem', padding: '0.3rem 0.6rem' }}
            title="Reset Simulation"
          >
            <RotateCcw size={13} /> Reset
          </button>

          {events.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedEventDetails(events[events.length - 1]);
                setShowTechnicalDrawer(true);
              }}
              style={{ fontSize: '0.76rem', padding: '0.3rem 0.6rem' }}
            >
              <Code size={13} /> Technical Logs
            </button>
          )}
        </div>
      </div>

      {/* 2. Visual 9-Agent Orbital Simulation Flow */}
      <div className="card" style={{ padding: '1.25rem', borderTop: '3px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>
            Autonomous Coordination Pipeline
          </span>
          <span className="badge badge-role mono" style={{ fontSize: '0.72rem' }}>
            Stage {currentStageIndex + 1} of 9: {AGENT_STAGES[currentStageIndex].name}
          </span>
        </div>

        {/* 9-Node Interactive Rail */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '0.5rem', position: 'relative' }}>
          {AGENT_STAGES.map((st, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex;
            return (
              <motion.div
                key={st.id}
                whileHover={{ y: -3 }}
                onClick={() => setSimStep(idx)}
                style={{
                  padding: '0.75rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: isCurrent ? 'var(--color-primary)' : isCompleted ? 'var(--status-success-border)' : 'var(--border-subtle)',
                  background: isCurrent ? 'linear-gradient(180deg, #FFF0E6 0%, #FFE5D4 100%)' : isCompleted ? 'var(--status-success-bg)' : 'var(--bg-surface)',
                  color: isCurrent ? 'var(--color-primary-dark)' : isCompleted ? 'var(--status-success-text)' : 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: isCurrent ? '0 4px 14px rgba(227, 83, 54, 0.25)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Glowing Active Ring Animation */}
                {isCurrent && (
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      inset: -3,
                      borderRadius: 'var(--radius-sm)',
                      border: '2px solid var(--color-primary)',
                      pointerEvents: 'none'
                    }}
                  />
                )}

                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: isCurrent ? 'var(--color-primary)' : isCompleted ? 'var(--status-success-text)' : 'var(--bg-card)',
                  color: isCurrent || isCompleted ? '#FFFFFF' : 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {isCompleted ? <Check size={14} /> : st.icon}
                </div>

                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: isCurrent ? 'var(--color-primary)' : 'inherit' }}>
                    0{idx + 1}
                  </div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontFamily: 'var(--font-heading)' }}>
                    {st.name.split(' ')[0]}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Active Stage Detailed Simulation Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStageIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
            style={{
              marginTop: '1.25rem',
              padding: '1.15rem',
              background: 'linear-gradient(135deg, #FFFDF9 0%, #FFF3EA 100%)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid var(--color-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem' }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: '8px',
                background: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {AGENT_STAGES[currentStageIndex].icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                    {AGENT_STAGES[currentStageIndex].name}
                  </span>
                  <span className="badge badge-role" style={{ fontSize: '0.68rem' }}>
                    {AGENT_STAGES[currentStageIndex].role}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: '0.2rem 0 0.5rem', lineHeight: 1.5 }}>
                  {AGENT_STAGES[currentStageIndex].description}
                </p>

                {/* Simulation Rationale Context */}
                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <span>Location Target: <b>{incident.room_code || 'Campus Space'}</b></span>
                  <span>Category: <b>{incident.category || 'Hardware/AV'}</b></span>
                  <span>Assigned Tech: <b>{incident.work_order?.technician || 'Allocating...'}</b></span>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Real-Time Monospace Terminal Log Stream */}
      <div style={{
        background: '#1D1411',
        color: '#FFB899',
        borderRadius: 'var(--radius-md)',
        border: '1px solid #4A2B20',
        padding: '1rem',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        fontFamily: 'var(--font-mono)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #382118', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: '#FF9E6C', fontWeight: 700 }}>
            <Terminal size={14} color="var(--color-primary)" />
            <span>AUOrbit Autonomous Telemetry Stream</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#A87A68' }}>
            Event Log ({events.length} records)
          </span>
        </div>

        <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.78rem', paddingRight: '0.3rem' }}>
          {events.length === 0 ? (
            <div style={{ color: '#8A6858', fontStyle: 'italic' }}>
              [SYSTEM] Initializing multi-agent event stream for Incident #{incident.id}...
            </div>
          ) : (
            events.map((ev, i) => (
              <div key={ev.id || i} style={{ display: 'flex', gap: '0.5rem', lineHeight: 1.4 }}>
                <span style={{ color: '#E35336', flexShrink: 0 }}>[{ev.agent || 'Agent'}]:</span>
                <span style={{ color: '#F3E5DC' }}>{ev.action}</span>
                {ev.tool && <span style={{ color: '#FFB380' }}>({ev.tool})</span>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Technical Detail Modal */}
      {showTechnicalDrawer && selectedEventDetails && (
        <div className="modal-overlay" onClick={() => setShowTechnicalDrawer(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={18} color="var(--color-primary)" />
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                  Event #{selectedEventDetails.id} Technical Payload
                </span>
              </div>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setShowTechnicalDrawer(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <pre style={{
                background: '#1D1411',
                color: '#FFB899',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)'
              }}>
                {JSON.stringify(selectedEventDetails, null, 2)}
              </pre>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowTechnicalDrawer(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

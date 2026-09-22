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
  Layers,
  Building2
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

const GET_AGENT_STAGES = (incident: Incident): AgentStage[] => {
  const isSpaceAllocation = incident.category === 'SPACE_ALLOCATION' || 
    incident.space_allocation_decision?.reallocated || 
    incident.understanding?.resolution_type === 'SPACE_REALLOCATION';

  if (isSpaceAllocation) {
    return [
      { id: 'intake', name: 'Multimodal Intake', role: 'Problem Ingestion', icon: <Sparkles size={16} />, description: 'Ingests venue/capacity/timetable problem report and spatial coordinates.' },
      { id: 'understanding', name: 'Understanding Agent', role: 'Intent & Entity Parser', icon: <Cpu size={16} />, description: 'Extracts spatial constraints and determines autonomous SPACE_REALLOCATION strategy.' },
      { id: 'context', name: 'Context Agent', role: 'Live Timetable Checker', icon: <MapPin size={16} />, description: 'Validates active section schedule, enrolled batch, and source room occupancy.' },
      { id: 'prioritization', name: 'Prioritization Agent', role: 'Academic Urgency Escalator', icon: <Flame size={16} />, description: 'Evaluates lecture impact and escalates priority to prevent instructional downtime.' },
      { id: 'space_allocation', name: 'Space Allocation Agent', role: 'Autonomous Venue Optimizer', icon: <Building2 size={16} />, description: 'Scans university timetable across block/floors and assigns optimal vacant venue.' },
      { id: 'resolution', name: 'Resolution Agent', role: 'Zero-Dispatch Finalizer', icon: <CheckCircle2 size={16} />, description: 'Notifies students and faculty of reallocated room. Zero technician work orders created.' }
    ];
  }

  if (incident.category === 'IT_NETWORK') {
    return [
      { id: 'intake', name: 'Problem Intake', role: 'Multimodal Ingestion', icon: <Sparkles size={16} />, description: 'Ingests network/connectivity report and telemetry evidence.' },
      { id: 'understanding', name: 'Understanding Agent', role: 'Network Protocol Parser', icon: <Cpu size={16} />, description: 'Classifies IT_NETWORK outage and determines network technician requirement.' },
      { id: 'context', name: 'Context Agent', role: 'Subnet & Switch Resolver', icon: <MapPin size={16} />, description: 'Checks lab workstations, Wi-Fi AP coordinates, and active practical sessions.' },
      { id: 'prioritization', name: 'Prioritization Agent', role: 'Lab Impact Escalator', icon: <Flame size={16} />, description: 'Escalates priority to High if computer lab examination or practicals are active.' },
      { id: 'resource', name: 'Resource Agent', role: 'Network Specialist Matcher', icon: <Wrench size={16} />, description: 'Evaluates network technicians by IT certification and availability.' },
      { id: 'scheduling', name: 'Scheduling Agent', role: 'Dispatch Slot Allocator', icon: <Calendar size={16} />, description: 'Allocates rapid response window conforming to university IT policy.' },
      { id: 'execution', name: 'Execution Agent', role: 'Field Specialist Dispatch', icon: <Activity size={16} />, description: 'Issues work order, monitors switch calibration, and captures proof.' },
      { id: 'verification', name: 'Verification Agent', role: 'Connectivity Audit', icon: <Shield size={16} />, description: 'Audits network connectivity metrics and signs off resolution.' },
      { id: 'replanning', name: 'Replanning Agent', role: 'Self-Healing Fallback', icon: <RefreshCw size={16} />, description: 'Re-assigns tier-2 IT network specialist if connectivity verification fails.' }
    ];
  }

  return [
    { id: 'intake', name: 'Problem Intake', role: 'Multimodal Ingestion', icon: <Sparkles size={16} />, description: 'Ingests reported complaint, room hint, and photo/video evidence.' },
    { id: 'understanding', name: 'Understanding Agent', role: 'Groq/LLM Entity Parser', icon: <Cpu size={16} />, description: 'Interprets failure signals, affected equipment, and category via Groq AI.' },
    { id: 'context', name: 'Context Agent', role: 'Spatial & Timetable Resolver', icon: <MapPin size={16} />, description: 'Cross-checks room database, active lecture schedules, and hardware telemetry.' },
    { id: 'prioritization', name: 'Prioritization Agent', role: 'Dynamic Urgency Escalator', icon: <Flame size={16} />, description: 'Escalates priority to Emergency or High if active classes/exams are disrupted.' },
    { id: 'resource', name: 'Resource Agent', role: 'Specialist Matcher', icon: <Wrench size={16} />, description: 'Scores certified trade technicians by skill matching and active workload.' },
    { id: 'scheduling', name: 'Scheduling Agent', role: 'Slot Allocator', icon: <Calendar size={16} />, description: 'Schedules optimal maintenance window without causing lecture conflicts.' },
    { id: 'execution', name: 'Execution Agent', role: 'Field Dispatch Orchestrator', icon: <Activity size={16} />, description: 'Generates digital work order and enforces mandatory photo repair proof.' },
    { id: 'verification', name: 'Verification Agent', role: 'Visual Dual-Proof Audit', icon: <Shield size={16} />, description: 'Performs side-by-side Before/After inspection with faculty/ops sign-off.' },
    { id: 'replanning', name: 'Replanning Agent', role: 'Autonomous Recovery Loop', icon: <RefreshCw size={16} />, description: 'Excludes failed specialist and autonomously dispatches replacement if audit fails.' }
  ];
};

export const AgentExecutionTracker: React.FC<AgentExecutionTrackerProps> = ({ incident, compact = false }) => {
  const [events, setEvents] = useState<AgentEvent[]>(incident.events || []);
  const [selectedEventDetails, setSelectedEventDetails] = useState<AgentEvent | null>(null);
  const [showTechnicalDrawer, setShowTechnicalDrawer] = useState(false);

  // Simulation Mode State (Enabled by default as requested)
  const [isSimulating, setIsSimulating] = useState(true);
  const [simStep, setSimStep] = useState(0);
  const [simSpeed, setSimSpeed] = useState<number>(1600); // ms per step

  const isSpaceAllocation = incident.category === 'SPACE_ALLOCATION' || incident.space_allocation_decision?.reallocated || incident.understanding?.resolution_type === 'SPACE_REALLOCATION';
  const agentStages = GET_AGENT_STAGES(incident);

  // Auto-start simulation whenever incident changes
  useEffect(() => {
    setSimStep(0);
    setIsSimulating(true);
  }, [incident.id]);

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

  // Simulation Timer (Runs dynamically by default)
  useEffect(() => {
    let timer: any = null;
    if (isSimulating) {
      timer = setInterval(() => {
        setSimStep(prev => {
          if (prev >= agentStages.length - 1) {
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
  }, [isSimulating, simSpeed, agentStages.length]);

  const currentStageIndex = isSimulating 
    ? Math.min(simStep, agentStages.length - 1)
    : incident.status === 'RESOLVED' || incident.status === 'CLOSED'
    ? agentStages.length - 1
    : incident.status === 'AWAITING_VERIFICATION'
    ? (isSpaceAllocation ? agentStages.length - 1 : 7)
    : incident.status === 'IN_PROGRESS'
    ? (isSpaceAllocation ? 4 : 6)
    : incident.status === 'SCHEDULED'
    ? (isSpaceAllocation ? 4 : 5)
    : incident.status === 'ASSIGNED'
    ? 4
    : incident.status === 'PRIORITIZED'
    ? 3
    : incident.status === 'UNDERSTOOD'
    ? 1
    : incident.status === 'REPLANNING' || (incident.replan_count > 0)
    ? (isSpaceAllocation ? 4 : 8)
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
            <div style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span>{isSpaceAllocation ? 'Autonomous Space Allocation Pipeline' : 'Autonomous Multi-Agent Pipeline'}</span>
              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', fontWeight: 800 }}>
                ⚡ Auto-Simulating Dynamic Execution
              </span>
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
                if (simStep >= agentStages.length - 1) setSimStep(0);
                setIsSimulating(true);
              }
            }}
            style={{ fontSize: '0.76rem', padding: '0.3rem 0.7rem' }}
          >
            {isSimulating ? <Pause size={13} /> : <Play size={13} />}
            {isSimulating ? 'Pause Live Flow' : 'Replay Agent Simulation'}
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSimStep(prev => (prev < agentStages.length - 1 ? prev + 1 : 0))}
            style={{ fontSize: '0.76rem', padding: '0.3rem 0.6rem' }}
            title="Step Forward"
          >
            <FastForward size={13} /> Step
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSimStep(0);
              setIsSimulating(true);
            }}
            style={{ fontSize: '0.76rem', padding: '0.3rem 0.6rem' }}
            title="Restart Agent Flow"
          >
            <RotateCcw size={13} /> Restart
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
            Stage {currentStageIndex + 1} of {agentStages.length}: {agentStages[currentStageIndex]?.name}
          </span>
        </div>

        {/* Dynamic Multi-Agent Interactive Rail */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '0.5rem', position: 'relative' }}>
          {agentStages.map((st, idx) => {
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
          {agentStages[currentStageIndex] && (
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
                  {agentStages[currentStageIndex].icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                      {agentStages[currentStageIndex].name}
                    </span>
                    <span className="badge badge-role" style={{ fontSize: '0.68rem' }}>
                      {agentStages[currentStageIndex].role}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: '0.2rem 0 0.5rem', lineHeight: 1.5 }}>
                    {agentStages[currentStageIndex].description}
                  </p>

                  {/* Simulation Rationale Context */}
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>Location Target: <b>{incident.space_allocation_decision?.reallocated_room_code ? `${incident.room_code || 'Source'} → ${incident.space_allocation_decision.reallocated_room_code}` : (incident.room_code || 'Campus Space')}</b></span>
                    <span>Category: <b>{incident.category || 'Hardware/AV'}</b></span>
                    <span>Workflow: <b>{isSpaceAllocation ? 'Autonomous Vacant Venue Assignment (No Tech)' : (incident.work_order?.technician ? `Assigned to ${incident.work_order.technician}` : 'Technician Dispatch Queue')}</b></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
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

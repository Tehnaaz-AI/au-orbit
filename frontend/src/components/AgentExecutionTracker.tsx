import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, AgentEvent } from '../types';
import { api } from '../api';
import { 
  Radio, 
  Code, 
  Check, 
  X,
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
  Building2,
  Clock,
  ExternalLink
} from 'lucide-react';

interface AgentExecutionTrackerProps {
  incident: Incident;
  compact?: boolean;
  onRefresh?: () => void;
}

interface AgentStage {
  id: string;
  name: string;
  agentName: string;
  role: string;
  icon: React.ReactNode;
  description: string;
}

const GET_AGENT_STAGES = (incident: Incident): AgentStage[] => {
  const isSpaceAllocation = incident.category === 'SPACE_ALLOCATION' || 
    incident.space_allocation_decision?.reallocated || 
    incident.understanding?.resolution_type === 'SPACE_REALLOCATION';

  if (isSpaceAllocation) {
    return [
      { id: 'intake', name: 'Multimodal Intake', agentName: 'Intake', role: 'Problem Ingestion', icon: <Sparkles size={16} />, description: 'Ingests venue/capacity/timetable problem report and spatial coordinates.' },
      { id: 'understanding', name: 'Understanding Agent', agentName: 'Understanding Agent', role: 'Groq/LLM Entity Parser', icon: <Cpu size={16} />, description: 'Extracts spatial constraints and determines autonomous SPACE_REALLOCATION strategy.' },
      { id: 'context', name: 'Context Agent', agentName: 'Context Agent', role: 'Live Timetable Checker', icon: <MapPin size={16} />, description: 'Validates active section schedule, enrolled batch, and source room occupancy.' },
      { id: 'prioritization', name: 'Priority Agent', agentName: 'Priority Agent', role: 'Academic Urgency Escalator', icon: <Flame size={16} />, description: 'Evaluates lecture impact and escalates priority to prevent instructional downtime.' },
      { id: 'space_allocation', name: 'Space Allocation Agent', agentName: 'Space Allocation Agent', role: 'Autonomous Venue Optimizer', icon: <Building2 size={16} />, description: 'Scans university timetable across block/floors and assigns optimal vacant venue.' },
      { id: 'resolution', name: 'Resolution Agent', agentName: 'Resolution Agent', role: 'Zero-Dispatch Finalizer', icon: <CheckCircle2 size={16} />, description: 'Notifies students and faculty of reallocated room. Zero technician work orders created.' }
    ];
  }

  if (incident.category === 'IT_NETWORK') {
    return [
      { id: 'intake', name: 'Problem Intake', agentName: 'Intake', role: 'Multimodal Ingestion', icon: <Sparkles size={16} />, description: 'Ingests network/connectivity report and telemetry evidence.' },
      { id: 'understanding', name: 'Understanding Agent', agentName: 'Understanding Agent', role: 'Network Protocol Parser', icon: <Cpu size={16} />, description: 'Classifies IT_NETWORK outage and determines network technician requirement.' },
      { id: 'context', name: 'Context Agent', agentName: 'Context Agent', role: 'Subnet & Switch Resolver', icon: <MapPin size={16} />, description: 'Checks lab workstations, Wi-Fi AP coordinates, and active practical sessions.' },
      { id: 'prioritization', name: 'Priority Agent', agentName: 'Priority Agent', role: 'Lab Impact Escalator', icon: <Flame size={16} />, description: 'Escalates priority to High if computer lab examination or practicals are active.' },
      { id: 'resource', name: 'Resource Agent', agentName: 'Resource Agent', role: 'Network Specialist Matcher', icon: <Wrench size={16} />, description: 'Evaluates network technicians by IT certification and availability.' },
      { id: 'scheduling', name: 'Scheduling Agent', agentName: 'Scheduling Agent', role: 'Dispatch Slot Allocator', icon: <Calendar size={16} />, description: 'Allocates rapid response window conforming to university IT policy.' },
      { id: 'execution', name: 'Execution Agent', agentName: 'Execution Agent', role: 'Field Specialist Dispatch', icon: <Activity size={16} />, description: 'Issues work order, monitors switch calibration, and captures proof.' },
      { id: 'verification', name: 'Verification Agent', agentName: 'Verification Agent', role: 'Connectivity Audit', icon: <Shield size={16} />, description: 'Audits network connectivity metrics and signs off resolution.' },
      { id: 'replanning', name: 'Replanning Agent', agentName: 'Replanning Agent', role: 'Self-Healing Fallback', icon: <RefreshCw size={16} />, description: 'Re-assigns tier-2 IT network specialist if connectivity verification fails.' }
    ];
  }

  return [
    { id: 'intake', name: 'Problem Intake', agentName: 'Intake', role: 'Multimodal Ingestion', icon: <Sparkles size={16} />, description: 'Ingests reported complaint, room hint, and photo/video evidence.' },
    { id: 'understanding', name: 'Understanding Agent', agentName: 'Understanding Agent', role: 'Groq/LLM Entity Parser', icon: <Cpu size={16} />, description: 'Interprets failure signals, affected equipment, and category via Groq AI.' },
    { id: 'context', name: 'Context Agent', agentName: 'Context Agent', role: 'Spatial & Timetable Resolver', icon: <MapPin size={16} />, description: 'Cross-checks room database, active lecture schedules, and hardware telemetry.' },
    { id: 'prioritization', name: 'Priority Agent', agentName: 'Priority Agent', role: 'Dynamic Urgency Escalator', icon: <Flame size={16} />, description: 'Escalates priority to Emergency or High if active classes/exams are disrupted.' },
    { id: 'resource', name: 'Resource Agent', agentName: 'Resource Agent', role: 'Specialist Matcher', icon: <Wrench size={16} />, description: 'Scores certified trade technicians by skill matching and active workload.' },
    { id: 'scheduling', name: 'Scheduling Agent', agentName: 'Scheduling Agent', role: 'Slot Allocator', icon: <Calendar size={16} />, description: 'Schedules optimal maintenance window without causing lecture conflicts.' },
    { id: 'execution', name: 'Execution Agent', agentName: 'Execution Agent', role: 'Field Dispatch Orchestrator', icon: <Activity size={16} />, description: 'Generates digital work order and enforces mandatory photo repair proof.' },
    { id: 'verification', name: 'Verification Agent', agentName: 'Verification Agent', role: 'Visual Dual-Proof Audit', icon: <Shield size={16} />, description: 'Performs side-by-side Before/After inspection with faculty/ops sign-off.' },
    { id: 'replanning', name: 'Replanning Agent', agentName: 'Replanning Agent', role: 'Autonomous Recovery Loop', icon: <RefreshCw size={16} />, description: 'Excludes failed specialist and autonomously dispatches replacement if audit fails.' }
  ];
};

export const AgentExecutionTracker: React.FC<AgentExecutionTrackerProps> = ({ incident, compact = false, onRefresh }) => {
  const [events, setEvents] = useState<AgentEvent[]>(incident.events || []);
  const [selectedStageIdx, setSelectedStageIdx] = useState<number | null>(null);
  const [selectedEventDetails, setSelectedEventDetails] = useState<AgentEvent | null>(null);
  const [showTechnicalDrawer, setShowTechnicalDrawer] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isSpaceAllocation = incident.category === 'SPACE_ALLOCATION' || 
    incident.space_allocation_decision?.reallocated || 
    incident.understanding?.resolution_type === 'SPACE_REALLOCATION';
  const agentStages = GET_AGENT_STAGES(incident);

  // Sync with incident updates
  useEffect(() => {
    if (incident.events) {
      setEvents(incident.events);
    }
  }, [incident.events]);

  // Subscribe to live Server-Sent Events (SSE) stream from backend
  useEffect(() => {
    if (!incident.id) return;

    setSseConnected(true);
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
        console.debug('SSE stream note:', err);
      }
    );

    return () => {
      setSseConnected(false);
      unsubscribe();
    };
  }, [incident.id]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const refreshed = await api.getIncident(incident.id);
      if (refreshed && refreshed.events) {
        setEvents(refreshed.events);
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      console.warn('Manual telemetry refresh fallback:', err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Determine stage execution status directly from real database events & incident lifecycle
  const getStageStatus = useCallback((stage: AgentStage, idx: number) => {
    // Check if an event exists for this agent
    const matchingEvents = events.filter(e => 
      e.agent?.toLowerCase().includes(stage.agentName.toLowerCase()) ||
      (stage.id === 'intake' && (e.action?.toLowerCase().includes('report') || e.agent?.toLowerCase().includes('understanding'))) ||
      (stage.id === 'understanding' && e.agent?.toLowerCase().includes('understanding')) ||
      (stage.id === 'context' && e.agent?.toLowerCase().includes('context')) ||
      (stage.id === 'prioritization' && e.agent?.toLowerCase().includes('priority')) ||
      (stage.id === 'space_allocation' && (e.agent?.toLowerCase().includes('space') || e.tool === 'reallocate_classroom')) ||
      (stage.id === 'resolution' && (e.agent?.toLowerCase().includes('resolution') || incident.status === 'RESOLVED')) ||
      (stage.id === 'resource' && e.agent?.toLowerCase().includes('resource')) ||
      (stage.id === 'scheduling' && e.agent?.toLowerCase().includes('scheduling')) ||
      (stage.id === 'execution' && (e.agent?.toLowerCase().includes('execution') || incident.work_order)) ||
      (stage.id === 'verification' && (e.agent?.toLowerCase().includes('verification') || incident.status === 'RESOLVED' || incident.status === 'CLOSED')) ||
      (stage.id === 'replanning' && incident.replan_count > 0)
    );

    if (matchingEvents.length > 0) {
      const lastEv = matchingEvents[matchingEvents.length - 1];
      if (lastEv.status === 'SUCCESS') return 'COMPLETED';
      if (lastEv.status === 'WAITING' || lastEv.status === 'NEEDS_INPUT') return 'WAITING';
      if (lastEv.status === 'FAILED' || lastEv.status === 'ERROR') return 'FAILED';
      return 'COMPLETED';
    }

    // Incident status fallback checks
    if (incident.status === 'RESOLVED' || incident.status === 'CLOSED') {
      if (isSpaceAllocation) return idx <= 5 ? 'COMPLETED' : 'PENDING';
      return idx <= 7 ? 'COMPLETED' : 'PENDING';
    }
    if (incident.status === 'IN_PROGRESS') {
      return idx <= (isSpaceAllocation ? 4 : 6) ? 'COMPLETED' : (idx === (isSpaceAllocation ? 5 : 7) ? 'ACTIVE' : 'PENDING');
    }
    if (incident.status === 'SCHEDULED' || incident.status === 'ASSIGNED') {
      return idx <= 4 ? 'COMPLETED' : (idx === 5 ? 'ACTIVE' : 'PENDING');
    }
    if (incident.status === 'UNDERSTOOD' || (incident.status as string) === 'TRIAGED') {
      return idx <= 2 ? 'COMPLETED' : (idx === 3 ? 'ACTIVE' : 'PENDING');
    }
    if (idx === 0) return 'COMPLETED';

    return 'PENDING';
  }, [events, incident.status, incident.work_order, incident.replan_count, isSpaceAllocation]);

  // Find the latest active or completed stage index
  const activeStageIndex = (() => {
    if (selectedStageIdx !== null) return selectedStageIdx;
    for (let i = agentStages.length - 1; i >= 0; i--) {
      const st = getStageStatus(agentStages[i], i);
      if (st === 'COMPLETED' || st === 'ACTIVE' || st === 'WAITING') {
        return i;
      }
    }
    return 0;
  })();

  const currentActiveStage = agentStages[activeStageIndex] || agentStages[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* 1. Live Telemetry Header Bar */}
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
              <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
                Live Real-Time Telemetry
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Active Incident #{incident.id} · Priority: <b>{incident.priority}</b> · Status: <b>{incident.status}</b> · Logged Events: <b>{events.length}</b>
            </div>
          </div>
        </div>

        {/* Live Operational Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RefreshCw size={13} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Syncing...' : 'Refresh Telemetry'}
          </button>

          {events.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedEventDetails(events[events.length - 1]);
                setShowTechnicalDrawer(true);
              }}
              style={{ fontSize: '0.76rem', padding: '0.3rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <Code size={13} /> Raw JSON Payload
            </button>
          )}
        </div>
      </div>

      {/* 2. Visual Multi-Agent Interactive Pipeline Rail */}
      <div className="card" style={{ padding: '1.25rem', borderTop: '3px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>
              Live Multi-Agent Pipeline Progress
            </span>
            <span className="badge badge-info mono" style={{ fontSize: '0.68rem' }}>
              {events.length} Live Agent Events
            </span>
          </div>

          <span className="badge badge-role mono" style={{ fontSize: '0.72rem' }}>
            Viewing: {currentActiveStage?.name}
          </span>
        </div>

        {/* Multi-Agent Interactive Pipeline Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(105px, 1fr))', gap: '0.5rem', position: 'relative' }}>
          {agentStages.map((st, idx) => {
            const status = getStageStatus(st, idx);
            const isCompleted = status === 'COMPLETED';
            const isWaiting = status === 'WAITING';
            const isFailed = status === 'FAILED';
            const isSelected = idx === activeStageIndex;

            return (
              <motion.div
                key={st.id}
                whileHover={{ y: -2 }}
                onClick={() => setSelectedStageIdx(idx)}
                style={{
                  padding: '0.75rem 0.45rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid',
                  borderColor: isSelected 
                    ? 'var(--color-primary)' 
                    : isCompleted 
                    ? 'var(--status-success-border)' 
                    : isWaiting
                    ? '#F59E0B'
                    : isFailed
                    ? 'var(--status-danger-border)'
                    : 'var(--border-subtle)',
                  background: isSelected 
                    ? 'linear-gradient(180deg, #FFF0E6 0%, #FFE5D4 100%)' 
                    : isCompleted 
                    ? 'var(--status-success-bg)' 
                    : isWaiting
                    ? '#FFFBEB'
                    : isFailed
                    ? '#FEF2F2'
                    : 'var(--bg-surface)',
                  color: isSelected 
                    ? 'var(--color-primary-dark)' 
                    : isCompleted 
                    ? 'var(--status-success-text)' 
                    : 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.35rem',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: isSelected ? '0 4px 14px rgba(227, 83, 54, 0.22)' : 'none',
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Glowing Active Border Ring */}
                {isSelected && (
                  <motion.div
                    animate={{ opacity: [0.6, 0.1, 0.6] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    style={{
                      position: 'absolute',
                      inset: -2,
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
                  background: isSelected 
                    ? 'var(--color-primary)' 
                    : isCompleted 
                    ? 'var(--status-success-text)' 
                    : isWaiting
                    ? '#D97706'
                    : 'var(--bg-card)',
                  color: isSelected || isCompleted || isWaiting ? '#FFFFFF' : 'var(--text-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 800
                }}>
                  {isCompleted ? <Check size={14} /> : isWaiting ? <Clock size={14} /> : st.icon}
                </div>

                <div style={{ textAlign: 'center', width: '100%' }}>
                  <div style={{ fontSize: '0.66rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: isSelected ? 'var(--color-primary)' : 'inherit' }}>
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

        {/* Selected Stage Live Execution Card */}
        <AnimatePresence mode="wait">
          {currentActiveStage && (
            <motion.div
              key={currentActiveStage.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
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
                  {currentActiveStage.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                      {currentActiveStage.name}
                    </span>
                    <span className="badge badge-role" style={{ fontSize: '0.68rem' }}>
                      {currentActiveStage.role}
                    </span>
                    <span className="badge badge-neutral mono" style={{ fontSize: '0.66rem' }}>
                      Status: {getStageStatus(currentActiveStage, activeStageIndex)}
                    </span>
                  </div>
                  
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: '0.2rem 0 0.6rem', lineHeight: 1.5 }}>
                    {currentActiveStage.description}
                  </p>

                  {/* Authentic Operational Telemetry Metadata */}
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span>Target Space: <b>{incident.space_allocation_decision?.reallocated_room_code ? `${incident.room_code || 'Source'} → ${incident.space_allocation_decision.reallocated_room_code}` : (incident.room_code || 'Campus Space')}</b></span>
                    <span>Category: <b>{incident.category || 'Hardware/AV'}</b></span>
                    <span>Resolution Strategy: <b>{isSpaceAllocation ? 'Autonomous Vacant Venue Assignment (0 Tech)' : (incident.work_order?.technician ? `Field Work Order -> ${incident.work_order.technician}` : 'Dynamic Specialist Matcher')}</b></span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Authentic Live Terminal Stream with Expandable Payloads */}
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
            <span>AUOrbit Live Agent Event Stream</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#A87A68' }}>
            {events.length} Authentic Events Logged
          </span>
        </div>

        <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.78rem', paddingRight: '0.3rem' }}>
          {events.length === 0 ? (
            <div style={{ color: '#8A6858', fontStyle: 'italic' }}>
              [SYSTEM] Live telemetry stream initialized. Awaiting agent events for Incident #{incident.id}...
            </div>
          ) : (
            events.map((ev, i) => (
              <div 
                key={ev.id || i} 
                onClick={() => {
                  setSelectedEventDetails(ev);
                  setShowTechnicalDrawer(true);
                }}
                style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  lineHeight: 1.4, 
                  cursor: 'pointer',
                  padding: '0.2rem 0.35rem',
                  borderRadius: '4px',
                  transition: 'background 0.15s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(227, 83, 54, 0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
                title="Click to inspect raw event payload"
              >
                <span style={{ color: '#E35336', flexShrink: 0, fontWeight: 700 }}>[{ev.agent || 'Agent'}]:</span>
                <span style={{ color: '#F3E5DC', flex: 1 }}>{ev.action}</span>
                {ev.tool && <span style={{ color: '#FFB380', flexShrink: 0 }}>({ev.tool})</span>}
                <span style={{ 
                  color: ev.status === 'SUCCESS' ? '#34D399' : ev.status === 'WAITING' ? '#FBBF24' : '#F87171',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  flexShrink: 0
                }}>
                  [{ev.status || 'OK'}]
                </span>
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
                  Event #{selectedEventDetails.id} Payload Telemetry
                </span>
              </div>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setShowTechnicalDrawer(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: '0.75rem', fontSize: '0.84rem', color: 'var(--text-main)' }}>
                <strong>Agent:</strong> {selectedEventDetails.agent} | <strong>Tool:</strong> {selectedEventDetails.tool || 'None'} | <strong>Status:</strong> {selectedEventDetails.status}
              </div>
              <pre style={{
                background: '#1D1411',
                color: '#FFB899',
                padding: '1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.78rem',
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                maxHeight: '350px'
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

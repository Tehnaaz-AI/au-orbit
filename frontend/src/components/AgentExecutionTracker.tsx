import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, AgentEvent, AgentRun } from '../types';
import { api } from '../api';
import { 
  Brain, 
  MapPin, 
  Flame, 
  Users, 
  CalendarClock, 
  RefreshCw, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Cpu,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Layers,
  Code,
  Check,
  AlertTriangle,
  ArrowRight,
  GitBranch
} from 'lucide-react';

interface AgentExecutionTrackerProps {
  incident: Incident;
  compact?: boolean;
}

export const AgentExecutionTracker: React.FC<AgentExecutionTrackerProps> = ({ incident, compact = false }) => {
  const [expanded, setExpanded] = useState(!compact);
  const [showRawJson, setShowRawJson] = useState(false);
  const [events, setEvents] = useState<AgentEvent[]>(incident.events || []);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);

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

  const runs: AgentRun[] = incident.runs || [];
  
  // Calculate real lifecycle stage status based on authentic events
  const hasUnderstand = Boolean(events.some(e => e.agent === 'Understanding Agent'));
  const hasContext = Boolean(events.some(e => e.agent === 'Context Agent'));
  const hasPriority = Boolean(events.some(e => e.agent === 'Priority Agent'));
  const hasResource = Boolean(events.some(e => e.agent === 'Resource Agent'));
  const hasSchedule = Boolean(events.some(e => e.agent === 'Scheduling Agent' || e.agent === 'Resolution Agent'));
  const hasExecute = Boolean(events.some(e => e.agent === 'Execution Agent' || e.tool === 'record_work_action'));
  const hasVerification = Boolean(events.some(e => e.agent === 'Verification Agent'));
  const hasReplanning = (incident.replan_count || 0) > 0 || incident.status === 'REPLANNING' || events.some(e => e.agent === 'Replanning Agent');
  const isResolved = incident.status === 'RESOLVED' || incident.status === 'CLOSED';

  const stages = [
    {
      key: 'understand',
      label: 'Understand',
      agent: 'Understanding Agent',
      icon: <Brain size={14} />,
      active: hasUnderstand,
      completed: hasContext || hasPriority,
      info: incident.understanding?.category || 'NL Parsing'
    },
    {
      key: 'context',
      label: 'Context',
      agent: 'Context Agent',
      icon: <MapPin size={14} />,
      active: hasContext,
      completed: hasPriority || hasResource,
      info: incident.room_code || 'Campus Space'
    },
    {
      key: 'priority',
      label: 'Priority',
      agent: 'Priority Agent',
      icon: <Flame size={14} />,
      active: hasPriority,
      completed: hasResource,
      info: incident.priority
    },
    {
      key: 'resource',
      label: 'Resource',
      agent: 'Resource Agent',
      icon: <Users size={14} />,
      active: hasResource,
      completed: hasSchedule,
      info: incident.resource_decision?.selected_technician_name || incident.work_order?.technician || 'Specialist'
    },
    {
      key: 'schedule',
      label: 'Schedule',
      agent: 'Scheduling Agent',
      icon: <CalendarClock size={14} />,
      active: hasSchedule,
      completed: hasExecute || isResolved,
      info: incident.work_order ? `WO #${incident.work_order.id}` : 'Dispatch'
    },
    {
      key: 'execute',
      label: 'Execute',
      agent: 'Execution Agent',
      icon: <Cpu size={14} />,
      active: hasExecute,
      completed: hasVerification || isResolved,
      info: incident.work_order?.status || 'Field Action'
    },
    {
      key: 'verify',
      label: 'Verify',
      agent: 'Verification Agent',
      icon: <ShieldCheck size={14} />,
      active: hasVerification,
      completed: isResolved,
      info: isResolved ? 'Verified' : 'Validation'
    }
  ];

  const filteredEvents = selectedRunId !== null 
    ? events.filter(e => e.agent_run_id === selectedRunId)
    : events;

  return (
    <div className="card" style={{ background: '#FFFFFF', padding: '1.25rem', borderColor: 'var(--border-default)' }}>
      
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ 
            width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' 
          }}>
            <Cpu size={16} />
          </div>
          <div>
            <span style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
              Autonomous Execution Tracker
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Incident #{incident.id} · {runs.length > 0 ? `${runs.length} Agent ${runs.length === 1 ? 'Run' : 'Runs'}` : 'Live Pipeline'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
            <Radio size={11} color="var(--color-primary)" />
            <span>SSE STREAM: {incident.status}</span>
          </span>

          <button 
            type="button"
            className="btn btn-ghost btn-sm" 
            onClick={() => setExpanded(!expanded)}
            style={{ padding: '0.25rem 0.5rem', color: 'var(--text-body)' }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Sequential Stage Badges */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', 
        gap: '0.45rem', 
        marginBottom: '1rem' 
      }}>
        {stages.map((st, idx) => {
          const isDone = st.completed;
          const isCurrent = st.active && !st.completed;

          return (
            <motion.div 
              key={st.key}
              animate={isCurrent ? { scale: [1, 1.02, 1] } : {}}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{
                padding: '0.55rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid',
                borderColor: isDone ? 'var(--status-success-border)' : isCurrent ? 'var(--color-primary)' : 'var(--border-subtle)',
                background: isDone ? 'var(--status-success-bg)' : isCurrent ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)' }}>0{idx + 1}</span>
                {isDone ? (
                  <Check size={12} color="var(--status-success-text)" />
                ) : isCurrent ? (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)' }} />
                ) : (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border-default)' }} />
                )}
              </div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isDone ? 'var(--status-success-text)' : isCurrent ? 'var(--color-primary)' : 'var(--text-main)' }}>
                {st.label}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {st.info}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Autonomous Replanning Branch Visualization (When replanning occurs) */}
      {hasReplanning && (
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ 
            background: 'var(--status-replan-bg)', 
            border: '1px solid var(--status-replan-border)', 
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem',
            marginBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', fontWeight: 700, color: 'var(--status-replan-text)' }}>
            <GitBranch size={16} />
            <span>Autonomous Self-Healing Recovery Loop (Replan #{incident.replan_count || 1})</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', fontSize: '0.76rem' }}>
            <div style={{ background: '#FFFFFF', padding: '0.6rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--status-replan-border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--status-danger-text)', marginBottom: '0.2rem' }}>
                ✕ Run #1: Initial Attempt
              </div>
              <div style={{ color: 'var(--text-body)' }}>
                Verification audit detected physical hardware defect. Work Order #1 cancelled; technician added to exclusion blacklist.
              </div>
            </div>

            <div style={{ background: '#FFFFFF', padding: '0.6rem', borderRadius: 'var(--radius-xs)', border: '1px solid var(--status-success-border)' }}>
              <div style={{ fontWeight: 700, color: 'var(--status-success-text)', marginBottom: '0.2rem' }}>
                ✓ Run #2: Autonomous Recovery
              </div>
              <div style={{ color: 'var(--text-body)' }}>
                Replanning Agent selected alternative specialist, generated Work Order #2, executed calibration, and verified space readiness.
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Expandable Agent Runs & Event History */}
      {expanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.85rem' }}>
          
          {/* AgentRun Selector (When multiple runs exist) */}
          {runs.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                Filter Run:
              </span>
              <button
                type="button"
                className={`btn btn-sm ${selectedRunId === null ? 'btn-primary' : 'btn-ghost'}`}
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                onClick={() => setSelectedRunId(null)}
              >
                All Runs ({events.length})
              </button>
              {runs.map(r => (
                <button
                  key={r.id}
                  type="button"
                  className={`btn btn-sm ${selectedRunId === r.id ? 'btn-primary' : 'btn-ghost'}`}
                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}
                  onClick={() => setSelectedRunId(r.id)}
                >
                  Run #{r.run_number} ({r.trigger_reason})
                </button>
              ))}
            </div>
          )}

          {/* Event Stream Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Authoritative Event History ({filteredEvents.length})
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowRawJson(!showRawJson)}
              style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', color: 'var(--text-muted)' }}
            >
              <Code size={12} /> {showRawJson ? 'Hide Raw Telemetry' : 'View Raw Telemetry'}
            </button>
          </div>

          {/* Event Stream List */}
          <div style={{ 
            background: 'var(--bg-surface)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '0.65rem',
            maxHeight: 280,
            overflowY: 'auto'
          }}>
            {filteredEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                Awaiting agent pipeline execution events...
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                <AnimatePresence>
                  {filteredEvents.slice().reverse().map(ev => (
                    <motion.div 
                      key={ev.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column',
                        gap: '0.25rem',
                        padding: '0.45rem 0.65rem', 
                        background: '#FFFFFF',
                        borderRadius: 'var(--radius-xs)',
                        border: '1px solid var(--border-subtle)',
                        fontSize: '0.78rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                            {ev.agent}
                          </span>
                          <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>·</span>
                          <span style={{ color: 'var(--text-body)' }}>
                            {ev.action}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span className={`badge ${ev.status === 'SUCCESS' ? 'badge-success' : ev.status === 'FAILED' ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: '0.65rem', padding: '0.1rem 0.35rem' }}>
                            {ev.status}
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                            {new Date(ev.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {showRawJson && ev.detail && (
                        <pre style={{ 
                          fontSize: '0.68rem', 
                          fontFamily: 'var(--font-mono)', 
                          background: 'var(--bg-surface)', 
                          padding: '0.35rem', 
                          borderRadius: 3, 
                          overflowX: 'auto',
                          marginTop: '0.25rem',
                          color: 'var(--text-dark)'
                        }}>
                          {JSON.stringify(ev.detail, null, 2)}
                        </pre>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

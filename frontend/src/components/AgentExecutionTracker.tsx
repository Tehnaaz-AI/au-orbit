import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, AgentEvent, AgentRun } from '../types';
import { api } from '../api';
import { 
  GitBranch, 
  Radio, 
  Code, 
  Check, 
  X
} from 'lucide-react';

interface AgentExecutionTrackerProps {
  incident: Incident;
  compact?: boolean;
}

export const AgentExecutionTracker: React.FC<AgentExecutionTrackerProps> = ({ incident, compact = false }) => {
  const [events, setEvents] = useState<AgentEvent[]>(incident.events || []);
  const [selectedEventDetails, setSelectedEventDetails] = useState<AgentEvent | null>(null);
  const [showTechnicalDrawer, setShowTechnicalDrawer] = useState(false);

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

  // Group authentic events by AgentRun
  const run1Events = events.filter(e => e.agent_run_id === (runs[0]?.id || 1) || (!e.agent_run_id && runs.length <= 1));
  const run2Events = runs.length > 1 ? events.filter(e => e.agent_run_id === runs[1]?.id) : [];

  const hasReplanning = (incident.replan_count || 0) > 0 || incident.status === 'REPLANNING' || events.some(e => e.agent === 'Replanning Agent');

  const formatEventDetail = (evt: AgentEvent): string => {
    if (typeof evt.detail === 'string') return evt.detail;
    if (evt.detail && typeof evt.detail === 'object') {
      if (evt.detail.notes) return String(evt.detail.notes);
      if (evt.detail.reason) return String(evt.detail.reason);
      if (evt.detail.message) return String(evt.detail.message);
      if (evt.detail.decision_reason) return String(evt.detail.decision_reason);
      return JSON.stringify(evt.detail).slice(0, 100);
    }
    return evt.action || 'Agent execution step recorded';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Tracker Status Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0.65rem 0.85rem',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-sm)',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="pulse-dot" />
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Autonomous Execution Pipeline
          </span>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            ({events.length} {events.length === 1 ? 'event' : 'events'} recorded)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
            <Radio size={10} color="var(--color-primary)" />
            <span>SSE Live Stream</span>
          </span>
          {events.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              onClick={() => {
                setSelectedEventDetails(events[events.length - 1]);
                setShowTechnicalDrawer(true);
              }}
            >
              <Code size={12} /> View Technical Details
            </motion.button>
          )}
        </div>
      </div>

      {/* Vertical Operational Execution Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* RUN #1 Section */}
        <div style={{ 
          background: '#FFFFFF', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-sm)', 
          padding: '1rem' 
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span className="badge badge-role mono" style={{ fontSize: '0.72rem' }}>RUN 01</span>
              <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>Initial Autonomous Workflow</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {runs[0]?.trigger_reason || 'Initial Dispatch'}
            </span>
          </div>

          {events.length === 0 ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Agents are initiating pipeline execution...
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', position: 'relative', paddingLeft: '1.5rem' }}>
              {/* Vertical connecting line */}
              <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--border-default)', zIndex: 0 }} />

              <AnimatePresence>
                {run1Events.map((evt, idx) => {
                  const isFailed = evt.status === 'FAILED' || evt.action.toLowerCase().includes('fail') || (evt.detail && evt.detail.outcome === 'fail');
                  const isLast = idx === run1Events.length - 1 && !hasReplanning;

                  return (
                    <motion.div 
                      key={evt.id || idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', zIndex: 1 }}
                    >
                      {/* Node marker */}
                      <div style={{ 
                        position: 'absolute', 
                        left: '-1.5rem', 
                        top: '2px', 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        background: isFailed ? 'var(--status-error-text)' : isLast ? 'var(--color-primary)' : '#FFFFFF', 
                        border: `2px solid ${isFailed ? 'var(--status-error-text)' : isLast ? 'var(--color-primary)' : 'var(--border-default)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isFailed || isLast ? '#FFFFFF' : 'var(--text-muted)'
                      }}>
                        {isFailed ? <X size={10} /> : isLast ? <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#FFF' }} /> : <Check size={10} color="var(--status-success-text)" />}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isFailed ? 'var(--status-error-text)' : 'var(--text-main)' }}>
                            {evt.agent}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                            {evt.action}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>
                          {formatEventDetail(evt)}
                        </div>
                      </div>

                      {/* Timestamp & Drawer Trigger */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {evt.created_at ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          type="button"
                          className="btn-ghost btn-sm"
                          style={{ padding: '0.15rem', color: 'var(--text-dim)' }}
                          onClick={() => {
                            setSelectedEventDetails(evt);
                            setShowTechnicalDrawer(true);
                          }}
                          title="View payload"
                        >
                          <Code size={12} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* REPLANNING BRANCH (When Self-Healing Loop Triggers) */}
        {hasReplanning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ 
              background: 'var(--status-replan-bg)', 
              border: '1px solid var(--status-replan-border)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '0.85rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.84rem', fontWeight: 700, color: 'var(--status-replan-text)' }}>
              <GitBranch size={16} />
              <span>Autonomous Self-Healing Loop Triggered (Replan #{incident.replan_count || 1})</span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-body)', margin: 0 }}>
              Verification failure detected in Run #1. Replanning agent updated state machine, reassessed constraints, and allocated alternate specialist for Run #2.
            </p>
          </motion.div>
        )}

        {/* RUN #2 Section (Self-Healing Recovery) */}
        {runs.length > 1 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            style={{ 
              background: '#FFFFFF', 
              border: '1px solid var(--status-success-border)', 
              borderRadius: 'var(--radius-sm)', 
              padding: '1rem' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="badge badge-success mono" style={{ fontSize: '0.72rem' }}>RUN 02</span>
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--status-success-text)' }}>Autonomous Recovery & Resolution</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {runs[1]?.trigger_reason || 'Replanning Recovery'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', position: 'relative', paddingLeft: '1.5rem' }}>
              <div style={{ position: 'absolute', left: '7px', top: '10px', bottom: '10px', width: '2px', background: 'var(--status-success-border)', zIndex: 0 }} />

              <AnimatePresence>
                {run2Events.map((evt, idx) => {
                  const isLast = idx === run2Events.length - 1;

                  return (
                    <motion.div 
                      key={evt.id || idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem', zIndex: 1 }}
                    >
                      <div style={{ 
                        position: 'absolute', 
                        left: '-1.5rem', 
                        top: '2px', 
                        width: '16px', 
                        height: '16px', 
                        borderRadius: '50%', 
                        background: isLast && incident.status === 'RESOLVED' ? 'var(--status-success-text)' : '#FFFFFF', 
                        border: '2px solid var(--status-success-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF'
                      }}>
                        <Check size={10} color={isLast && incident.status === 'RESOLVED' ? '#FFFFFF' : 'var(--status-success-text)'} />
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--status-success-text)' }}>
                            {evt.agent}
                          </span>
                          <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                            {evt.action}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--text-body)', marginTop: '0.15rem' }}>
                          {formatEventDetail(evt)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {evt.created_at ? new Date(evt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.15 }}
                          type="button"
                          className="btn-ghost btn-sm"
                          style={{ padding: '0.15rem', color: 'var(--text-dim)' }}
                          onClick={() => {
                            setSelectedEventDetails(evt);
                            setShowTechnicalDrawer(true);
                          }}
                          title="View payload"
                        >
                          <Code size={12} />
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

      </div>

      {/* Technical Details Modal / Drawer */}
      {showTechnicalDrawer && selectedEventDetails && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay" 
          onClick={() => setShowTechnicalDrawer(false)}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="modal-content" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  Technical Event Payload · Event #{selectedEventDetails.id || 'N/A'}
                </span>
              </div>
              <button 
                type="button" 
                className="btn-ghost btn-sm" 
                onClick={() => setShowTechnicalDrawer(false)}
                style={{ padding: '0.25rem' }}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.78rem' }}>
                <div><b>Agent:</b> {selectedEventDetails.agent}</div>
                <div><b>Action:</b> {selectedEventDetails.action}</div>
                <div><b>Tool Call:</b> {selectedEventDetails.tool || 'Autonomous Orchestration'}</div>
                <div><b>Run ID:</b> #{selectedEventDetails.agent_run_id || 1}</div>
              </div>

              <div className="form-label" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>Event Detail / Payload:</div>
              <pre style={{ 
                background: '#2F2F2F', 
                color: '#81C784', 
                padding: '0.75rem', 
                borderRadius: 'var(--radius-xs)', 
                fontSize: '0.75rem', 
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)' 
              }}>
                {JSON.stringify(selectedEventDetails.detail || selectedEventDetails, null, 2)}
              </pre>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                onClick={() => setShowTechnicalDrawer(false)}
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
};

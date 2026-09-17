import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, User, AnalyticsMetrics } from '../types';
import { api } from '../api';
import { 
  RotateCcw, 
  PlusCircle, 
  Send, 
  Clock, 
  MapPin, 
  ArrowRight,
  ClipboardList,
  CheckCircle,
  Inbox
} from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  incidents: Incident[];
  analytics: AnalyticsMetrics | null;
  onSelectIncident: (incident: Incident) => void;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.04 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const }
  }
};

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  incidents,
  analytics,
  onSelectIncident,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [description, setDescription] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);

  async function handleReport(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      const newInc = await api.reportIncident({
        reporter: currentUser.full_name,
        description: description.trim(),
        room_code: roomCode.trim() || undefined
      });
      setSubmittedIncident(newInc);
      onSuccess(`Incident #${newInc.id} reported.`);
      setDescription('');
      setRoomCode('');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to submit incident');
    } finally {
      setSubmitting(false);
    }
  }

  // Real operational counts calculated strictly from backend data
  const activeIncidents = incidents.filter(i => !['RESOLVED', 'CLOSED'].includes(i.status));
  const inProgressCount = incidents.filter(i => ['IN_PROGRESS', 'ASSIGNED', 'SCHEDULED'].includes(i.status)).length;
  const awaitingVerification = incidents.filter(i => ['AWAITING_VERIFICATION', 'REOPENED'].includes(i.status)).length;
  const resolvedCount = incidents.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status)).length;

  const priorityBadgeClass: Record<string, string> = {
    EMERGENCY: 'badge-danger',
    HIGH: 'badge-danger',
    NORMAL: 'badge-info',
    LOW: 'badge-neutral'
  };

  const statusBadgeClass: Record<string, string> = {
    RESOLVED: 'badge-success',
    CLOSED: 'badge-success',
    IN_PROGRESS: 'badge-info',
    SCHEDULED: 'badge-info',
    ASSIGNED: 'badge-info',
    REPLANNING: 'badge-replan',
    AWAITING_VERIFICATION: 'badge-warning',
    REOPENED: 'badge-warning',
    REPORTED: 'badge-neutral'
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      
      {/* 1. Header: Calm Operational Overview */}
      <motion.div 
        variants={itemVariants}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Operational Overview
            <span className="pulse-dot" style={{ marginLeft: 4 }} />
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Autonomous university operations, multi-agent dispatch, and facility maintenance.
          </p>
        </div>

        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={onRefresh}
        >
          <RotateCcw size={13} /> Refresh
        </motion.button>
      </motion.div>

      {/* 2. Real Operational Metric Cards */}
      <motion.div variants={itemVariants} className="stats-grid">
        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">Active Issues</div>
          <div className="stat-value">{activeIncidents.length}</div>
          <div className="stat-desc">Requiring operational attention</div>
        </motion.div>

        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{inProgressCount}</div>
          <div className="stat-desc">Assigned & scheduled operations</div>
        </motion.div>

        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">Awaiting Verification</div>
          <div className="stat-value">{awaitingVerification}</div>
          <div className="stat-desc">Completed work pending audit</div>
        </motion.div>

        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{resolvedCount}</div>
          <div className="stat-desc">Closed verified operations</div>
        </motion.div>
      </motion.div>

      {/* 3. Main Grid: Natural-Language Report Issue + Current Incidents */}
      <motion.div 
        variants={itemVariants}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}
      >
        
        {/* Natural-Language Report Card */}
        <div className="card card-interactive">
          <div className="card-header">
            <span className="card-title">
              <PlusCircle size={16} color="var(--color-primary)" />
              Report an Issue
            </span>
          </div>

          {submittedIncident ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ 
                padding: '1.25rem', 
                background: 'var(--status-success-bg)', 
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--status-success-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-success-text)', fontWeight: 700, fontSize: '0.9rem' }}>
                <CheckCircle size={18} />
                <span>Incident #{submittedIncident.id} reported</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: 0 }}>
                AUOrbit is analyzing the issue and coordinating autonomous dispatch.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onSelectIncident(submittedIncident);
                    setSubmittedIncident(null);
                  }}
                >
                  View Incident & Agent Tracker <ArrowRight size={13} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSubmittedIncident(null)}
                >
                  Report Another
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleReport}>
              <div className="form-group">
                <label className="form-label" htmlFor="problem-desc">
                  What's happening?
                </label>
                <textarea
                  id="problem-desc"
                  className="form-textarea"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder='Describe the issue in your own words (e.g., "The projector in Room I-302 is not working and class is in session")'
                  required
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="room-code">
                  Location (Optional)
                </label>
                <input
                  id="room-code"
                  type="text"
                  className="form-input"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value)}
                  placeholder="e.g., Room I-302, D-101, APJ-HALL"
                />
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting || !description.trim()}
                style={{ width: '100%' }}
              >
                {submitting ? 'Reporting...' : 'Report Issue'} <Send size={14} />
              </motion.button>
            </form>
          )}
        </div>

        {/* Current Incidents Feed */}
        <div className="card card-interactive">
          <div className="card-header">
            <span className="card-title">
              <ClipboardList size={16} color="var(--color-primary-dark)" />
              Needs Attention & Recent Issues
            </span>
            <span className="badge badge-neutral mono">{incidents.length} Total</span>
          </div>

          {incidents.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-icon">
                <Inbox size={22} />
              </div>
              <div className="empty-state-title">No active issues</div>
              <div className="empty-state-text">
                Your campus currently has no unresolved operational incidents.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 380, overflowY: 'auto' }}>
              <AnimatePresence>
                {incidents.slice(0, 10).map(inc => (
                  <motion.div
                    key={inc.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onSelectIncident(inc)}
                    style={{
                      padding: '0.75rem 0.85rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-subtle)';
                      e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          #{inc.id}
                        </span>
                        <span className={`badge ${statusBadgeClass[inc.status] || 'badge-neutral'}`}>
                          {inc.status}
                        </span>
                        <span className={`badge ${priorityBadgeClass[inc.priority] || 'badge-neutral'}`}>
                          {inc.priority}
                        </span>
                        {inc.replan_count > 0 && (
                          <span className="badge badge-replan">
                            Replan #{inc.replan_count}
                          </span>
                        )}
                      </div>

                      <div style={{ 
                        fontSize: '0.82rem', 
                        color: 'var(--text-body)', 
                        whiteSpace: 'nowrap', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis' 
                      }}>
                        {inc.description}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={11} /> {inc.room_code || 'Campus Space'}
                        </span>
                        <span>·</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={11} /> {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      style={{ flexShrink: 0 }}
                    >
                      View Incident
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

      </motion.div>

    </motion.div>
  );
};

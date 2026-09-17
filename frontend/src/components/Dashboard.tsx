import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, User, AnalyticsMetrics } from '../types';
import { api } from '../api';
import { 
  RotateCcw, 
  Activity, 
  Sparkles,
  ChevronRight,
  Inbox,
  Send,
  Radio
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
    transition: { staggerChildren: 0.08, delayChildren: 0.05 }
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
      onSuccess(`Incident #${newInc.id} reported and processed autonomously!`);
      setDescription('');
      setRoomCode('');
      onRefresh();
      onSelectIncident(newInc);
    } catch (err: any) {
      onError(err.message || 'Failed to submit incident');
    } finally {
      setSubmitting(false);
    }
  }

  const activeIncidents = incidents.filter(i => !['RESOLVED', 'CLOSED'].includes(i.status));
  const emergencyCount = incidents.filter(i => ['EMERGENCY', 'HIGH'].includes(i.priority) && !['RESOLVED', 'CLOSED'].includes(i.status)).length;
  const inProgressCount = incidents.filter(i => i.status === 'IN_PROGRESS' || i.status === 'ASSIGNED' || i.status === 'SCHEDULED').length;
  const awaitingVerification = incidents.filter(i => i.status === 'AWAITING_VERIFICATION' || i.status === 'REOPENED').length;
  const resolvedCount = incidents.filter(i => i.status === 'RESOLVED' || i.status === 'CLOSED').length;
  const replanCount = incidents.filter(i => (i.replan_count || 0) > 0 || i.status === 'REPLANNING').length;

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
      
      {/* Welcome & Campus Stats Header */}
      <motion.div 
        variants={itemVariants}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Operational Overview
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--color-primary)', background: 'var(--color-primary-subtle)', padding: '0.2rem 0.55rem', borderRadius: 999, fontWeight: 700 }}>
              <Radio size={10} /> LIVE ORCHESTRATION
            </span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Live status of campus facilities, multi-agent dispatch, and incident resolution.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onRefresh}
          >
            <RotateCcw size={13} /> Refresh Data
          </motion.button>
        </div>
      </motion.div>

      {/* Real Statistics Grid */}
      <motion.div variants={itemVariants} className="stats-grid">
        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">Active Incidents</div>
          <div className="stat-value">{activeIncidents.length}</div>
          <div className="stat-desc">{emergencyCount} high priority or emergency</div>
        </motion.div>

        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">In-Progress Work</div>
          <div className="stat-value">{inProgressCount}</div>
          <div className="stat-desc">Assigned & scheduled operations</div>
        </motion.div>

        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">Awaiting Verification</div>
          <div className="stat-value">{awaitingVerification}</div>
          <div className="stat-desc">Pending independent check</div>
        </motion.div>

        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">Resolved Operations</div>
          <div className="stat-value">{resolvedCount}</div>
          <div className="stat-desc">{replanCount} recovered via replan</div>
        </motion.div>
      </motion.div>

      {/* Main Grid: Natural-Language Reporter + Recent Incidents */}
      <motion.div 
        variants={itemVariants}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}
      >
        
        {/* Natural-Language Incident Submission Card */}
        <div className="card card-interactive">
          <div className="card-header">
            <span className="card-title">
              <Sparkles size={16} color="var(--color-primary)" />
              Report Campus Issue
            </span>
            <span className="badge badge-role">Natural Language</span>
          </div>

          <form onSubmit={handleReport}>
            <div className="form-group">
              <label className="form-label">
                What is happening?
              </label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="e.g. The projector in Room I-302 is flickering and unusable during AI class."
                required
                rows={3}
              />
              <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
                Gemini AI will automatically extract problem category, room, and timetable urgency.
              </small>
            </div>

            <div className="form-group">
              <label className="form-label">
                Location (Optional / Specific Space)
              </label>
              <input
                type="text"
                className="form-input"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value)}
                placeholder="e.g. I-302, D-101, APJ-HALL"
              />
            </div>

            <motion.button 
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting || !description.trim()}
              style={{ width: '100%' }}
            >
              {submitting ? 'Executing Agent Pipeline...' : 'Submit & Trigger Autonomous Pipeline'} <Send size={15} />
            </motion.button>
          </form>
        </div>

        {/* Recent Incidents Table / List */}
        <div className="card card-interactive">
          <div className="card-header">
            <span className="card-title">
              <Activity size={16} color="var(--color-primary)" />
              Active & Recent Incidents
            </span>
            <span className="badge badge-neutral mono">{incidents.length} Total</span>
          </div>

          {incidents.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem 1rem' }}>
              <div className="empty-state-icon">
                <Inbox size={24} />
              </div>
              <div className="empty-state-title">No incidents reported yet</div>
              <div className="empty-state-text">
                Your campus currently has no unresolved operational incidents. Submit a problem report above to trigger the autonomous multi-agent pipeline.
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', maxHeight: 360, overflowY: 'auto' }}>
              <AnimatePresence>
                {incidents.slice(0, 8).map(inc => (
                  <motion.div
                    key={inc.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          #{inc.id}
                        </span>
                        <span className={`badge ${statusBadgeClass[inc.status] || 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                          {inc.status}
                        </span>
                        <span className={`badge ${priorityBadgeClass[inc.priority] || 'badge-neutral'}`} style={{ fontSize: '0.65rem' }}>
                          {inc.priority}
                        </span>
                        {inc.replan_count > 0 && (
                          <span className="badge badge-replan" style={{ fontSize: '0.65rem' }}>
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

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', gap: '0.75rem' }}>
                        <span>{inc.room_code || 'General Space'}</span>
                        <span>·</span>
                        <span>{new Date(inc.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <ChevronRight size={16} color="var(--text-dim)" />
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

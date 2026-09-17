import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, Room, User } from '../types';
import { api } from '../api';
import { 
  Send, 
  RotateCcw,
  Inbox,
  MapPin,
  Clock,
  ClipboardList,
  PlusCircle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface StudentPortalProps {
  currentUser: User;
  incidents: Incident[];
  rooms: Room[];
  onSelectIncident?: (incident: Incident) => void;
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

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  incidents,
  rooms,
  onSelectIncident,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [description, setDescription] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const created = await api.reportIncident({
        reporter: `${currentUser.full_name} (Student)`,
        description: description.trim(),
        room_code: roomCode.trim() || undefined
      });
      setSubmittedIncident(created);
      setDescription('');
      setRoomCode('');
      onSuccess(`Issue reported.`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to submit issue report');
    } finally {
      setSubmitting(false);
    }
  }

  const myIncidents = incidents.filter(i => 
    i.reporter.toLowerCase().includes(currentUser.full_name.toLowerCase()) ||
    submittedIncident?.id === i.id
  );

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
      
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', color: 'var(--text-main)' }}>
            Student Issue Hub
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Report classroom, lab, or campus facility issues for immediate resolution.
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

      {/* Report Issue Card */}
      <motion.div variants={itemVariants} className="card card-interactive">
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
              AUOrbit is analyzing the problem and coordinating automated specialist dispatch.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {onSelectIncident && (
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
                  View Live Progress <ArrowRight size={13} />
                </motion.button>
              )}
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="student-desc">What's happening?</label>
              <textarea
                id="student-desc"
                className="form-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder='Describe the problem (e.g., "The projector in Room I-302 is flickering")'
                required
                rows={3}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="student-loc">Location / Room (Optional)</label>
              <input
                id="student-loc"
                type="text"
                className="form-input"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value)}
                placeholder="e.g., I-302, D-101, APJ-HALL"
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
              {submitting ? 'Submitting...' : 'Report Issue'} <Send size={14} />
            </motion.button>
          </form>
        )}
      </motion.div>

      {/* My Reported Issues Feed */}
      <motion.div variants={itemVariants} className="card card-interactive">
        <div className="card-header">
          <span className="card-title">
            <ClipboardList size={16} color="var(--color-primary-dark)" />
            My Reported Issues ({myIncidents.length})
          </span>
        </div>

        {myIncidents.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem', border: 'none' }}>
            <div className="empty-state-icon">
              <Inbox size={22} />
            </div>
            <div className="empty-state-title">No issues reported yet</div>
            <div className="empty-state-text">
              Issues you report for campus facilities or classrooms will appear here with real-time status.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <AnimatePresence>
              {myIncidents.map(inc => (
                <motion.div 
                  key={inc.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  className="card-interactive"
                  onClick={() => onSelectIncident && onSelectIncident(inc)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    padding: '0.75rem 0.85rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    gap: '0.75rem'
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
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {inc.description}
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={11} /> {inc.room_code || 'Campus Space'}
                      </span>
                      <span>·</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={11} /> {new Date(inc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {onSelectIncident && (
                    <button 
                      type="button" 
                      className="btn btn-secondary btn-sm"
                      style={{ flexShrink: 0 }}
                    >
                      View Issue
                    </button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

    </motion.div>
  );
};

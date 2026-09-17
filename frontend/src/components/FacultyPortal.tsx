import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, TimetableItem, Room, User } from '../types';
import { api } from '../api';
import { AgentExecutionTracker } from './AgentExecutionTracker';
import { 
  Flame, 
  CheckCircle2, 
  RotateCcw, 
  Send,
  Calendar,
  Inbox,
  AlertTriangle,
  GraduationCap
} from 'lucide-react';

interface FacultyPortalProps {
  currentUser: User;
  incidents: Incident[];
  timetable: TimetableItem[];
  rooms: Room[];
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
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

export const FacultyPortal: React.FC<FacultyPortalProps> = ({
  currentUser,
  incidents,
  timetable,
  rooms,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [selectedRoom, setSelectedRoom] = useState('I-302');
  const [description, setDescription] = useState('Projector audio failure in Room I-302 right before lecture');
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const pendingVerification = incidents.filter(i => 
    i.status === 'AWAITING_VERIFICATION' || 
    (i.work_order?.status === 'COMPLETED' && !['RESOLVED', 'CLOSED'].includes(i.status))
  );

  const facultyTimetable = timetable.slice(0, 6);

  async function handleReportUrgent(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      const created = await api.reportIncident({
        reporter: `${currentUser.full_name} [FACULTY]`,
        description: description.trim(),
        room_code: selectedRoom.trim() || undefined
      });
      onSuccess(`Priority Incident #${created.id} reported and escalated!`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to submit incident');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerification(workOrderId: number, outcome: 'pass' | 'fail') {
    setVerifyingId(workOrderId);
    try {
      await api.workOrderAction(workOrderId, 'verify', {
        outcome,
        notes: outcome === 'pass' 
          ? 'Faculty verified: Equipment restored and operational.' 
          : 'Faculty rejected: Issue persists.'
      });
      if (outcome === 'pass') {
        onSuccess('Resolution verified! Equipment restored.');
      } else {
        onError('Verification rejected. Autonomous replanning triggered.');
      }
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  }

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
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <GraduationCap color="var(--color-primary)" size={26} />
            Faculty Lecture Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Classroom maintenance dispatch with timetable-aware priority escalation and resolution sign-off.
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

      {/* Urgent Classroom Escalation */}
      <motion.div variants={itemVariants} className="card card-interactive">
        <div className="card-header">
          <span className="card-title">
            <Flame size={16} color="var(--status-warning-text)" />
            Classroom Emergency Escalation
          </span>
          <span className="badge badge-warning">Timetable Linked</span>
        </div>

        {/* Timetable Quick Selector */}
        {facultyTimetable.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.45rem' }}>
              Select Teaching Space (From Reference Timetable)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
              {facultyTimetable.map(item => (
                <motion.div 
                  key={item.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedRoom(item.room_code)}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: selectedRoom === item.room_code ? 'var(--color-primary)' : 'var(--border-subtle)',
                    background: selectedRoom === item.room_code ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    <span>{item.room_code}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Period {item.period}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-body)' }}>{item.subject} ({item.section})</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleReportUrgent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Room</label>
              <input
                type="text"
                className="form-input"
                value={selectedRoom}
                onChange={e => setSelectedRoom(e.target.value)}
                placeholder="I-302"
                required
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Urgent Problem Description</label>
              <input
                type="text"
                className="form-input"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe issue impacting ongoing lecture..."
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting || !description.trim()}
            >
              {submitting ? 'Escalating...' : 'Escalate Classroom Issue'} <Flame size={15} />
            </motion.button>
          </div>
        </form>
      </motion.div>

      {/* Classroom Verification & Sign-Off */}
      <motion.div variants={itemVariants} className="card card-interactive">
        <div className="card-header">
          <span className="card-title">
            <CheckCircle2 size={16} color="var(--status-success-text)" />
            Classroom Resolution Sign-Off ({pendingVerification.length})
          </span>
          <span className="badge badge-role">Verification Agent</span>
        </div>

        {pendingVerification.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem', border: 'none' }}>
            <div className="empty-state-icon">
              <Inbox size={24} />
            </div>
            <div className="empty-state-title">No spaces awaiting verification</div>
            <div className="empty-state-text">
              Repaired classrooms requiring faculty confirmation before closure will appear here automatically.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <AnimatePresence>
              {pendingVerification.map(inc => (
                <motion.div 
                  key={inc.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  style={{ 
                    background: 'var(--status-success-bg)', 
                    border: '1px solid var(--status-success-border)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '1rem' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--status-success-text)' }}>
                        Incident #{inc.id} · Space: {inc.room_code || 'Classroom'}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginLeft: '0.5rem' }}>
                        {inc.description}
                      </span>
                    </div>

                    {inc.work_order && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <motion.button 
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={verifyingId === inc.work_order.id}
                          onClick={() => handleVerification(inc.work_order!.id, 'pass')}
                        >
                          <CheckCircle2 size={13} /> Verify Fixed
                        </motion.button>
                        <motion.button 
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={verifyingId === inc.work_order.id}
                          onClick={() => handleVerification(inc.work_order!.id, 'fail')}
                        >
                          <AlertTriangle size={13} /> Still Broken (Trigger Replan)
                        </motion.button>
                      </div>
                    )}
                  </div>

                  <AgentExecutionTracker incident={inc} compact={true} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

    </motion.div>
  );
};

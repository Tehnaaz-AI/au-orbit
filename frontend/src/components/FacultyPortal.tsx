import React, { useState } from 'react';
import { Incident, TimetableItem, Room, User } from '../types';
import { api } from '../api';
import { 
  CheckCircle, 
  RotateCcw, 
  Send,
  Inbox,
  AlertTriangle,
  GraduationCap,
  Calendar,
  MapPin,
  Clock,
  ArrowRight
} from 'lucide-react';

interface FacultyPortalProps {
  currentUser: User;
  incidents: Incident[];
  timetable: TimetableItem[];
  rooms: Room[];
  onSelectIncident?: (incident: Incident) => void;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const FacultyPortal: React.FC<FacultyPortalProps> = ({
  currentUser,
  incidents,
  timetable,
  rooms,
  onSelectIncident,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [selectedRoom, setSelectedRoom] = useState('I-302');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);

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
      setSubmittedIncident(created);
      onSuccess(`Priority Incident #${created.id} reported.`);
      setDescription('');
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
        onSuccess('Resolution verified. Classroom restored.');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <GraduationCap color="var(--color-primary)" size={22} />
            Classroom & Department Operations
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Classroom maintenance dispatch with timetable-aware priority escalation and resolution sign-off.
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={onRefresh}
        >
          <RotateCcw size={13} /> Refresh
        </button>
      </div>

      {/* Classroom Emergency Escalation */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            Report Classroom Issue
          </span>
          <span className="badge badge-warning">Timetable Linked</span>
        </div>

        {/* Timetable Quick Selector */}
        {facultyTimetable.length > 0 && (
          <div style={{ marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
              Select Teaching Space (From Reference Timetable)
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.45rem' }}>
              {facultyTimetable.map(item => (
                <div 
                  key={item.id}
                  onClick={() => setSelectedRoom(item.room_code)}
                  style={{
                    padding: '0.5rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: selectedRoom === item.room_code ? 'var(--color-primary)' : 'var(--border-subtle)',
                    background: selectedRoom === item.room_code ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    <span>{item.room_code}</span>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Period {item.period}</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-body)' }}>{item.subject} ({item.section})</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {submittedIncident ? (
          <div style={{ 
            padding: '1.25rem', 
            background: 'var(--status-success-bg)', 
            borderRadius: 'var(--radius-sm)', 
            border: '1px solid var(--status-success-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-success-text)', fontWeight: 700, fontSize: '0.9rem' }}>
              <CheckCircle size={18} />
              <span>Priority Incident #{submittedIncident.id} reported</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: 0 }}>
              AUOrbit is scheduling immediate emergency specialist intervention for {submittedIncident.room_code || 'Space'}.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {onSelectIncident && (
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onSelectIncident(submittedIncident);
                    setSubmittedIncident(null);
                  }}
                >
                  View Live Progress <ArrowRight size={13} />
                </button>
              )}
              <button 
                type="button" 
                className="btn btn-secondary btn-sm"
                onClick={() => setSubmittedIncident(null)}
              >
                Report Another
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleReportUrgent} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="fac-room">Room</label>
                <input
                  id="fac-room"
                  type="text"
                  className="form-input"
                  value={selectedRoom}
                  onChange={e => setSelectedRoom(e.target.value)}
                  placeholder="I-302"
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="fac-desc">Urgent Problem Description</label>
                <input
                  id="fac-desc"
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
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting || !description.trim()}
              >
                {submitting ? 'Escalating...' : 'Report Classroom Issue'} <Send size={14} />
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Classroom Resolution Sign-Off */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <CheckCircle size={16} color="var(--status-success-text)" />
            Classroom Resolution Sign-Off ({pendingVerification.length})
          </span>
          <span className="badge badge-role">Verification Audit</span>
        </div>

        {pendingVerification.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem', border: 'none' }}>
            <div className="empty-state-icon">
              <Inbox size={22} />
            </div>
            <div className="empty-state-title">No spaces awaiting verification</div>
            <div className="empty-state-text">
              Repaired classrooms requiring faculty confirmation before closure will appear here automatically.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pendingVerification.map(inc => (
              <div 
                key={inc.id}
                style={{ 
                  background: 'var(--status-success-bg)', 
                  border: '1px solid var(--status-success-border)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '1rem' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--status-success-text)' }}>
                      Incident #{inc.id} · Space: {inc.room_code || 'Classroom'}
                    </span>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-body)', margin: '0.2rem 0 0' }}>
                      {inc.description}
                    </p>
                  </div>

                  {inc.work_order && (
                    <div style={{ display: 'flex', gap: '0.45rem' }}>
                      <button 
                        type="button"
                        className="btn btn-success btn-sm"
                        disabled={verifyingId === inc.work_order.id}
                        onClick={() => handleVerification(inc.work_order!.id, 'pass')}
                      >
                        <CheckCircle size={13} /> Verify Fixed
                      </button>
                      <button 
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={verifyingId === inc.work_order.id}
                        onClick={() => handleVerification(inc.work_order!.id, 'fail')}
                      >
                        <AlertTriangle size={13} /> Still Broken (Trigger Replan)
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

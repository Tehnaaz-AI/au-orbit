import React, { useState } from 'react';
import { Incident, Room, User } from '../types';
import { api } from '../api';
import { AgentExecutionTracker } from './AgentExecutionTracker';
import { 
  Send, 
  Sparkles, 
  RotateCcw,
  Inbox,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';

interface StudentPortalProps {
  currentUser: User;
  incidents: Incident[];
  rooms: Room[];
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  incidents,
  rooms,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [description, setDescription] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [latestReported, setLatestReported] = useState<Incident | null>(null);

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
      setLatestReported(created);
      setDescription('');
      setRoomCode('');
      onSuccess(`Incident #${created.id} submitted & processed autonomously!`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to submit incident');
    } finally {
      setSubmitting(false);
    }
  }

  const myIncidents = incidents.filter(i => 
    i.reporter.toLowerCase().includes(currentUser.full_name.toLowerCase()) ||
    latestReported?.id === i.id
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem' }}>
            Student Workspace
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Report classroom or campus facility issues for immediate autonomous dispatch.
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

      {/* Incident Intake Form */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            <Sparkles size={16} color="var(--color-primary)" />
            Report a Campus Issue
          </span>
          <span className="badge badge-role">Autonomous Intake</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Location / Room (Optional)</label>
              <input
                type="text"
                className="form-input"
                value={roomCode}
                onChange={e => setRoomCode(e.target.value)}
                placeholder="e.g. I-302, D-101, APJ-HALL"
              />
            </div>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Academic Department</label>
              <input
                type="text"
                className="form-input"
                value={currentUser.department || 'General Student'}
                disabled
                style={{ backgroundColor: 'var(--color-gray-surface)' }}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Problem Description</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the issue in plain English (e.g. The projector in Room I-302 is not turning on)."
              required
              rows={3}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={submitting || !description.trim()}
            >
              {submitting ? 'Submitting & Dispatching...' : 'Submit Issue'} <Send size={15} />
            </button>
          </div>
        </form>
      </div>

      {/* Real-Time Tracker for Most Recent Reported Issue */}
      {latestReported && (
        <div>
          <AgentExecutionTracker incident={latestReported} />
        </div>
      )}

      {/* My Reported Incidents */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">
            My Reported Issues ({myIncidents.length})
          </span>
        </div>

        {myIncidents.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem', border: 'none' }}>
            <div className="empty-state-icon">
              <Inbox size={24} />
            </div>
            <div className="empty-state-title">No issues reported yet</div>
            <div className="empty-state-text">
              When you submit a campus problem above, real-time dispatch and execution tracking will appear here.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {myIncidents.map(inc => (
              <div 
                key={inc.id}
                style={{ 
                  background: 'var(--color-gray-surface)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: 'var(--radius-sm)', 
                  padding: '1rem' 
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                      #{inc.id} · {inc.room_code || 'Campus Space'}
                    </span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginLeft: '0.5rem' }}>
                      {inc.description}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <span className="badge badge-neutral">{inc.priority}</span>
                    <span className={`badge ${inc.status === 'RESOLVED' ? 'badge-success' : 'badge-info'}`}>{inc.status}</span>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem' }}>
                  <AgentExecutionTracker incident={inc} compact={true} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

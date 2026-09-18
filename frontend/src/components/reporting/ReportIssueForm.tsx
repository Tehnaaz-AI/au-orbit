import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Incident, User, Room } from '../../types';
import { api } from '../../api';
import { MediaUploadZone } from '../media/MediaUploadZone';
import { AudioRecorderZone } from '../media/AudioRecorderZone';
import { Send, CheckCircle2, ArrowRight, Sparkles, MapPin, AlertCircle, PlusCircle } from 'lucide-react';

interface ReportIssueFormProps {
  currentUser: User;
  rooms?: Room[];
  onIncidentReported: (incident: Incident) => void;
  onSelectIncident?: (incident: Incident) => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
  title?: string;
  subtitle?: string;
  defaultLocation?: string;
}

export const ReportIssueForm: React.FC<ReportIssueFormProps> = ({
  currentUser,
  rooms = [],
  onIncidentReported,
  onSelectIncident,
  onError,
  onSuccess,
  title = 'Report an Issue',
  subtitle = 'Describe the problem naturally. AUOrbit coordinates multi-agent triage, specialist dispatch, and autonomous verification.',
  defaultLocation = ''
}) => {
  const [description, setDescription] = useState('');
  const [roomCode, setRoomCode] = useState(defaultLocation);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submittedIncident, setSubmittedIncident] = useState<Incident | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;

    setSubmitting(true);
    try {
      const isFaculty = currentUser.role === 'FACULTY';
      const reporterTag = isFaculty 
        ? `${currentUser.full_name} [FACULTY]` 
        : `${currentUser.full_name} (${currentUser.role})`;

      const created = await api.reportIncident({
        reporter: reporterTag,
        description: description.trim(),
        room_code: roomCode.trim() || undefined,
        media_urls: mediaUrls
      });

      setSubmittedIncident(created);
      onIncidentReported(created);
      onSuccess(`Incident #${created.id} reported successfully.`);
      setDescription('');
      setRoomCode(defaultLocation);
      setMediaUrls([]);
    } catch (err: any) {
      onError(err.message || 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', width: '100%' }}>
      <div className="card card-interactive" style={{ padding: '1.75rem' }}>
        {/* Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: 'var(--radius-sm)', 
              background: 'var(--color-primary-subtle)', 
              color: 'var(--color-primary)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <PlusCircle size={18} />
            </div>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', margin: 0 }}>
              {title}
            </h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '0.25rem' }}>
            {subtitle}
          </p>
        </div>

        {submittedIncident ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              padding: '1.5rem',
              background: 'var(--status-success-bg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--status-success-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--status-success-text)', fontWeight: 700, fontSize: '1rem' }}>
              <CheckCircle2 size={20} />
              <span>Incident #{submittedIncident.id} Dispatched</span>
            </div>

            <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--status-success-border)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                "{submittedIncident.description}"
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                <span>Location: <strong>{submittedIncident.room_code || 'Campus Space'}</strong></span>
                <span>·</span>
                <span>Priority: <strong>{submittedIncident.priority}</strong></span>
                <span>·</span>
                <span>Status: <strong>{submittedIncident.status}</strong></span>
              </div>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-body)', margin: 0 }}>
              AUOrbit multi-agent runtime has initiated contextual triage, timetable checking, and specialist scheduling.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {onSelectIncident && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    onSelectIncident(submittedIncident);
                    setSubmittedIncident(null);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  View Incident & Agent Tracker <ArrowRight size={14} />
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setSubmittedIncident(null)}
              >
                Report Another Issue
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="issue-description" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                What's happening? <span style={{ color: 'var(--color-primary)' }}>*</span>
              </label>
              <textarea
                id="issue-description"
                className="form-textarea"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder='Describe the problem (e.g., "The ceiling projector in Room I-302 is flickering during lecture and losing HDMI input")'
                required
                rows={4}
                style={{ fontSize: '0.9rem', lineHeight: 1.5 }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="issue-location" style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                Location / Space (Optional)
              </label>
              {rooms.length > 0 ? (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    id="issue-location"
                    type="text"
                    className="form-input"
                    value={roomCode}
                    onChange={e => setRoomCode(e.target.value)}
                    placeholder="e.g., I-302, D-101, APJ-HALL"
                    style={{ flex: 1 }}
                  />
                  <select
                    className="form-select"
                    value={rooms.some(r => r.code === roomCode) ? roomCode : ''}
                    onChange={e => e.target.value && setRoomCode(e.target.value)}
                    style={{ width: '160px', fontSize: '0.82rem' }}
                  >
                    <option value="">Select Room</option>
                    {rooms.map(r => (
                      <option key={r.code} value={r.code}>{r.code} ({r.kind})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <input
                  id="issue-location"
                  type="text"
                  className="form-input"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value)}
                  placeholder="e.g., Room I-302, D-101, APJ-HALL"
                />
              )}
            </div>

            {/* Photo / Video Attachment Dropzone */}
            <MediaUploadZone
              mediaUrls={mediaUrls}
              onChange={setMediaUrls}
              label="Attach Problem Photo / Video Evidence (Optional)"
              helperText="Upload photos or videos of the flickering projector, broken AC, or lab fault."
            />

            {/* Voice Audio Recording Zone */}
            <AudioRecorderZone
              mediaUrls={mediaUrls}
              onChange={setMediaUrls}
              label="Record / Upload Audio Voice Note (Optional)"
              helperText="Speak and record what's wrong with your microphone or upload audio (.mp3, .wav, .m4a, .webm)."
            />

            <div style={{ 
              padding: '0.75rem 1rem', 
              background: 'var(--bg-surface)', 
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)'
            }}>
              <Sparkles size={15} color="var(--color-primary)" style={{ flexShrink: 0 }} />
              <span>
                AUOrbit's 9-agent pipeline will automatically extract urgency, check classroom schedules, and schedule qualified specialists.
              </span>
            </div>

            <motion.button
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              type="submit"
              className="btn btn-primary"
              disabled={submitting || !description.trim()}
              style={{ padding: '0.75rem 1.25rem', fontSize: '0.92rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {submitting ? 'Dispatching Multi-Agent Workflow...' : 'Report Issue'} <Send size={15} />
            </motion.button>
          </form>
        )}
      </div>
    </div>
  );
};

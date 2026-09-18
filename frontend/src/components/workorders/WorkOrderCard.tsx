import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { WorkOrderItem, Incident, User } from '../../types';
import { MediaUploadZone } from '../media/MediaUploadZone';
import { Wrench, Play, CheckCircle2, XCircle, MapPin, Clock, UserCheck, ArrowRight, Image, Volume2 } from 'lucide-react';

interface WorkOrderCardProps {
  workOrder: WorkOrderItem;
  incident?: Incident;
  currentUser: User;
  onSelectIncident?: (incident: Incident) => void;
  onStartJob?: (workOrderId: number) => void;
  onCompleteJob?: (workOrderId: number, notes?: string, resolutionMedia?: string[]) => void;
  onRejectJob?: (workOrderId: number) => void;
  isActing?: boolean;
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({
  workOrder,
  incident,
  currentUser,
  onSelectIncident,
  onStartJob,
  onCompleteJob,
  onRejectJob,
  isActing = false
}) => {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [resolutionMedia, setResolutionMedia] = useState<string[]>([]);

  const statusBadgeClass: Record<string, string> = {
    COMPLETED: 'badge-success',
    IN_PROGRESS: 'badge-info',
    SCHEDULED: 'badge-info',
    ASSIGNED: 'badge-info',
    REJECTED: 'badge-danger',
    CANCELLED: 'badge-neutral',
    PENDING: 'badge-neutral'
  };

  const isTechnician = currentUser.role === 'TECHNICIAN';
  const isAssignedToUser = isTechnician && (
    workOrder.technician_id === currentUser.id ||
    (workOrder.technician && workOrder.technician.toLowerCase().includes(currentUser.full_name.toLowerCase()))
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="card card-interactive"
      style={{
        padding: '1.15rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem'
      }}
    >
      {/* Top Bar: Order ID, Status, Schedule */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-primary-dark)' }}>
            Work Order #{workOrder.id}
          </span>
          <span className={`badge ${statusBadgeClass[workOrder.status] || 'badge-neutral'}`}>
            {workOrder.status}
          </span>
          {incident && (
            <span className="badge badge-neutral mono" style={{ fontSize: '0.72rem' }}>
              Incident #{incident.id}
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={12} />
          {workOrder.scheduled_for ? new Date(workOrder.scheduled_for).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Immediate'}
        </div>
      </div>

      {/* Incident Description / Order Title */}
      {incident && (
        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.45 }}>
          {incident.description}
        </div>
      )}

      {/* Reported Audio Voice Note Player for Technicians */}
      {incident?.media_urls && incident.media_urls.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', padding: '0.55rem 0.75rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          {incident.media_urls.map((url, idx) => {
            const isAudio = url.startsWith('data:audio') || url.endsWith('.mp3') || url.endsWith('.wav') || url.endsWith('.ogg') || url.endsWith('.m4a') || url.endsWith('.webm');
            if (isAudio) {
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--color-primary-dark)' }}>
                    <Volume2 size={15} /> Listen to Reported Voice Note:
                  </div>
                  <audio controls src={url} style={{ height: '32px', flex: 1, minWidth: '220px' }} />
                </div>
              );
            }
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                <Image size={13} color="var(--color-primary)" /> Photo Evidence Attached (Inspect Details)
              </div>
            );
          })}
        </div>
      )}

      {/* Metadata: Location, Assigned Specialist */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '0.65rem',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        padding: '0.5rem 0',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <MapPin size={12} color="var(--color-primary)" />
          <span>Space: <strong>{incident?.room_code || 'Campus Space'}</strong></span>
        </div>

        {incident?.reporter && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <UserCheck size={12} color="var(--color-primary-dark)" />
            <span>Reported by: <strong>{incident.reporter}</strong></span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <Wrench size={12} />
          <span>Technician: <strong>{workOrder.technician || 'Assigned Specialist'}</strong></span>
        </div>
      </div>

      {/* Technician Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        {incident && onSelectIncident && (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onSelectIncident(incident)}
            style={{ color: 'var(--color-primary)', padding: '0.25rem 0.5rem', fontSize: '0.8rem', fontWeight: 600 }}
          >
            View Incident Details <ArrowRight size={13} />
          </button>
        )}

        <div style={{ display: 'flex', gap: '0.4rem', marginLeft: 'auto', width: showNotes ? '100%' : 'auto' }}>
          {/* Start Job Action */}
          {['ASSIGNED', 'SCHEDULED'].includes(workOrder.status) && onStartJob && (
            <>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => onStartJob(workOrder.id)}
                disabled={isActing}
                style={{ fontSize: '0.78rem' }}
              >
                <Play size={12} /> Start Job
              </button>
              {onRejectJob && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onRejectJob(workOrder.id)}
                  disabled={isActing}
                  style={{ fontSize: '0.78rem' }}
                >
                  <XCircle size={12} /> Decline
                </button>
              )}
            </>
          )}

          {/* Complete Job Action with Proof Upload */}
          {workOrder.status === 'IN_PROGRESS' && onCompleteJob && (
            !showNotes ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setShowNotes(true)}
                disabled={isActing}
                style={{ fontSize: '0.78rem', background: 'var(--status-success-text)' }}
              >
                <CheckCircle2 size={12} /> Complete Job (Upload Proof)
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', width: '100%', marginTop: '0.5rem', background: 'var(--bg-surface)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  Submit Repair Proof & Restoration Notes
                </label>

                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Replaced faulty HDMI controller, tested 4K projection"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  style={{ fontSize: '0.82rem', height: '34px' }}
                />

                <MediaUploadZone
                  mediaUrls={resolutionMedia}
                  onChange={setResolutionMedia}
                  label="Attach Post-Fix Photo / Video Proof (Mandatory for verification)"
                  helperText="Upload photo of repaired projector, restored breaker, or fixed equipment."
                />

                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowNotes(false)}
                    style={{ fontSize: '0.78rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      onCompleteJob(workOrder.id, notes, resolutionMedia);
                      setShowNotes(false);
                    }}
                    disabled={isActing}
                    style={{ fontSize: '0.78rem', background: 'var(--status-success-text)' }}
                  >
                    Confirm Completion & Send to Verification
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
};

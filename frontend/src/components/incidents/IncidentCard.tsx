import React from 'react';
import { motion } from 'framer-motion';
import { Incident } from '../../types';
import { MapPin, Clock, ArrowRight, UserCheck, ShieldAlert, CheckCircle2, XCircle, Volume2 } from 'lucide-react';

interface IncidentCardProps {
  incident: Incident;
  onClick: () => void;
  showVerificationActions?: boolean;
  onVerify?: (workOrderId: number, outcome: 'pass' | 'fail') => void;
  isVerifying?: boolean;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({
  incident,
  onClick,
  showVerificationActions = false,
  onVerify,
  isVerifying = false
}) => {
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

  const isPendingVerification = incident.status === 'AWAITING_VERIFICATION' || 
    (incident.work_order?.status === 'COMPLETED' && !['RESOLVED', 'CLOSED'].includes(incident.status));

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className="card card-interactive"
      style={{
        padding: '1rem 1.15rem',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem'
      }}
    >
      {/* Top Meta Header: ID, Badges */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-primary-dark)' }}>
            #{incident.id}
          </span>
          <span className={`badge ${statusBadgeClass[incident.status] || 'badge-neutral'}`}>
            {incident.status.replace('_', ' ')}
          </span>
          <span className={`badge ${priorityBadgeClass[incident.priority] || 'badge-neutral'}`}>
            {incident.priority}
          </span>
          {incident.replan_count > 0 && (
            <span className="badge badge-replan">
              Replan #{incident.replan_count}
            </span>
          )}
        </div>

        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Clock size={12} />
          {new Date(incident.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Description */}
      <div style={{ 
        fontSize: '0.9rem', 
        fontWeight: 600, 
        color: 'var(--text-main)', 
        lineHeight: 1.45,
        wordBreak: 'break-word'
      }}>
        {incident.description}
      </div>

      {/* Autonomous Space Allocation / Assigned Venue Card */}
      {(incident.category === 'SPACE_ALLOCATION' || incident.space_allocation_decision?.reallocated || incident.understanding?.resolution_type === 'SPACE_REALLOCATION') && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.45rem',
          padding: '0.5rem 0.75rem',
          background: 'linear-gradient(135deg, rgba(227, 83, 54, 0.08) 0%, rgba(245, 245, 220, 0.4) 100%)',
          border: '1px solid var(--color-primary-soft)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.8rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem', fontWeight: 800 }}>
              🤖 AI ASSIGNED VENUE
            </span>
            <span style={{ color: 'var(--color-primary-dark)', fontWeight: 700 }}>
              {incident.space_allocation_decision?.allocated_room || incident.understanding?.reallocated_room_code || 'Vacant Classroom'}
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Autonomously resolved without technician
          </span>
        </div>
      )}

      {/* Reported Audio Voice Note Player */}
      {incident.media_urls && incident.media_urls.some(u => u.startsWith('data:audio') || u.endsWith('.mp3') || u.endsWith('.wav') || u.endsWith('.ogg') || u.endsWith('.m4a') || u.endsWith('.webm')) && (
        <div 
          onClick={e => e.stopPropagation()} 
          style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.65rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
        >
          <Volume2 size={14} color="var(--color-primary)" />
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>Voice Note:</span>
          {incident.media_urls.filter(u => u.startsWith('data:audio') || u.endsWith('.mp3') || u.endsWith('.wav') || u.endsWith('.ogg') || u.endsWith('.m4a') || u.endsWith('.webm')).map((url, idx) => (
            <audio key={idx} controls src={url} style={{ height: '28px', flex: 1, minWidth: '180px' }} />
          ))}
        </div>
      )}

      {/* Footer Info: Room, Reporter, Action */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '0.5rem',
        paddingTop: '0.35rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.78rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
            <MapPin size={12} color="var(--color-primary)" />
            Space: {incident.room_code || 'General Campus'}
          </span>
          <span>·</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <UserCheck size={12} color="var(--color-primary-dark)" />
            Reported by: <strong style={{ color: 'var(--text-main)' }}>{incident.reporter}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {showVerificationActions && isPendingVerification && incident.work_order && onVerify && (
            <div 
              style={{ display: 'flex', gap: '0.35rem' }} 
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                className="btn btn-sm"
                style={{ 
                  background: 'var(--status-success-bg)', 
                  color: 'var(--status-success-text)', 
                  border: '1px solid var(--status-success-border)',
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
                disabled={isVerifying}
                onClick={() => onVerify(incident.work_order!.id, 'pass')}
              >
                <CheckCircle2 size={12} /> Pass Sign-Off
              </button>
              <button
                type="button"
                className="btn btn-sm"
                style={{ 
                  background: 'var(--status-error-bg)', 
                  color: 'var(--status-error-text)', 
                  border: '1px solid var(--status-error-border)',
                  padding: '0.2rem 0.55rem',
                  fontSize: '0.75rem',
                  fontWeight: 600
                }}
                disabled={isVerifying}
                onClick={() => onVerify(incident.work_order!.id, 'fail')}
              >
                <XCircle size={12} /> Reject
              </button>
            </div>
          )}

          <span style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.25rem', 
            color: 'var(--color-primary)', 
            fontWeight: 600,
            fontSize: '0.8rem'
          }}>
            View Details <ArrowRight size={13} />
          </span>
        </div>
      </div>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { Incident, User } from '../types';
import { AgentExecutionTracker } from './AgentExecutionTracker';
import { 
  X, 
  MapPin, 
  User as UserIcon, 
  Clock, 
  CheckCircle2, 
  Wrench, 
  AlertTriangle,
  Play,
  RotateCcw,
  Brain,
  Calendar,
  Flame,
  Users,
  ShieldCheck,
  RefreshCw,
  Layers
} from 'lucide-react';
import { api } from '../api';

interface IncidentDetailModalProps {
  incident: Incident;
  currentUser: User;
  onClose: () => void;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const IncidentDetailModal: React.FC<IncidentDetailModalProps> = ({
  incident,
  currentUser,
  onClose,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);

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

  async function handleWorkAction(action: string, outcome?: string) {
    if (!incident.work_order?.id) return;
    setLoading(true);
    try {
      await api.workOrderAction(incident.work_order.id, action, { outcome });
      onSuccess(`Work order updated: ${action}`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleIncidentAction(action: string, notes?: string) {
    setLoading(true);
    try {
      await api.incidentAction(incident.id, action, notes);
      onSuccess(`Incident updated: ${action}`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  const allWorkOrders = incident.work_orders || (incident.work_order ? [incident.work_order] : []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '860px', maxHeight: '90vh', overflowY: 'auto' }}
      >
        
        {/* Modal Header */}
        <div className="modal-header" style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Incident #{incident.id}
              </span>
              <span className={`badge ${statusBadgeClass[incident.status] || 'badge-neutral'}`}>
                {incident.status}
              </span>
              <span className={`badge ${priorityBadgeClass[incident.priority] || 'badge-neutral'}`}>
                {incident.priority}
              </span>
              {incident.replan_count > 0 && (
                <span className="badge badge-replan">
                  <RefreshCw size={11} /> Replan #{incident.replan_count}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <UserIcon size={12} /> {incident.reporter}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={12} /> {incident.room_code || 'Unspecified Space'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={12} /> {new Date(incident.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          <button 
            type="button" 
            className="btn btn-ghost btn-sm" 
            onClick={onClose}
            style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Incident Description */}
          <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem', letterSpacing: '0.04em' }}>
              Reported Natural Language Issue
            </span>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-main)', margin: 0, fontWeight: 500 }}>
              "{incident.description}"
            </p>
          </div>

          {/* Structured Operational Signals (Storytelling Cards) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            
            {/* AI Extraction Signal */}
            <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                <Brain size={14} color="var(--color-primary)" />
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                  AI Understanding
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-body)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div><b>Category:</b> {incident.category}</div>
                <div><b>Target Space:</b> {incident.room_code || 'Extracted from text'}</div>
                <div><b>Urgency:</b> {incident.priority}</div>
              </div>
            </div>

            {/* Campus Timetable & Priority */}
            <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                <Flame size={14} color="var(--color-primary-dark)" />
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                  Operational Priority
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-body)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div><b>Level:</b> <span className={`badge ${priorityBadgeClass[incident.priority] || 'badge-neutral'}`} style={{ fontSize: '0.68rem', padding: '0.1rem 0.35rem' }}>{incident.priority}</span></div>
                <div><b>Evidence:</b> {incident.priority === 'HIGH' ? 'Active Lecture in Session (R24 Schedule)' : 'Standard Routine Priority'}</div>
                <div><b>State:</b> {incident.status}</div>
              </div>
            </div>

            {/* Specialist Allocation */}
            <div className="card" style={{ padding: '0.85rem', background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                <Users size={14} color="var(--color-accent)" />
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase' }}>
                  Resource Assignment
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-body)', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <div><b>Assigned:</b> {incident.work_order?.technician || 'Specialist Allocated'}</div>
                <div><b>Cycle:</b> {incident.replan_count > 0 ? `Replacement Specialist (Replan #${incident.replan_count})` : 'Primary Dispatch'}</div>
                <div><b>Status:</b> {incident.work_order?.status || 'Scheduled'}</div>
              </div>
            </div>

          </div>

          {/* Autonomous Multi-Agent Real-time Execution Tracker */}
          <AgentExecutionTracker incident={incident} />

          {/* Work Orders Execution History (Showing replanned/replacement work orders) */}
          {allWorkOrders.length > 0 && (
            <div className="card" style={{ padding: '1rem', background: '#FFFFFF' }}>
              <div className="card-header" style={{ marginBottom: '0.75rem' }}>
                <span className="card-title" style={{ fontSize: '0.88rem' }}>
                  <Wrench size={15} color="var(--color-primary)" />
                  Work Order Execution Lifecycle ({allWorkOrders.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {allWorkOrders.map((wo, idx) => {
                  const isCancelled = wo.status === 'CANCELLED' || wo.status === 'REJECTED';
                  const isCompleted = wo.status === 'COMPLETED';

                  return (
                    <div 
                      key={wo.id || idx}
                      style={{
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: isCancelled ? 'var(--status-replan-border)' : isCompleted ? 'var(--status-success-border)' : 'var(--border-default)',
                        background: isCancelled ? 'var(--status-replan-bg)' : isCompleted ? 'var(--status-success-bg)' : 'var(--bg-surface)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.35rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-main)' }}>
                            Work Order #{wo.id}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            · Specialist: <b>{wo.technician || `Technician ID #${wo.technician_id || 'N/A'}`}</b>
                          </span>
                        </div>
                        <span className={`badge ${isCompleted ? 'badge-success' : isCancelled ? 'badge-replan' : 'badge-info'}`} style={{ fontSize: '0.68rem' }}>
                          {wo.status}
                        </span>
                      </div>

                      {wo.notes && (
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-body)', fontStyle: 'italic' }}>
                          Note: "{wo.notes}"
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        {wo.scheduled_for && <span>Scheduled: {new Date(wo.scheduled_for).toLocaleTimeString()}</span>}
                        {wo.started_at && <span>Started: {new Date(wo.started_at).toLocaleTimeString()}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Specialist Execution Controls (Available for Technician or Admin) */}
              {(currentUser.role === 'TECHNICIAN' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && incident.work_order && (
                <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {incident.work_order.status === 'ASSIGNED' && (
                    <button 
                      className="btn btn-primary btn-sm" 
                      onClick={() => handleWorkAction('START_WORK')}
                      disabled={loading}
                    >
                      <Play size={13} /> Start Work
                    </button>
                  )}
                  {incident.work_order.status === 'IN_PROGRESS' && (
                    <button 
                      className="btn btn-success btn-sm" 
                      onClick={() => handleWorkAction('COMPLETE_WORK', 'RESOLVED')}
                      disabled={loading}
                    >
                      <CheckCircle2 size={13} /> Complete & Trigger Verification
                    </button>
                  )}
                  {['ASSIGNED', 'IN_PROGRESS'].includes(incident.work_order.status) && (
                    <button 
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleWorkAction('DECLINE')}
                      disabled={loading}
                    >
                      <RotateCcw size={13} /> Decline (Trigger Autonomous Replan)
                    </button>
                  )}
                </div>
              )}

              {/* Verification Audit Controls (Available when incident is Awaiting Verification) */}
              {incident.status === 'AWAITING_VERIFICATION' && incident.work_order && (
                <div style={{ 
                  marginTop: '1rem', 
                  padding: '0.85rem', 
                  background: 'var(--status-warning-bg)', 
                  border: '1px solid var(--status-warning-border)', 
                  borderRadius: 'var(--radius-xs)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.82rem', color: 'var(--status-warning-text)' }}>
                    <ShieldCheck size={16} />
                    <span>Operational Verification Audit Required</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-body)' }}>
                    The specialist has logged physical work completion. Perform verification sign-off or report failure to trigger autonomous recovery.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button 
                      type="button"
                      className="btn btn-success btn-sm" 
                      onClick={() => handleWorkAction('verify', 'pass')}
                      disabled={loading}
                    >
                      <CheckCircle2 size={13} /> ✓ Verify Operational (PASS)
                    </button>
                    <button 
                      type="button"
                      className="btn btn-danger btn-sm" 
                      onClick={() => handleWorkAction('verify', 'fail')}
                      disabled={loading}
                    >
                      <AlertTriangle size={13} /> ✕ Verification Failed (Trigger Replan)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ position: 'sticky', bottom: 0, zIndex: 10, background: '#FFFFFF' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onClose}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

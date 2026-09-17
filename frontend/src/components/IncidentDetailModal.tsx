import React, { useState, useEffect } from 'react';
import { Incident, User } from '../types';
import { AgentExecutionTracker } from './AgentExecutionTracker';
import { 
  X, 
  MapPin, 
  User as UserIcon, 
  Clock, 
  CheckCircle, 
  Wrench, 
  AlertTriangle,
  Play,
  RotateCcw,
  Calendar,
  Layers,
  ShieldCheck,
  ClipboardList,
  ArrowRight
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
  const [activeTab, setActiveTab] = useState<'overview' | 'work_order' | 'agent_activity' | 'verification'>('overview');
  const [loading, setLoading] = useState(false);
  const [workNotes, setWorkNotes] = useState('');

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  // RBAC permission checks based strictly on backend authority
  const isTechnician = currentUser.role === 'TECHNICIAN';
  const isFaculty = currentUser.role === 'FACULTY';
  const isAdmin = ['ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
  const isAssignedTech = isTechnician && incident.work_order && (
    incident.work_order.technician_id === currentUser.id ||
    (incident.work_order.technician && incident.work_order.technician.toLowerCase().includes(currentUser.full_name.toLowerCase()))
  );

  const canExecuteWork = (isAssignedTech || isAdmin) && incident.work_order && ['ASSIGNED', 'SCHEDULED', 'IN_PROGRESS'].includes(incident.work_order.status);
  const canVerify = (isFaculty || isAdmin || currentUser.role === 'STUDENT') && ['AWAITING_VERIFICATION', 'REOPENED'].includes(incident.status);

  async function handleWorkAction(action: string, outcome?: string) {
    if (!incident.work_order?.id) return;
    setLoading(true);
    try {
      await api.workOrderAction(incident.work_order.id, action, { outcome, notes: workNotes || undefined });
      onSuccess(`Work order updated: ${action}`);
      setWorkNotes('');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerification(outcome: 'pass' | 'fail') {
    if (!incident.work_order?.id) return;
    setLoading(true);
    try {
      await api.workOrderAction(incident.work_order.id, 'verify', {
        outcome,
        notes: outcome === 'pass' ? 'Verified operational function restored.' : 'Verification rejected: Issue persists.'
      });
      if (outcome === 'pass') {
        onSuccess('Resolution verified. Incident closed.');
      } else {
        onError('Verification rejected. Autonomous replanning triggered.');
      }
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Verification action failed');
    } finally {
      setLoading(false);
    }
  }

  const workOrder = incident.work_order;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '820px' }}
      >
        
        {/* Modal Sticky Header */}
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-main)' }}>
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
                  Replan #{incident.replan_count}
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <MapPin size={12} /> {incident.room_code || 'General Campus Space'}
              </span>
              <span>·</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Clock size={12} /> {new Date(incident.created_at).toLocaleString()}
              </span>
            </div>
          </div>

          <button 
            type="button" 
            className="btn-ghost btn-sm" 
            onClick={onClose}
            aria-label="Close Modal"
            style={{ padding: '0.35rem', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Command Tabs */}
        <div style={{ background: 'var(--bg-surface)', padding: '0.4rem 1.4rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="tab-bar" style={{ borderBottom: 'none', paddingBottom: 0 }}>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <ClipboardList size={13} /> Overview
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'work_order' ? 'active' : ''}`}
              onClick={() => setActiveTab('work_order')}
            >
              <Wrench size={13} /> Work Order {workOrder ? `(#${workOrder.id})` : ''}
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'agent_activity' ? 'active' : ''}`}
              onClick={() => setActiveTab('agent_activity')}
            >
              <Layers size={13} /> Agent Activity
            </button>
            <button
              type="button"
              className={`tab-btn ${activeTab === 'verification' ? 'active' : ''}`}
              onClick={() => setActiveTab('verification')}
            >
              <ShieldCheck size={13} /> Verification
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="modal-body">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Problem Description */}
              <div style={{ background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <span className="stat-label">Reported Issue</span>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', marginTop: '0.25rem', fontWeight: 500 }}>
                  "{incident.description}"
                </p>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Reported by: <b>{incident.reporter}</b>
                </div>
              </div>

              {/* AI Understanding & Context Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                <div className="stat-box">
                  <div className="stat-label">Problem Category</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {incident.understanding?.category || incident.category || 'General Maintenance'}
                  </div>
                  <div className="stat-desc">Identified by Understanding Agent</div>
                </div>
                  <div className="stat-box">
                  <div className="stat-label">Urgency & Impact</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {incident.priority} Priority
                  </div>
                  <div className="stat-desc">{incident.understanding?.urgency_signal || 'Operational Timetable Impact'}</div>
                </div>
              </div>

              {/* Current Assigned Status */}
              <div style={{ background: '#FFFFFF', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Execution State</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)', marginTop: '0.15rem' }}>
                    {workOrder ? `Work Order #${workOrder.id} (${workOrder.status}) assigned to ${workOrder.technician || 'Specialist'}` : 'Agents coordinating dispatch'}
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm"
                  onClick={() => setActiveTab('agent_activity')}
                >
                  View Agent Tracker <ArrowRight size={12} />
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: WORK ORDER */}
          {activeTab === 'work_order' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {!workOrder ? (
                <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                  <div className="empty-state-icon"><Wrench size={22} /></div>
                  <div className="empty-state-title">No work order generated yet</div>
                  <div className="empty-state-text">Resource and Scheduling agents are currently allocating a specialist.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
                    <div className="stat-box">
                      <div className="stat-label">Assigned Specialist</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{workOrder.technician || 'Field Specialist'}</div>
                      <div className="stat-desc">Status: {workOrder.status}</div>
                    </div>

                    <div className="stat-box">
                      <div className="stat-label">Scheduled Window</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {workOrder.scheduled_for ? new Date(workOrder.scheduled_for).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Immediate Dispatch'}
                      </div>
                      <div className="stat-desc">Work Order #{workOrder.id}</div>
                    </div>
                  </div>

                  {/* Technician Execution Controls */}
                  {canExecuteWork && (
                    <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                      <span className="stat-label">Technician Actions</span>
                      
                      {workOrder.status !== 'IN_PROGRESS' && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                          <button 
                            type="button" 
                            className="btn btn-primary btn-sm"
                            disabled={loading}
                            onClick={() => handleWorkAction('start')}
                          >
                            <Play size={13} /> Start Job
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm"
                            disabled={loading}
                            onClick={() => handleWorkAction('reject')}
                          >
                            <RotateCcw size={13} /> Decline Assignment
                          </button>
                        </div>
                      )}

                      {workOrder.status === 'IN_PROGRESS' && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <label className="form-label" htmlFor="wo-notes">Restoration & Repair Notes</label>
                          <input 
                            id="wo-notes"
                            type="text" 
                            className="form-input" 
                            value={workNotes}
                            onChange={e => setWorkNotes(e.target.value)}
                            placeholder="e.g. Replaced faulty HDMI controller and tested output."
                            style={{ marginBottom: '0.5rem' }}
                          />
                          <button 
                            type="button" 
                            className="btn btn-success btn-sm"
                            disabled={loading}
                            onClick={() => handleWorkAction('complete')}
                          >
                            <CheckCircle size={13} /> Complete & Request Verification
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AGENT ACTIVITY */}
          {activeTab === 'agent_activity' && (
            <div>
              <AgentExecutionTracker incident={incident} />
            </div>
          )}

          {/* TAB 4: VERIFICATION */}
          {activeTab === 'verification' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ 
                padding: '1rem', 
                borderRadius: 'var(--radius-sm)', 
                background: incident.status === 'RESOLVED' ? 'var(--status-success-bg)' : incident.status === 'AWAITING_VERIFICATION' ? 'var(--status-warning-bg)' : 'var(--bg-surface)',
                border: '1px solid',
                borderColor: incident.status === 'RESOLVED' ? 'var(--status-success-border)' : incident.status === 'AWAITING_VERIFICATION' ? 'var(--status-warning-border)' : 'var(--border-subtle)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, fontSize: '0.92rem' }}>
                  <ShieldCheck size={16} />
                  <span>Verification Status: {incident.status}</span>
                </div>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-body)', marginTop: '0.35rem' }}>
                  {incident.status === 'RESOLVED' 
                    ? 'Work has been independently verified and the classroom/space is confirmed operational.' 
                    : incident.status === 'AWAITING_VERIFICATION'
                    ? 'Specialist has completed repairs. Independent verification or faculty confirmation required to close.'
                    : 'Verification occurs automatically after specialist execution.'}
                </p>
              </div>

              {canVerify && (
                <div style={{ padding: '1rem', background: '#FFFFFF', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <span className="stat-label">Resolution Audit Sign-Off</span>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    Confirm whether the issue in <b>{incident.room_code || 'Space'}</b> is fully resolved.
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button 
                      type="button" 
                      className="btn btn-success btn-sm"
                      disabled={loading}
                      onClick={() => handleVerification('pass')}
                    >
                      <CheckCircle size={13} /> Verify Operational (PASS)
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm"
                      disabled={loading}
                      onClick={() => handleVerification('fail')}
                    >
                      <AlertTriangle size={13} /> Verification Failed (Trigger Replan)
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Sticky Footer */}
        <div className="modal-footer">
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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, Technician, User } from '../types';
import { api } from '../api';
import { AgentExecutionTracker } from './AgentExecutionTracker';
import { 
  Wrench, 
  Play, 
  CheckCircle2, 
  RotateCcw, 
  MapPin, 
  Radio, 
  Inbox
} from 'lucide-react';

interface TechnicianPortalProps {
  currentUser: User;
  incidents: Incident[];
  technicians: Technician[];
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

export const TechnicianPortal: React.FC<TechnicianPortalProps> = ({
  currentUser,
  incidents,
  technicians,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [actingWorkId, setActingWorkId] = useState<number | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState<number | null>(null);

  const activeTech = technicians.find(t => 
    t.name.toLowerCase() === currentUser.full_name.toLowerCase() ||
    currentUser.full_name.toLowerCase().includes(t.name.toLowerCase())
  ) || technicians[0];

  const myWorkOrders = incidents.filter(i => {
    if (!i.work_order) return false;
    if (activeTech && i.work_order.technician_id === activeTech.id) return true;
    if (i.work_order.technician && i.work_order.technician.toLowerCase().includes(currentUser.full_name.toLowerCase())) return true;
    return false;
  });

  async function handleStartWork(workId: number) {
    setActingWorkId(workId);
    try {
      await api.workOrderAction(workId, 'start', { technician_id: activeTech?.id });
      onSuccess(`Work order #${workId} marked in-progress!`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to start job');
    } finally {
      setActingWorkId(null);
    }
  }

  async function handleCompleteWork(workId: number) {
    setActingWorkId(workId);
    try {
      await api.workOrderAction(workId, 'complete', {
        notes: completionNotes || 'Diagnostics completed and operational function restored.',
        technician_id: activeTech?.id
      });
      onSuccess(`Work order #${workId} completed and awaiting verification!`);
      setShowCompleteModal(null);
      setCompletionNotes('');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to complete job');
    } finally {
      setActingWorkId(null);
    }
  }

  async function handleRejectWork(workId: number) {
    setActingWorkId(workId);
    try {
      await api.workOrderAction(workId, 'reject', {
        notes: 'Technician declined assignment. Autonomous replanning triggered.',
        technician_id: activeTech?.id
      });
      onError(`Work order #${workId} declined. Autonomous replanning triggered.`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to reject job');
    } finally {
      setActingWorkId(null);
    }
  }

  async function toggleTechStatus() {
    if (!activeTech) return;
    const newStatus = activeTech.status === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
    try {
      await api.setTechnicianStatus(activeTech.id, newStatus);
      onSuccess(`Status updated to ${newStatus}`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to update status');
    }
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      
      {/* Technician Status Header */}
      <motion.div 
        variants={itemVariants}
        className="card card-interactive" 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ 
            width: 38, height: 38, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)' 
          }}>
            <Wrench size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentUser.full_name}
              </span>
              <span className={`badge ${activeTech?.status === 'AVAILABLE' ? 'badge-success' : 'badge-warning'}`}>
                {activeTech?.status || 'AVAILABLE'}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Specialty: <b>{currentUser.specialty || activeTech?.specialty || 'AV_ELECTRICAL'}</b> · {currentUser.department || 'Facilities Maintenance'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button" 
            className={`btn btn-sm ${activeTech?.status === 'AVAILABLE' ? 'btn-secondary' : 'btn-success'}`}
            onClick={toggleTechStatus}
          >
            <Radio size={13} /> {activeTech?.status === 'AVAILABLE' ? 'Set Status: Busy' : 'Set Status: Available'}
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onRefresh}
          >
            <RotateCcw size={13} /> Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Assigned Tasks Feed */}
      <motion.div variants={itemVariants} className="card card-interactive">
        <div className="card-header">
          <span className="card-title">
            Assigned Work Orders ({myWorkOrders.length})
          </span>
          <span className="badge badge-role">Specialist Queue</span>
        </div>

        {myWorkOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: '2.5rem 1rem', border: 'none' }}>
            <div className="empty-state-icon">
              <Inbox size={24} />
            </div>
            <div className="empty-state-title">No work orders assigned</div>
            <div className="empty-state-text">
              When classroom maintenance issues match your specialty and availability, work orders will appear here automatically.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimatePresence>
              {myWorkOrders.map(inc => {
                const wo = inc.work_order;
                if (!wo) return null;
                const isStarted = wo.status === 'IN_PROGRESS';

                return (
                  <motion.div 
                    key={inc.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    style={{
                      background: isStarted ? 'var(--color-primary-subtle)' : 'var(--bg-surface)',
                      border: '1px solid',
                      borderColor: isStarted ? 'var(--color-primary)' : 'var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                            Work Order #{wo.id} (Incident #{inc.id})
                          </span>
                          <span className="badge badge-neutral">{inc.priority}</span>
                          <span className={`badge ${wo.status === 'COMPLETED' ? 'badge-success' : 'badge-info'}`}>{wo.status}</span>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--color-primary-dark)', fontSize: '0.85rem', fontWeight: 600 }}>
                          <MapPin size={13} /> {inc.room_code || 'General Space'}
                        </div>
                        
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-body)', margin: '0.25rem 0 0' }}>
                          {inc.description}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem' }}>
                        {wo.status !== 'IN_PROGRESS' && wo.status !== 'COMPLETED' && (
                          <>
                            <motion.button 
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={actingWorkId === wo.id}
                              onClick={() => handleStartWork(wo.id)}
                            >
                              <Play size={13} /> Start Job
                            </motion.button>
                            <motion.button 
                              whileHover={{ scale: 1.04 }}
                              whileTap={{ scale: 0.96 }}
                              type="button"
                              className="btn btn-danger btn-sm"
                              disabled={actingWorkId === wo.id}
                              onClick={() => handleRejectWork(wo.id)}
                              title="Decline assignment and trigger autonomous replan"
                            >
                              <RotateCcw size={13} /> Decline
                            </motion.button>
                          </>
                        )}

                        {wo.status === 'IN_PROGRESS' && (
                          <motion.button 
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            type="button"
                            className="btn btn-success btn-sm"
                            disabled={actingWorkId === wo.id}
                            onClick={() => setShowCompleteModal(wo.id)}
                          >
                            <CheckCircle2 size={13} /> Complete & Restore
                          </motion.button>
                        )}
                      </div>
                    </div>

                    {showCompleteModal === wo.id && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ marginBottom: '0.75rem', padding: '0.75rem', background: '#FFFFFF', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}
                      >
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Repair & Restoration Notes</label>
                        <input
                          type="text"
                          className="form-input"
                          value={completionNotes}
                          onChange={e => setCompletionNotes(e.target.value)}
                          placeholder="e.g. Replaced projector lamp, verified HDMI signal"
                          style={{ marginBottom: '0.5rem', fontSize: '0.82rem' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.35rem' }}>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCompleteModal(null)}>Cancel</button>
                          <button type="button" className="btn btn-success btn-sm" onClick={() => handleCompleteWork(wo.id)}>Submit & Complete</button>
                        </div>
                      </motion.div>
                    )}

                    <AgentExecutionTracker incident={inc} compact={true} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

    </motion.div>
  );
};

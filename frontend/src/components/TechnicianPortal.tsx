import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Incident, Technician, User, WorkOrderItem } from '../types';
import { api } from '../api';
import { WorkOrderList } from './workorders/WorkOrderList';
import { 
  Wrench, 
  Radio, 
  RotateCcw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  Activity
} from 'lucide-react';

interface TechnicianPortalProps {
  currentUser: User;
  incidents: Incident[];
  technicians: Technician[];
  activeTab?: 'overview' | 'work_orders';
  onNavigateTab?: (tab: string) => void;
  onSelectIncident?: (incident: Incident) => void;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const TechnicianPortal: React.FC<TechnicianPortalProps> = ({
  currentUser,
  incidents,
  technicians,
  activeTab = 'overview',
  onNavigateTab,
  onSelectIncident,
  onRefresh,
  onError,
  onSuccess
}) => {
  const userCleanName = currentUser.full_name.toLowerCase().replace(/\s*\(technician\)\s*/i, '').trim();

  // Find matching technician profile
  const activeTech = technicians.find(t => 
    (t as any).user_id === currentUser.id ||
    t.name.toLowerCase().includes(userCleanName) ||
    userCleanName.includes(t.name.toLowerCase()) ||
    (t as any).email?.toLowerCase() === currentUser.email.toLowerCase()
  ) || technicians[0];

  const activeTechId = activeTech?.id;

  // Extract work orders for this technician
  const myWorkOrders: { workOrder: WorkOrderItem; incident: Incident }[] = [];
  incidents.forEach(inc => {
    const orders = (inc.work_orders && inc.work_orders.length > 0) 
      ? inc.work_orders 
      : (inc.work_order ? [inc.work_order] : []);

    orders.forEach(wo => {
      const woTechName = (wo.technician || '').toLowerCase().trim();
      const isMatch = 
        (activeTechId && wo.technician_id === activeTechId) ||
        (wo.technician_id === currentUser.id) ||
        (woTechName && userCleanName && (
          woTechName.includes(userCleanName) ||
          userCleanName.includes(woTechName)
        )) ||
        // If logged in as technician, show all dispatched work orders
        (currentUser.role === 'TECHNICIAN');

      if (isMatch) {
        myWorkOrders.push({ workOrder: wo, incident: inc });
      }
    });
  });

  const activeJobs = myWorkOrders.filter(o => ['ASSIGNED', 'SCHEDULED', 'IN_PROGRESS'].includes(o.workOrder.status));
  const inProgressJobs = myWorkOrders.filter(o => o.workOrder.status === 'IN_PROGRESS');
  const completedJobs = myWorkOrders.filter(o => o.workOrder.status === 'COMPLETED');
  const urgentJobs = activeJobs.filter(o => ['EMERGENCY', 'HIGH'].includes(o.incident.priority));

  async function handleStartWork(workId: number) {
    setActingWorkId(workId);
    try {
      await api.workOrderAction(workId, 'start', { technician_id: activeTech?.id });
      onSuccess(`Work order #${workId} marked in-progress.`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to start job');
    } finally {
      setActingWorkId(null);
    }
  }

  async function handleCompleteWork(workId: number, notes?: string, resolutionMedia?: string[]) {
    setActingWorkId(workId);
    try {
      await api.workOrderAction(workId, 'complete', {
        notes: notes || 'Diagnostics completed and operational function restored.',
        technician_id: activeTech?.id,
        resolution_media: resolutionMedia || []
      });
      onSuccess(`Work order #${workId} completed with resolution evidence. Transitioned to Awaiting Verification.`);
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

  async function setShiftStatus(newStatus: string) {
    if (!activeTech) return;
    try {
      await api.setTechnicianStatus(activeTech.id, newStatus);
      onSuccess(`Shift availability updated to ${newStatus}`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to update status');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Technician Status Header & Shift Control */}
      <div 
        className="card" 
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem', borderLeft: '4px solid var(--primary-dark)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ 
            width: 44, height: 44, borderRadius: 'var(--radius-sm)', background: 'var(--color-primary-subtle)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-dark)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Wrench size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                {activeTech ? activeTech.name : currentUser.full_name}
              </span>
              <span className={`badge ${activeTech?.status === 'AVAILABLE' ? 'badge-success' : activeTech?.status === 'WORKING' ? 'badge-info' : 'badge-warning'}`}>
                {activeTech?.status || 'AVAILABLE'}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Assigned Field Specialty: <strong>{activeTech?.specialty || currentUser.specialty || 'General Hardware & AV'}</strong>
            </div>
          </div>
        </div>

        {/* Shift Availability Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-muted)' }}>Set Shift:</span>
          {['AVAILABLE', 'WORKING', 'BUSY', 'OFF_DUTY'].map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setShiftStatus(st)}
              style={{
                fontSize: '0.72rem',
                padding: '0.25rem 0.6rem',
                borderRadius: 'var(--radius-sm)',
                border: activeTech?.status === st ? '1px solid var(--primary-dark)' : '1px solid var(--border-subtle)',
                background: activeTech?.status === st ? 'var(--color-primary-subtle)' : '#FFFFFF',
                color: activeTech?.status === st ? 'var(--primary-dark)' : 'var(--text-muted)',
                fontWeight: activeTech?.status === st ? 700 : 500,
                cursor: 'pointer'
              }}
            >
              {st}
            </button>
          ))}

          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.4rem' }}
          >
            <RotateCcw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* OVERVIEW VIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Operational Metrics Grid */}
          <div className="stats-grid">
            <div className="stat-box">
              <div className="stat-label">Active Work Orders</div>
              <div className="stat-value">{activeJobs.length}</div>
              <div className="stat-desc">{inProgressJobs.length} currently in-progress</div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Urgent Priority</div>
              <div className="stat-value" style={{ color: urgentJobs.length > 0 ? 'var(--status-danger)' : 'inherit' }}>
                {urgentJobs.length}
              </div>
              <div className="stat-desc">Emergency / Timetable impact</div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Completed Jobs</div>
              <div className="stat-value" style={{ color: 'var(--status-success)' }}>
                {completedJobs.length}
              </div>
              <div className="stat-desc">Submitted for faculty audit</div>
            </div>

            <div className="stat-box">
              <div className="stat-label">Campus Incidents</div>
              <div className="stat-value">{incidents.length}</div>
              <div className="stat-desc">Total reported campus stream</div>
            </div>
          </div>

          {/* Quick Active Work Order Showcase */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title" style={{ fontFamily: 'var(--font-heading)' }}>
                  <Activity size={18} color="var(--primary-dark)" />
                  My Immediate Priority Queue
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  Work orders currently assigned to you by AUOrbit autonomous dispatch engine.
                </p>
              </div>

              {onNavigateTab && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigateTab('work_orders')}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  Open Full Work Queue <ArrowRight size={13} />
                </button>
              )}
            </div>

            {activeJobs.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                <CheckCircle2 size={28} color="var(--status-success)" style={{ margin: '0 auto 0.5rem' }} />
                <div>All assigned work orders completed. Standby for autonomous dispatch.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {activeJobs.slice(0, 3).map(({ workOrder, incident }) => (
                  <div 
                    key={workOrder.id}
                    className="card card-interactive"
                    onClick={() => onSelectIncident && onSelectIncident(incident)}
                    style={{ padding: '0.9rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          Work Order #{workOrder.id}
                        </span>
                        <span className={`badge ${workOrder.status === 'IN_PROGRESS' ? 'badge-info' : 'badge-warning'}`}>
                          {workOrder.status}
                        </span>
                        <span className="badge badge-neutral">
                          {incident.room_code || 'General Space'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-body)' }}>
                        "{incident.description.slice(0, 75)}..."
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                        Priority: {incident.priority}
                      </span>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectIncident) onSelectIncident(incident);
                        }}
                      >
                        Inspect & Actions
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* ASSIGNED WORK ORDERS VIEW */}
      {activeTab === 'work_orders' && (
        <WorkOrderList
          incidents={incidents}
          currentUser={currentUser}
          technicians={technicians}
          onSelectIncident={onSelectIncident}
          onStartJob={handleStartWork}
          onCompleteJob={handleCompleteWork}
          onRejectJob={handleRejectWork}
          isActing={actingWorkId !== null}
          filterTechnicianOnly={true}
          onRefresh={onRefresh}
          onError={onError}
          onSuccess={onSuccess}
          title="My Assigned Work Orders"
          subtitle="Focused execution queue for your maintenance tasks. Take notes, upload repair evidence, and request verification."
        />
      )}

    </div>
  );
};

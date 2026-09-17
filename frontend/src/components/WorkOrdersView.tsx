import React, { useState } from 'react';
import { Incident, User } from '../types';
import { api } from '../api';
import { Wrench, Play, CheckCircle2, RotateCcw, Clock, MapPin, Inbox } from 'lucide-react';

interface WorkOrdersViewProps {
  incidents: Incident[];
  currentUser: User;
  onSelectIncident: (incident: Incident) => void;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  incidents,
  currentUser,
  onSelectIncident,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Extract all work orders from incidents
  const allWorkOrders = incidents.flatMap(inc => {
    if (!inc.work_orders || inc.work_orders.length === 0) {
      if (inc.work_order) {
        return [{ ...inc.work_order, incident_id: inc.id, incident_desc: inc.description, room_code: inc.room_code, priority: inc.priority, incident_status: inc.status, raw_incident: inc }];
      }
      return [];
    }
    return inc.work_orders.map(wo => ({
      ...wo,
      incident_id: inc.id,
      incident_desc: inc.description,
      room_code: inc.room_code,
      priority: inc.priority,
      incident_status: inc.status,
      raw_incident: inc
    }));
  });

  const filtered = allWorkOrders.filter(wo => {
    if (filterStatus === 'ALL') return true;
    return wo.status === filterStatus;
  });

  async function handleAction(workId: number, action: string, outcome?: string) {
    setActionLoading(workId);
    try {
      await api.workOrderAction(workId, action, { outcome });
      onSuccess(`Work order #${workId} updated: ${action}`);
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  const statusBadgeClass: Record<string, string> = {
    COMPLETED: 'badge-success',
    IN_PROGRESS: 'badge-info',
    SCHEDULED: 'badge-info',
    ASSIGNED: 'badge-info',
    REJECTED: 'badge-danger',
    CANCELLED: 'badge-neutral',
    PENDING: 'badge-neutral'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem' }}>
            Work Orders & Dispatch
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Operational maintenance orders dispatched to qualified campus technicians.
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map(st => (
            <button
              key={st}
              type="button"
              className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(st)}
              style={{ fontSize: '0.75rem' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Work Orders Table */}
      <div className="table-container">
        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '3rem 1.5rem', border: 'none' }}>
            <div className="empty-state-icon">
              <Inbox size={24} />
            </div>
            <div className="empty-state-title">No work orders match this filter</div>
            <div className="empty-state-text">
              Dispatched work orders will appear here automatically when campus incidents are triaged.
            </div>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Incident</th>
                <th>Location</th>
                <th>Technician</th>
                <th>Status</th>
                <th>Scheduled Time</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(wo => (
                <tr key={`${wo.id}-${wo.incident_id}`}>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                    #{wo.id}
                  </td>
                  <td>
                    <a 
                      href="#view" 
                      onClick={(e) => { e.preventDefault(); onSelectIncident(wo.raw_incident); }}
                      style={{ fontWeight: 600, color: 'var(--color-primary)' }}
                    >
                      #{wo.incident_id}: {wo.incident_desc?.slice(0, 45)}...
                    </a>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}>
                      <MapPin size={12} color="var(--text-dim)" /> {wo.room_code || 'General Space'}
                    </span>
                  </td>
                  <td>
                    <b>{wo.technician || 'Pending Assignment'}</b>
                  </td>
                  <td>
                    <span className={`badge ${statusBadgeClass[wo.status] || 'badge-neutral'}`}>
                      {wo.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {wo.scheduled_for ? new Date(wo.scheduled_for).toLocaleTimeString() : 'Immediate Dispatch'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                      
                      {wo.status === 'ASSIGNED' && (currentUser.role === 'TECHNICIAN' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleAction(wo.id, 'START_WORK')}
                          disabled={actionLoading === wo.id}
                        >
                          <Play size={12} /> Start
                        </button>
                      )}

                      {wo.status === 'IN_PROGRESS' && (currentUser.role === 'TECHNICIAN' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          onClick={() => handleAction(wo.id, 'COMPLETE_WORK', 'RESOLVED')}
                          disabled={actionLoading === wo.id}
                        >
                          <CheckCircle2 size={12} /> Complete
                        </button>
                      )}

                      {['ASSIGNED', 'IN_PROGRESS'].includes(wo.status) && (currentUser.role === 'TECHNICIAN' || currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleAction(wo.id, 'DECLINE')}
                          disabled={actionLoading === wo.id}
                          title="Decline and trigger autonomous replan"
                        >
                          <RotateCcw size={12} /> Decline
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => onSelectIncident(wo.raw_incident)}
                      >
                        Inspect
                      </button>

                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};

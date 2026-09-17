import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, WorkOrderItem, User } from '../../types';
import { WorkOrderCard } from './WorkOrderCard';
import { Wrench, Inbox, Search } from 'lucide-react';

interface WorkOrderListProps {
  incidents: Incident[];
  currentUser: User;
  technicians?: import('../../types').Technician[];
  onRefresh?: () => void;
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
  onSelectIncident?: (incident: Incident) => void;
  onStartJob?: (workOrderId: number) => void;
  onCompleteJob?: (workOrderId: number, notes?: string, resolutionMedia?: string[]) => void;
  onRejectJob?: (workOrderId: number) => void;
  isActing?: boolean;
  filterTechnicianOnly?: boolean;
  title?: string;
  subtitle?: string;
}

export const WorkOrderList: React.FC<WorkOrderListProps> = ({
  incidents,
  currentUser,
  onSelectIncident,
  onStartJob,
  onCompleteJob,
  onRejectJob,
  isActing = false,
  filterTechnicianOnly = false,
  title = 'Assigned Work Orders',
  subtitle = 'Operational maintenance orders dispatched by AUOrbit autonomous multi-agent scheduler.'
}) => {
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all work orders linked with their parent incident
  const allOrdersWithIncidents: { workOrder: WorkOrderItem; incident: Incident }[] = [];
  incidents.forEach(inc => {
    if (inc.work_orders && inc.work_orders.length > 0) {
      inc.work_orders.forEach(wo => {
        allOrdersWithIncidents.push({ workOrder: wo, incident: inc });
      });
    } else if (inc.work_order) {
      allOrdersWithIncidents.push({ workOrder: inc.work_order, incident: inc });
    }
  });

  const filteredOrders = allOrdersWithIncidents.filter(({ workOrder, incident }) => {
    // If technician filter is active, only show their assignments
    if (filterTechnicianOnly) {
      const isAssigned = (
        workOrder.technician_id === currentUser.id ||
        (workOrder.technician && workOrder.technician.toLowerCase().includes(currentUser.full_name.toLowerCase()))
      );
      if (!isAssigned) return false;
    }

    if (filterStatus !== 'ALL' && workOrder.status !== filterStatus) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = workOrder.id.toString().includes(q);
      const matchInc = incident.description.toLowerCase().includes(q) || incident.id.toString().includes(q);
      const matchRoom = incident.room_code ? incident.room_code.toLowerCase().includes(q) : false;
      const matchTech = workOrder.technician ? workOrder.technician.toLowerCase().includes(q) : false;
      return matchId || matchInc || matchRoom || matchTech;
    }

    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header Info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Wrench size={18} color="var(--color-primary)" />
          {title} ({filteredOrders.length})
        </h2>
        {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{subtitle}</p>}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by order ID, incident, room, technician..."
            style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.84rem' }}
          />
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {['ALL', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED'].map(st => (
            <button
              key={st}
              type="button"
              className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilterStatus(st)}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {filteredOrders.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px dashed var(--border-default)' }}>
          <div className="empty-state-icon" style={{ margin: '0 auto 0.75rem' }}>
            <Inbox size={24} />
          </div>
          <div className="empty-state-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            No work orders found
          </div>
          <div className="empty-state-text" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto' }}>
            Dispatched maintenance orders will appear here automatically as campus incidents are reported and triaged.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence>
            {filteredOrders.map(({ workOrder, incident }) => (
              <WorkOrderCard
                key={`${workOrder.id}-${incident.id}`}
                workOrder={workOrder}
                incident={incident}
                currentUser={currentUser}
                onSelectIncident={onSelectIncident}
                onStartJob={onStartJob}
                onCompleteJob={onCompleteJob}
                onRejectJob={onRejectJob}
                isActing={isActing}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

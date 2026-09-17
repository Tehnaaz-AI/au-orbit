import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident, Technician, Room, Equipment, TimetableItem, AnalyticsMetrics, User } from '../types';
import { AgentExecutionTracker } from './AgentExecutionTracker';
import { 
  Activity, 
  Building2, 
  Users, 
  Calendar, 
  RotateCcw, 
  Inbox,
  ShieldAlert
} from 'lucide-react';

interface AdminConsoleProps {
  currentUser: User;
  incidents: Incident[];
  technicians: Technician[];
  rooms: Room[];
  equipment: Equipment[];
  timetable: TimetableItem[];
  analytics: AnalyticsMetrics | null;
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

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  incidents,
  technicians,
  rooms,
  equipment,
  timetable,
  analytics,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stream' | 'spaces' | 'technicians' | 'timetable'>('stream');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBlock, setSelectedBlock] = useState<string>('ALL');

  const filteredIncidents = incidents.filter(i => {
    if (filterStatus !== 'ALL' && i.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && i.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        i.description.toLowerCase().includes(q) ||
        (i.room_code && i.room_code.toLowerCase().includes(q)) ||
        i.reporter.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredRooms = rooms.filter(r => 
    selectedBlock === 'ALL' || r.block === selectedBlock
  );

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

  const priorityBadgeClass: Record<string, string> = {
    EMERGENCY: 'badge-danger',
    HIGH: 'badge-danger',
    NORMAL: 'badge-info',
    LOW: 'badge-neutral'
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      
      {/* Header */}
      <motion.div 
        variants={itemVariants}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ fontSize: '1.65rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={24} color="var(--color-primary)" />
              University Operations Console
            </h1>
            <span className="badge badge-role">Administrator</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Campus governance, multi-agent dispatch oversight, specialist fleet, and facilities inventory.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onRefresh}
          >
            <RotateCcw size={13} /> Refresh Fleet
          </motion.button>
        </div>
      </motion.div>

      {/* Sub-Navigation Tabs */}
      <motion.div 
        variants={itemVariants}
        style={{ display: 'flex', gap: '0.35rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}
      >
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          className={`btn btn-sm ${activeSubTab === 'stream' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('stream')}
        >
          <Activity size={14} /> Incidents Stream ({incidents.length})
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          className={`btn btn-sm ${activeSubTab === 'spaces' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('spaces')}
        >
          <Building2 size={14} /> Campus Spaces ({rooms.length})
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          className={`btn btn-sm ${activeSubTab === 'technicians' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('technicians')}
        >
          <Users size={14} /> Specialists ({technicians.length})
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          className={`btn btn-sm ${activeSubTab === 'timetable' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveSubTab('timetable')}
        >
          <Calendar size={14} /> Reference Timetable ({timetable.length})
        </motion.button>
      </motion.div>

      {/* SUB-TAB: INCIDENTS STREAM */}
      {activeSubTab === 'stream' && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          
          {/* Filter Bar */}
          <div className="card card-interactive" style={{ padding: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Filter Status</label>
                <select 
                  className="form-select" 
                  value={filterStatus} 
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REPORTED">REPORTED</option>
                  <option value="ASSIGNED">ASSIGNED</option>
                  <option value="SCHEDULED">SCHEDULED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="AWAITING_VERIFICATION">AWAITING_VERIFICATION</option>
                  <option value="REPLANNING">REPLANNING</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>

              <div>
                <label className="form-label">Filter Priority</label>
                <select 
                  className="form-select" 
                  value={filterPriority} 
                  onChange={e => setFilterPriority(e.target.value)}
                >
                  <option value="ALL">All Priorities</option>
                  <option value="EMERGENCY">EMERGENCY</option>
                  <option value="HIGH">HIGH</option>
                  <option value="NORMAL">NORMAL</option>
                  <option value="LOW">LOW</option>
                </select>
              </div>

              <div>
                <label className="form-label">Search Query</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search description, room, reporter..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Incidents Feed */}
          {filteredIncidents.length === 0 ? (
            <div className="card">
              <div className="empty-state" style={{ border: 'none' }}>
                <div className="empty-state-icon">
                  <Inbox size={24} />
                </div>
                <div className="empty-state-title">No matching incidents found</div>
                <div className="empty-state-text">
                  Adjust your search or status filters to view historical or active campus incidents.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <AnimatePresence>
                {filteredIncidents.map(inc => (
                  <motion.div 
                    key={inc.id} 
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="card card-interactive" 
                    style={{ padding: '1rem' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                          Incident #{inc.id} · {inc.room_code || 'General Space'}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-body)', marginLeft: '0.5rem' }}>
                          {inc.description}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <span className={`badge ${statusBadgeClass[inc.status] || 'badge-neutral'}`}>{inc.status}</span>
                        <span className={`badge ${priorityBadgeClass[inc.priority] || 'badge-neutral'}`}>{inc.priority}</span>
                        {inc.replan_count > 0 && (
                          <span className="badge badge-replan">Replan #{inc.replan_count}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', gap: '1rem' }}>
                      <span>Reporter: <b>{inc.reporter}</b></span>
                      <span>Category: <b>{inc.category}</b></span>
                      <span>Created: {new Date(inc.created_at).toLocaleString()}</span>
                    </div>

                    <AgentExecutionTracker incident={inc} compact={true} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

        </motion.div>
      )}

      {/* SUB-TAB: SPACES & EQUIPMENT */}
      {activeSubTab === 'spaces' && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          
          <div className="card card-interactive" style={{ padding: '0.85rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)' }}>Filter Block:</span>
              {['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'S'].map(b => (
                <motion.button
                  key={b}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className={`btn btn-sm ${selectedBlock === b ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                  onClick={() => setSelectedBlock(b)}
                >
                  Block {b}
                </motion.button>
              ))}
            </div>
          </div>

          <div className="table-container card-interactive">
            <table className="table">
              <thead>
                <tr>
                  <th>Space Code</th>
                  <th>Block</th>
                  <th>Floor</th>
                  <th>Type</th>
                  <th>Department</th>
                  <th>Availability</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.slice(0, 50).map(r => (
                  <tr key={r.code}>
                    <td><b className="mono">{r.code}</b></td>
                    <td>Block {r.block}</td>
                    <td>Floor {r.floor}</td>
                    <td><span className="badge badge-neutral">{r.kind}</span></td>
                    <td>{r.department || 'General'}</td>
                    <td><span className="badge badge-success">AVAILABLE</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </motion.div>
      )}

      {/* SUB-TAB: TECHNICIANS FLEET */}
      {activeSubTab === 'technicians' && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="table-container card-interactive"
        >
          <table className="table">
            <thead>
              <tr>
                <th>Specialist Name</th>
                <th>Maintenance Specialty</th>
                <th>Current Status</th>
                <th>Assigned Work</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map(t => {
                const activeJobs = incidents.filter(i => i.work_order?.technician_id === t.id && !['RESOLVED', 'CLOSED'].includes(i.status));

                return (
                  <tr key={t.id}>
                    <td><b>{t.name}</b></td>
                    <td><span className="badge badge-neutral">{t.specialty}</span></td>
                    <td>
                      <span className={`badge ${t.status === 'AVAILABLE' ? 'badge-success' : 'badge-warning'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>{activeJobs.length} active job(s)</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      )}

      {/* SUB-TAB: REFERENCE TIMETABLE */}
      {activeSubTab === 'timetable' && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="table-container card-interactive"
        >
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Period</th>
                <th>Room</th>
                <th>Subject</th>
                <th>Faculty</th>
                <th>Section</th>
                <th>Activity</th>
              </tr>
            </thead>
            <tbody>
              {timetable.slice(0, 40).map(t => (
                <tr key={t.id}>
                  <td><b>{t.day}</b></td>
                  <td>Period {t.period} ({t.start_time} - {t.end_time})</td>
                  <td><span className="badge badge-neutral mono">{t.room_code}</span></td>
                  <td><b>{t.subject}</b></td>
                  <td>{t.faculty}</td>
                  <td>{t.section}</td>
                  <td><span className="badge badge-neutral">{t.activity_type}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

    </motion.div>
  );
};

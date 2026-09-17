import React, { useState } from 'react';
import { Incident, Technician, Room, Equipment, TimetableItem, AnalyticsMetrics, User } from '../types';
import { AgentExecutionTracker } from './AgentExecutionTracker';
import { 
  ClipboardList, 
  Building2, 
  Users, 
  Calendar, 
  RotateCcw, 
  Inbox,
  Shield,
  Layers,
  Search,
  MapPin,
  Clock
} from 'lucide-react';

interface AdminConsoleProps {
  currentUser: User;
  incidents: Incident[];
  technicians: Technician[];
  rooms: Room[];
  equipment: Equipment[];
  timetable: TimetableItem[];
  analytics: AnalyticsMetrics | null;
  onSelectIncident?: (incident: Incident) => void;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  incidents,
  technicians,
  rooms,
  equipment,
  timetable,
  analytics,
  onSelectIncident,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'stream' | 'spaces' | 'technicians' | 'timetable' | 'telemetry'>('stream');
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
            <h1 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'var(--text-main)' }}>
              <Shield size={20} color="var(--color-primary)" />
              University Operations Console
            </h1>
            <span className="badge badge-role">Administrator</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Campus governance, multi-agent dispatch oversight, specialist fleet, and facilities inventory.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onRefresh}
          >
            <RotateCcw size={12} /> Refresh Data
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="tab-bar">
        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'stream' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('stream')}
        >
          <ClipboardList size={13} /> Incident Stream ({incidents.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'spaces' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('spaces')}
        >
          <Building2 size={13} /> Campus Spaces ({rooms.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'technicians' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('technicians')}
        >
          <Users size={13} /> Specialists ({technicians.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'timetable' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('timetable')}
        >
          <Calendar size={13} /> Reference Timetable ({timetable.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeSubTab === 'telemetry' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('telemetry')}
        >
          <Layers size={13} /> Agent Telemetry
        </button>
      </div>

      {/* SUB-TAB 1: INCIDENTS STREAM */}
      {activeSubTab === 'stream' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Filter Bar */}
          <div className="card" style={{ padding: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="form-label" htmlFor="admin-filter-status">Filter Status</label>
                <select 
                  id="admin-filter-status"
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
                <label className="form-label" htmlFor="admin-filter-priority">Filter Priority</label>
                <select 
                  id="admin-filter-priority"
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
                <label className="form-label" htmlFor="admin-search-q">Search Query</label>
                <input
                  id="admin-search-q"
                  type="text"
                  className="form-input"
                  placeholder="Search description, space, reporter..."
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
                  <Inbox size={22} />
                </div>
                <div className="empty-state-title">No matching incidents found</div>
                <div className="empty-state-text">
                  Adjust your search or status filters to view historical or active campus incidents.
                </div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredIncidents.map(inc => (
                <div 
                  key={inc.id} 
                  className="card card-interactive" 
                  style={{ padding: '0.9rem 1.15rem' }}
                  onClick={() => onSelectIncident && onSelectIncident(inc)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.45rem', marginBottom: '0.4rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                        Incident #{inc.id} · {inc.room_code || 'General Space'}
                      </span>
                      <span style={{ fontSize: '0.84rem', color: 'var(--text-body)', marginLeft: '0.45rem' }}>
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

                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', gap: '0.85rem' }}>
                    <span>Reporter: <b>{inc.reporter}</b></span>
                    <span>Category: <b>{inc.category}</b></span>
                    <span>Created: {new Date(inc.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* SUB-TAB 2: SPACES */}
      {activeSubTab === 'spaces' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>Filter Block:</span>
              {['ALL', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'S'].map(b => (
                <button
                  key={b}
                  type="button"
                  className={`btn btn-sm ${selectedBlock === b ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}
                  onClick={() => setSelectedBlock(b)}
                >
                  Block {b}
                </button>
              ))}
            </div>
          </div>

          <div className="table-container">
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
        </div>
      )}

      {/* SUB-TAB 3: TECHNICIANS FLEET */}
      {activeSubTab === 'technicians' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Specialist Name</th>
                <th>Maintenance Specialty</th>
                <th>Current Status</th>
                <th>Active Assignments</th>
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
        </div>
      )}

      {/* SUB-TAB 4: REFERENCE TIMETABLE */}
      {activeSubTab === 'timetable' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Institutional Reference Timetable (Official Campus Academic Schedule)
            </span>
            <span className="badge badge-role">Reference Data</span>
          </div>
          <div className="table-container">
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
          </div>
        </div>
      )}

      {/* SUB-TAB 5: AGENT TELEMETRY */}
      {activeSubTab === 'telemetry' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {incidents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><Layers size={22} /></div>
              <div className="empty-state-title">No active telemetry runs</div>
              <div className="empty-state-text">Reported issues will stream real-time agent execution histories here.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {incidents.slice(0, 5).map(inc => (
                <div key={inc.id} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Incident #{inc.id} Telemetry · Space: {inc.room_code || 'Campus'}</span>
                    <span className={`badge ${statusBadgeClass[inc.status] || 'badge-neutral'}`}>{inc.status}</span>
                  </div>
                  <AgentExecutionTracker incident={inc} compact={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

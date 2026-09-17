import React, { useState, useEffect } from 'react';
import { Incident, Technician, Room, Equipment, TimetableItem, AnalyticsMetrics, User } from '../types';
import { IncidentList } from './incidents/IncidentList';
import { WorkOrderList } from './workorders/WorkOrderList';
import { TimetableManager } from './timetable/TimetableManager';
import { AgentExecutionTracker } from './AgentExecutionTracker';
import { CampusHierarchyExplorer } from './spaces/CampusHierarchyExplorer';
import { UserManagementView } from './admin/UserManagementView';
import { 
  ClipboardList, 
  Wrench, 
  Building2, 
  Calendar, 
  Cpu, 
  RotateCcw,
  Shield,
  Users
} from 'lucide-react';

interface AdminConsoleProps {
  currentUser: User;
  incidents: Incident[];
  technicians: Technician[];
  rooms: Room[];
  equipment: Equipment[];
  timetable: TimetableItem[];
  analytics: AnalyticsMetrics | null;
  activeSubTab?: 'incidents' | 'work_orders' | 'resources' | 'timetable' | 'agent_runs' | 'users';
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
  activeSubTab = 'incidents',
  onSelectIncident,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [currentTab, setCurrentTab] = useState<'incidents' | 'work_orders' | 'resources' | 'timetable' | 'agent_runs' | 'users'>(activeSubTab);
  const [selectedIncidentForTelemetry, setSelectedIncidentForTelemetry] = useState<Incident>(incidents[0] || null);

  useEffect(() => {
    if (activeSubTab) {
      setCurrentTab(activeSubTab);
    }
  }, [activeSubTab]);

  const isSuperOrOps = ['SUPER_ADMIN', 'OPERATIONAL_HEAD', 'ADMIN', 'UNIVERSITY_ADMIN'].includes(currentUser.role);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
              <Shield size={22} color="var(--primary-dark)" />
              Campus Operations & Administration
            </h1>
            <span className="badge badge-role">{currentUser.role.replace('_', ' ')}</span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Central campus governance, autonomous multi-agent dispatch oversight, spatial inventory, and user roster management.
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={onRefresh}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RotateCcw size={13} /> Refresh Data
        </button>
      </div>

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.4rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`btn btn-sm ${currentTab === 'incidents' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('incidents')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <ClipboardList size={14} /> Incidents ({incidents.length})
        </button>

        <button
          type="button"
          className={`btn btn-sm ${currentTab === 'work_orders' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('work_orders')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Wrench size={14} /> Work Orders
        </button>

        <button
          type="button"
          className={`btn btn-sm ${currentTab === 'resources' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('resources')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Building2 size={14} /> Campus Spaces ({rooms.length})
        </button>

        {isSuperOrOps && (
          <button
            type="button"
            className={`btn btn-sm ${currentTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('users')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <Users size={14} /> User Roster
          </button>
        )}

        <button
          type="button"
          className={`btn btn-sm ${currentTab === 'timetable' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('timetable')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Calendar size={14} /> Timetable ({timetable.length})
        </button>

        <button
          type="button"
          className={`btn btn-sm ${currentTab === 'agent_runs' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setCurrentTab('agent_runs')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Cpu size={14} /> Agent Telemetry
        </button>
      </div>

      {/* TAB 1: INCIDENTS */}
      {currentTab === 'incidents' && (
        <IncidentList
          incidents={incidents}
          onSelectIncident={onSelectIncident || (() => {})}
          title="Campus Incident Stream"
          subtitle="All reported issues, autonomous triage priorities, and multi-agent dispatch states."
          showFilters={true}
        />
      )}

      {/* TAB 2: WORK ORDERS */}
      {currentTab === 'work_orders' && (
        <WorkOrderList
          incidents={incidents}
          currentUser={currentUser}
          technicians={technicians}
          onSelectIncident={onSelectIncident}
          onRefresh={onRefresh}
          onError={onError}
          onSuccess={onSuccess}
          title="All Dispatched Work Orders"
          subtitle="Maintenance work orders assigned to campus specialists and technicians. Reassignment supported for Super Admins & Operations Heads."
        />
      )}

      {/* TAB 3: CAMPUS SPACES (Structured Block -> Floor Hierarchy) */}
      {currentTab === 'resources' && (
        <CampusHierarchyExplorer
          rooms={rooms}
          equipment={equipment}
          currentUser={currentUser}
          onRefresh={onRefresh}
          onError={onError}
          onSuccess={onSuccess}
          onSelectRoom={(r) => {
            onSuccess(`Selected space: ${r.code} (${r.kind})`);
          }}
        />
      )}

      {/* TAB 4: USERS & ROLES */}
      {currentTab === 'users' && isSuperOrOps && (
        <UserManagementView
          currentUser={currentUser}
          technicians={technicians}
          incidents={incidents}
          onRefresh={onRefresh}
          onError={onError}
          onSuccess={onSuccess}
        />
      )}

      {/* TAB 5: TIMETABLE */}
      {currentTab === 'timetable' && (
        <TimetableManager
          timetable={timetable}
          rooms={rooms}
        />
      )}

      {/* TAB 6: AGENT TELEMETRY */}
      {currentTab === 'agent_runs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
              <Cpu size={20} color="var(--primary-dark)" />
              Autonomous Multi-Agent Telemetry
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
              Inspect live AgentRun lifecycles, understanding signals, resource allocation decisions, and autonomous replanning events.
            </p>
          </div>

          {/* Incident Selector for Telemetry */}
          {incidents.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>Select Incident:</span>
              <select
                className="form-select"
                value={selectedIncidentForTelemetry?.id || incidents[0]?.id}
                onChange={e => {
                  const target = incidents.find(i => i.id === Number(e.target.value));
                  if (target) setSelectedIncidentForTelemetry(target);
                }}
                style={{ maxWidth: 400, fontSize: '0.84rem' }}
              >
                {incidents.map(inc => (
                  <option key={inc.id} value={inc.id}>
                    #{inc.id} - {inc.description.slice(0, 45)} ({inc.status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedIncidentForTelemetry || incidents[0] ? (
            <AgentExecutionTracker
              incident={selectedIncidentForTelemetry || incidents[0]}
            />
          ) : (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No incidents recorded yet for agent telemetry.</p>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

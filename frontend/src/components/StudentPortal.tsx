import React from 'react';
import { motion } from 'framer-motion';
import { Incident, Room, User } from '../types';
import { IncidentList } from './incidents/IncidentList';
import { ReportIssueForm } from './reporting/ReportIssueForm';
import { RotateCcw } from 'lucide-react';

interface StudentPortalProps {
  currentUser: User;
  incidents: Incident[];
  rooms: Room[];
  activeTab?: string;
  onSelectIncident?: (incident: Incident) => void;
  onNavigateTab?: (tab: string) => void;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  currentUser,
  incidents,
  rooms,
  activeTab = 'my_issues',
  onSelectIncident,
  onNavigateTab,
  onRefresh,
  onError,
  onSuccess
}) => {
  // Scoped strictly to incidents reported by this student
  const myIncidents = incidents.filter(i => 
    i.reporter.toLowerCase().includes(currentUser.full_name.toLowerCase()) ||
    i.reporter.toLowerCase().includes(currentUser.email.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', color: 'var(--text-main)' }}>
            {activeTab === 'report_issue' ? 'Report a Campus Issue' : 'My Reported Issues'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {activeTab === 'report_issue' 
              ? 'Submit issues for classrooms, labs, or campus facilities for autonomous multi-agent dispatch.'
              : 'Track real-time operational triage, technician dispatch, and resolution status for your reports.'}
          </p>
        </div>

        <button 
          type="button" 
          className="btn btn-secondary btn-sm" 
          onClick={onRefresh}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <RotateCcw size={13} /> Refresh
        </button>
      </div>

      {/* VIEW 1: REPORT ISSUE FORM ONLY */}
      {activeTab === 'report_issue' && (
        <ReportIssueForm
          currentUser={currentUser}
          rooms={rooms}
          onIncidentReported={(_inc) => {
            onRefresh();
          }}
          onSelectIncident={onSelectIncident}
          onError={onError}
          onSuccess={onSuccess}
        />
      )}

      {/* VIEW 2: MY ISSUES DATA VIEW ONLY */}
      {activeTab === 'my_issues' && (
        <IncidentList
          incidents={myIncidents}
          onSelectIncident={onSelectIncident || (() => {})}
          title="My Issues"
          subtitle="All maintenance and facility requests submitted by you."
          emptyTitle="You haven't reported any issues yet"
          emptyDescription="When you report a broken projector, power fault, or facility problem, it will appear here with live tracking."
          showFilters={true}
        />
      )}
    </div>
  );
};

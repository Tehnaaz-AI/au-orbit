import React, { useState } from 'react';
import { Incident, TimetableItem, Room, User } from '../types';
import { api } from '../api';
import { IncidentList } from './incidents/IncidentList';
import { ReportIssueForm } from './reporting/ReportIssueForm';
import { RotateCcw, GraduationCap, Calendar, CheckCircle2 } from 'lucide-react';

interface FacultyPortalProps {
  currentUser: User;
  incidents: Incident[];
  timetable: TimetableItem[];
  rooms: Room[];
  activeTab?: string;
  onSelectIncident?: (incident: Incident) => void;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const FacultyPortal: React.FC<FacultyPortalProps> = ({
  currentUser,
  incidents,
  timetable,
  rooms,
  activeTab = 'my_issues',
  onSelectIncident,
  onRefresh,
  onError,
  onSuccess
}) => {
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  // Faculty verification handler
  async function handleVerification(workOrderId: number, outcome: 'pass' | 'fail') {
    setVerifyingId(workOrderId);
    try {
      await api.workOrderAction(workOrderId, 'verify', {
        outcome,
        notes: outcome === 'pass' 
          ? `Faculty verified by ${currentUser.full_name}: Classroom equipment restored and fully operational.` 
          : `Faculty rejected by ${currentUser.full_name}: Issue still persists.`
      });
      if (outcome === 'pass') {
        onSuccess('Resolution verified. Classroom restored to standard operational status.');
      } else {
        onError('Verification rejected. Autonomous multi-agent replanning triggered.');
      }
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Verification failed');
    } finally {
      setVerifyingId(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <GraduationCap color="var(--color-primary)" size={22} />
            {activeTab === 'report_issue' ? 'Report Classroom / Department Issue' : 'Classroom & Department Operations'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {activeTab === 'report_issue'
              ? 'Report lecture hall or departmental technical problems with automatic timetable-based escalation.'
              : 'Classroom maintenance tracking, instructional priority escalation, and faculty sign-off verification.'}
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

      {/* VIEW 1: REPORT ISSUE FORM */}
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
          title="Report Classroom Issue"
          subtitle="AUOrbit cross-references your active lecture schedule to automatically set priority and dispatch specialists."
        />
      )}

      {/* VIEW 2: CLASSROOM & DEPT ISSUES */}
      {activeTab === 'my_issues' && (
        <IncidentList
          incidents={incidents}
          onSelectIncident={onSelectIncident || (() => {})}
          title="Department Incidents"
          subtitle="All classroom and academic facility maintenance orders with sign-off verification."
          emptyTitle="No classroom issues currently reported"
          emptyDescription="Classroom and lab issues requiring faculty awareness or sign-off will appear here."
          showFilters={true}
          showVerificationActions={true}
          onVerify={handleVerification}
          isVerifying={verifyingId !== null}
        />
      )}
    </div>
  );
};

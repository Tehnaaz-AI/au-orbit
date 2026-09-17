import React from 'react';
import { motion } from 'framer-motion';
import { Incident, User, AnalyticsMetrics } from '../types';
import { IncidentCard } from './incidents/IncidentCard';
import { 
  RotateCcw, 
  PlusCircle, 
  ArrowRight, 
  ClipboardList, 
  Inbox,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  incidents: Incident[];
  analytics: AnalyticsMetrics | null;
  onSelectIncident: (incident: Incident) => void;
  onNavigateTab?: (tab: string) => void;
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  incidents,
  analytics,
  onSelectIncident,
  onNavigateTab,
  onRefresh,
  onError,
  onSuccess
}) => {
  // Operational counts from authentic backend data
  const activeIncidents = incidents.filter(i => !['RESOLVED', 'CLOSED'].includes(i.status));
  const inProgressCount = incidents.filter(i => ['IN_PROGRESS', 'ASSIGNED', 'SCHEDULED'].includes(i.status)).length;
  const awaitingVerification = incidents.filter(i => ['AWAITING_VERIFICATION', 'REOPENED'].includes(i.status)).length;
  const resolvedCount = incidents.filter(i => ['RESOLVED', 'CLOSED'].includes(i.status)).length;

  const isStudent = currentUser.role === 'STUDENT';
  const isFaculty = currentUser.role === 'FACULTY';
  const isAdmin = ['ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  // Top attention incidents (highest priority first, unclosed)
  const attentionIncidents = [...activeIncidents]
    .sort((a, b) => {
      const pOrder: Record<string, number> = { EMERGENCY: 0, HIGH: 1, NORMAL: 2, LOW: 3 };
      return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
    })
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* 1. Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            Operational Overview
            <span className="pulse-dot" />
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Welcome back, <strong>{currentUser.full_name}</strong>. Real-time campus telemetry and automated dispatch status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {(isStudent || isFaculty) && onNavigateTab && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onNavigateTab('report_issue')}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PlusCircle size={14} /> Report Issue
            </button>
          )}

          <button 
            type="button" 
            className="btn btn-secondary btn-sm" 
            onClick={onRefresh}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* 2. Operational Metrics Bar */}
      <div className="stats-grid">
        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">Active Issues</div>
          <div className="stat-value">{activeIncidents.length}</div>
          <div className="stat-desc">Requiring operational attention</div>
        </motion.div>

        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">In Progress</div>
          <div className="stat-value">{inProgressCount}</div>
          <div className="stat-desc">Assigned & scheduled operations</div>
        </motion.div>

        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">Awaiting Verification</div>
          <div className="stat-value">{awaitingVerification}</div>
          <div className="stat-desc">Completed work pending audit</div>
        </motion.div>

        <motion.div 
          className="stat-box card-interactive"
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          <div className="stat-label">Resolved</div>
          <div className="stat-value">{resolvedCount}</div>
          <div className="stat-desc">Closed verified operations</div>
        </motion.div>
      </div>

      {/* 3. Attention Section & Quick Navigation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <AlertTriangle size={18} color="var(--color-primary)" />
              Needs Attention & Recent Items
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Top urgent campus incidents and operational tasks.
            </p>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onNavigateTab(isStudent ? 'my_issues' : isFaculty ? 'my_issues' : 'incidents')}
              style={{ color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              View All Issues <ArrowRight size={13} />
            </button>
          )}
        </div>

        {attentionIncidents.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div className="empty-state-icon" style={{ margin: '0 auto 0.5rem' }}>
              <CheckCircle2 size={24} color="var(--status-success-text)" />
            </div>
            <div className="empty-state-title" style={{ fontWeight: 700, color: 'var(--text-main)' }}>
              All campus systems operational
            </div>
            <div className="empty-state-text" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              No critical operational disruptions or pending maintenance issues at this time.
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {attentionIncidents.map(inc => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                onClick={() => onSelectIncident(inc)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

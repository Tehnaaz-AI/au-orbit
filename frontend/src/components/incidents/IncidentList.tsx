import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Incident } from '../../types';
import { IncidentCard } from './IncidentCard';
import { Search, Inbox, Filter } from 'lucide-react';

interface IncidentListProps {
  incidents: Incident[];
  onSelectIncident: (incident: Incident) => void;
  title?: string;
  subtitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  showFilters?: boolean;
  showVerificationActions?: boolean;
  onVerify?: (workOrderId: number, outcome: 'pass' | 'fail') => void;
  isVerifying?: boolean;
}

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  onSelectIncident,
  title,
  subtitle,
  emptyTitle = 'No incidents found',
  emptyDescription = 'There are currently no incidents matching the selected criteria.',
  showFilters = true,
  showVerificationActions = false,
  onVerify,
  isVerifying = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const filteredIncidents = incidents.filter(inc => {
    if (filterStatus !== 'ALL' && inc.status !== filterStatus) return false;
    if (filterPriority !== 'ALL' && inc.priority !== filterPriority) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const descMatch = inc.description.toLowerCase().includes(q);
      const roomMatch = inc.room_code ? inc.room_code.toLowerCase().includes(q) : false;
      const reporterMatch = inc.reporter.toLowerCase().includes(q);
      const idMatch = inc.id.toString().includes(q);
      return descMatch || roomMatch || reporterMatch || idMatch;
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Optional Header info */}
      {(title || subtitle) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {title && <h2 style={{ fontSize: '1.25rem', color: 'var(--text-main)' }}>{title} ({incidents.length})</h2>}
          {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{subtitle}</p>}
        </div>
      )}

      {/* Filter and Search Bar */}
      {showFilters && (
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
          {/* Search Bar */}
          <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '400px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by ID, keyword, space, reporter..."
              style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.84rem' }}
            />
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Status:</span>
              <select
                className="form-select"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                style={{ height: '34px', fontSize: '0.78rem', padding: '0 0.5rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="REPORTED">Reported</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="AWAITING_VERIFICATION">Awaiting Verification</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REPLANNING">Replanning</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Priority:</span>
              <select
                className="form-select"
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                style={{ height: '34px', fontSize: '0.78rem', padding: '0 0.5rem' }}
              >
                <option value="ALL">All Priorities</option>
                <option value="EMERGENCY">Emergency</option>
                <option value="HIGH">High</option>
                <option value="NORMAL">Normal</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Incidents List Feed */}
      {filteredIncidents.length === 0 ? (
        <div className="card" style={{ padding: '3rem 1.5rem', textAlign: 'center', border: '1px dashed var(--border-default)' }}>
          <div className="empty-state-icon" style={{ margin: '0 auto 0.75rem' }}>
            <Inbox size={24} />
          </div>
          <div className="empty-state-title" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            {emptyTitle}
          </div>
          <div className="empty-state-text" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto' }}>
            {emptyDescription}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <AnimatePresence>
            {filteredIncidents.map(inc => (
              <IncidentCard
                key={inc.id}
                incident={inc}
                onClick={() => onSelectIncident(inc)}
                showVerificationActions={showVerificationActions}
                onVerify={onVerify}
                isVerifying={isVerifying}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

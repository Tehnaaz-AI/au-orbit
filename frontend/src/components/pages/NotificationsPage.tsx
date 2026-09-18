import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Incident, WorkOrderItem } from '../../types';
import { 
  Bell, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench, 
  RotateCcw, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Trash2, 
  Check, 
  Layers,
  Inbox,
  Filter,
  UserCheck
} from 'lucide-react';

export interface AppNotification {
  id: string;
  type: 'INQUIRY' | 'EMERGENCY' | 'WORK_ORDER' | 'VERIFICATION' | 'SYSTEM' | 'REPLAN';
  title: string;
  message: string;
  sender?: string;
  senderEmail?: string;
  timestamp: string;
  read: boolean;
  incidentId?: number;
  workOrderId?: number;
  mailtoUrl?: string;
  priority?: string;
}

interface NotificationsPageProps {
  currentUser: User;
  incidents: Incident[];
  onSelectIncident?: (incident: Incident) => void;
  onNavigateTab?: (tab: string) => void;
  onRefresh?: () => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  currentUser,
  incidents,
  onSelectIncident,
  onNavigateTab,
  onRefresh
}) => {
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'INQUIRIES' | 'ALERTS'>('ALL');
  const isPrivileged = ['OPERATIONAL_HEAD', 'ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);
  const isFaculty = currentUser.role === 'FACULTY';
  const isTechnician = currentUser.role === 'TECHNICIAN';

  // Dynamically compile notifications based on live incidents, inquiries, and user role
  const initialNotifications: AppNotification[] = [];

  incidents.forEach(inc => {
    // 1. Contact Desk Inquiries (Routed to Ops Head, Admin, Super Admin)
    if (inc.category === 'GENERAL_INQUIRY') {
      if (isPrivileged) {
        initialNotifications.push({
          id: `inquiry-${inc.id}`,
          type: 'INQUIRY',
          title: `Contact Desk Inquiry #${inc.id}`,
          message: inc.description,
          sender: inc.reporter,
          timestamp: inc.created_at,
          read: false,
          incidentId: inc.id,
          mailtoUrl: `mailto:${inc.reporter.match(/[\w.-]+@[\w.-]+/)?.[0] || 'support@auorbit.edu.in'}?subject=Re: Ticket #${inc.id} Inquiry Response`,
          priority: 'NORMAL'
        });
      }
    }

    // 2. Emergency / High Priority Incident Escalations
    if (['EMERGENCY', 'HIGH'].includes(inc.priority)) {
      if (isPrivileged || isFaculty) {
        initialNotifications.push({
          id: `alert-${inc.id}`,
          type: 'EMERGENCY',
          title: `Priority Escalation: Space ${inc.room_code || 'Campus'}`,
          message: `${inc.description.slice(0, 100)}... (Reported by: ${inc.reporter})`,
          sender: inc.reporter,
          timestamp: inc.created_at,
          read: false,
          incidentId: inc.id,
          priority: inc.priority
        });
      }
    }

    // 3. Autonomous Replanning Events
    if (inc.replan_count > 0 && isPrivileged) {
      initialNotifications.push({
        id: `replan-${inc.id}-${inc.replan_count}`,
        type: 'REPLAN',
        title: `Autonomous Re-Plan Cycle #${inc.replan_count}`,
        message: `Incident #${inc.id} auto-escalated to tier priority. AI scheduler dynamically re-allocating specialist.`,
        timestamp: inc.created_at,
        read: false,
        incidentId: inc.id,
        priority: 'HIGH'
      });
    }

    // 4. Faculty Sign-Off Verification Needed
    if (['AWAITING_VERIFICATION'].includes(inc.status) && (isFaculty || isPrivileged)) {
      initialNotifications.push({
        id: `verify-${inc.id}`,
        type: 'VERIFICATION',
        title: `Resolution Sign-Off Required: ${inc.room_code || 'Lecture Hall'}`,
        message: `Technician completed repair. Awaiting faculty visual inspection and PASS/FAIL sign-off.`,
        sender: inc.work_order?.technician || 'Technician',
        timestamp: inc.created_at,
        read: false,
        incidentId: inc.id,
        priority: 'HIGH'
      });
    }

    // 5. Technician Work Dispatches
    if (isTechnician && inc.work_order && ['ASSIGNED', 'IN_PROGRESS'].includes(inc.work_order.status)) {
      initialNotifications.push({
        id: `wo-${inc.work_order.id}`,
        type: 'WORK_ORDER',
        title: `Work Order #${inc.work_order.id} Dispatched`,
        message: `${inc.description.slice(0, 90)}... [Room: ${inc.room_code || 'General'}]`,
        sender: inc.reporter,
        timestamp: inc.created_at,
        read: false,
        incidentId: inc.id,
        workOrderId: inc.work_order.id,
        priority: inc.priority
      });
    }
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(initialNotifications);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? ({ ...n, read: true }) : n));
  };

  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'INQUIRIES') return n.type === 'INQUIRY';
    if (filter === 'ALERTS') return ['EMERGENCY', 'REPLAN', 'VERIFICATION'].includes(n.type);
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '1000px', margin: '0 auto' }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Bell color="var(--color-primary)" size={22} />
              Operations Notification Center
            </h1>
            {unreadCount > 0 && (
              <span className="badge badge-danger" style={{ fontSize: '0.75rem', fontWeight: 800 }}>
                {unreadCount} Unread
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', margin: 0 }}>
            Real-time delivery channel for contact desk inquiries, emergency escalations, faculty sign-off audits, and autonomous agent dispatches.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {unreadCount > 0 && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={markAllRead}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
            >
              <Check size={13} /> Mark All as Read
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onRefresh}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
            >
              <RotateCcw size={13} /> Refresh
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.65rem',
        padding: '0.65rem 1rem',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
          {[
            { key: 'ALL', label: `All Notifications (${notifications.length})` },
            { key: 'UNREAD', label: `Unread (${unreadCount})` },
            ...(isPrivileged ? [{ key: 'INQUIRIES', label: 'Contact Inquiries' }] : []),
            { key: 'ALERTS', label: 'Priority Alerts & Sign-Offs' }
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              className={`btn btn-sm ${filter === tab.key ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(tab.key as any)}
              style={{ fontSize: '0.76rem', padding: '0.25rem 0.65rem' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Stream Feed */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', border: '1px dashed var(--border-default)' }}>
          <div className="empty-state-icon" style={{ margin: '0 auto 0.75rem' }}>
            <Inbox size={26} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            No notifications in this view
          </div>
          <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto' }}>
            New contact inquiries, technician updates, and emergency alerts will appear here in real-time.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <AnimatePresence>
            {filtered.map(item => {
              const matchedInc = incidents.find(i => i.id === item.incidentId);

              const getBorderColor = () => {
                if (item.type === 'INQUIRY') return 'var(--color-primary)';
                if (item.type === 'EMERGENCY' || item.type === 'REPLAN') return 'var(--status-danger)';
                if (item.type === 'VERIFICATION') return 'var(--status-warning-text)';
                return 'var(--border-default)';
              };

              const getIcon = () => {
                if (item.type === 'INQUIRY') return <Mail size={16} color="var(--color-primary)" />;
                if (item.type === 'EMERGENCY') return <AlertTriangle size={16} color="var(--status-danger)" />;
                if (item.type === 'REPLAN') return <RotateCcw size={16} color="var(--status-danger)" />;
                if (item.type === 'VERIFICATION') return <ShieldCheck size={16} color="var(--status-warning-text)" />;
                return <Wrench size={16} color="var(--color-primary-dark)" />;
              };

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  onClick={() => {
                    markAsRead(item.id);
                    if (matchedInc && onSelectIncident) {
                      onSelectIncident(matchedInc);
                    }
                  }}
                  className="card card-interactive"
                  style={{
                    padding: '1.1rem 1.25rem',
                    borderLeft: `4px solid ${getBorderColor()}`,
                    background: item.read ? '#FFFFFF' : 'var(--color-primary-subtle)',
                    cursor: matchedInc ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        background: '#FFFFFF',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {getIcon()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                            {item.title}
                          </span>
                          {!item.read && (
                            <span className="badge badge-danger" style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}>
                              NEW
                            </span>
                          )}
                          {item.type === 'INQUIRY' && (
                            <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                              Contact Desk
                            </span>
                          )}
                        </div>
                        {item.sender && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem' }}>
                            <UserCheck size={11} /> From: <strong>{item.sender}</strong>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={12} />
                        {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>

                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={(e) => deleteNotification(item.id, e)}
                        title="Dismiss notification"
                        style={{ padding: '0.2rem', color: 'var(--text-muted)' }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', margin: 0, lineHeight: 1.45 }}>
                    {item.message}
                  </p>

                  {/* Actions Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', paddingTop: '0.35rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Audited by: <strong>Ops Head, Admin, & Super Admin</strong>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {item.mailtoUrl && (
                        <a
                          href={item.mailtoUrl}
                          onClick={(e) => e.stopPropagation()}
                          className="btn btn-secondary btn-sm"
                          style={{ textDecoration: 'none', fontSize: '0.76rem', padding: '0.2rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          <Mail size={12} /> Direct Email Reply
                        </a>
                      )}

                      {matchedInc && onSelectIncident && (
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(item.id);
                            onSelectIncident(matchedInc);
                          }}
                          style={{ fontSize: '0.76rem', padding: '0.2rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                        >
                          Inspect Ticket <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

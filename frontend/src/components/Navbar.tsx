import React from 'react';
import { motion } from 'framer-motion';
import { Role, User } from '../types';
import { 
  LogOut, 
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Calendar,
  Layers,
  PlusCircle,
  Building2,
  Cpu,
  ArrowRight,
  Users,
  User as UserIcon,
  Sun,
  Moon,
  Headphones,
  Phone,
  Bell
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentRole?: Role;
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  onLogout?: () => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
  activeIncidentsCount?: number;
  emergencyCount?: number;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab = 'dashboard',
  onSelectTab,
  onLogout,
  onSignIn,
  onGetStarted,
  activeIncidentsCount = 0,
  emergencyCount = 0,
  theme = 'light',
  onToggleTheme
}) => {
  const scrollToSection = (sectionId: string) => {
    if (onSelectTab) {
      onSelectTab('landing');
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  // 1. Public Visitor Navbar
  if (!currentUser) {
    return (
      <header className="navbar">
        <a 
          href="/" 
          className="navbar-brand" 
          onClick={(e) => { 
            e.preventDefault(); 
            if (onSelectTab) onSelectTab('landing'); 
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <img src="/logo.png" alt="AUOrbit" style={{ height: 30, objectFit: 'contain' }} />
        </a>

        <nav aria-label="Main Navigation">
          <ul className="nav-links">
            <li>
              <button 
                type="button" 
                className="nav-item" 
                onClick={() => scrollToSection('how-it-works')}
              >
                How It Works
              </button>
            </li>
            <li>
              <button 
                type="button" 
                className="nav-item" 
                onClick={() => scrollToSection('capabilities')}
              >
                Capabilities
              </button>
            </li>
            <li>
              <button 
                type="button" 
                className="nav-item" 
                onClick={() => scrollToSection('roles')}
              >
                Roles
              </button>
            </li>
            <li>
              <button 
                type="button" 
                className="nav-item" 
                onClick={() => scrollToSection('architecture')}
              >
                Architecture
              </button>
            </li>
            <li>
              <button 
                type="button" 
                className={`nav-item ${activeTab === 'contact' ? 'active' : ''}`}
                onClick={() => onSelectTab && onSelectTab('contact')}
                style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <Phone size={13} /> Contact
              </button>
            </li>
          </ul>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <motion.button 
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            className="btn btn-secondary btn-sm" 
            onClick={onSignIn}
          >
            Sign In
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            className="btn btn-primary btn-sm" 
            onClick={onGetStarted}
          >
            Get Started <ArrowRight size={13} />
          </motion.button>
        </div>
      </header>
    );
  }

  // 2. Authenticated Role-Specific Navbar
  const isStudent = currentUser.role === 'STUDENT';
  const isFaculty = currentUser.role === 'FACULTY';
  const isTechnician = currentUser.role === 'TECHNICIAN';
  const isOpsHead = currentUser.role === 'OPERATIONAL_HEAD';
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = ['ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN', 'OPERATIONAL_HEAD'].includes(currentUser.role);

  return (
    <header className="navbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'nowrap' }}>
      {/* Brand & Canonical Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', minWidth: 0, flex: '1 1 auto' }}>
        <a 
          href="/" 
          className="navbar-brand" 
          style={{ flexShrink: 0 }}
          onClick={(e) => { 
            e.preventDefault(); 
            if (onSelectTab) onSelectTab('dashboard'); 
          }}
        >
          <img src="/logo.png" alt="AUOrbit" style={{ height: 28, objectFit: 'contain', display: 'block' }} />
        </a>

        <nav aria-label="Role Navigation" style={{ minWidth: 0, overflow: 'hidden' }}>
          <ul className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', overflowX: 'auto', scrollbarWidth: 'none', flexWrap: 'nowrap', padding: '0.1rem 0' }}>
            {/* Overview / Dashboard (All Roles) */}
            <li style={{ flexShrink: 0 }}>
              <button 
                type="button"
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => onSelectTab && onSelectTab('dashboard')}
              >
                <LayoutDashboard size={14} /> Overview
              </button>
            </li>

            {/* Student & Faculty: Issues View */}
            {(isStudent || isFaculty) && (
              <li style={{ flexShrink: 0 }}>
                <button 
                  type="button"
                  className={`nav-item ${activeTab === 'my_issues' ? 'active' : ''}`}
                  onClick={() => onSelectTab && onSelectTab('my_issues')}
                >
                  <ClipboardList size={14} /> {isStudent ? 'My Issues' : 'Classroom & Dept Issues'}
                </button>
              </li>
            )}

            {/* Student & Faculty: Report Issue (Action Form) */}
            {(isStudent || isFaculty) && (
              <li style={{ flexShrink: 0 }}>
                <button 
                  type="button"
                  className={`nav-item ${activeTab === 'report_issue' ? 'active' : ''}`}
                  onClick={() => onSelectTab && onSelectTab('report_issue')}
                >
                  <PlusCircle size={14} /> Report Issue
                </button>
              </li>
            )}

            {/* Technician: Assigned Work Queue */}
            {isTechnician && (
              <li style={{ flexShrink: 0 }}>
                <button 
                  type="button"
                  className={`nav-item ${activeTab === 'work_orders' ? 'active' : ''}`}
                  onClick={() => onSelectTab && onSelectTab('work_orders')}
                >
                  <Wrench size={14} /> Assigned Work Queue
                </button>
              </li>
            )}

            {/* Admin / Super Admin / Ops Head: Dedicated Operations Pages */}
            {isAdmin && (
              <>
                <li style={{ flexShrink: 0 }}>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('incidents')}
                  >
                    <ClipboardList size={14} /> Incidents
                  </button>
                </li>
                <li style={{ flexShrink: 0 }}>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'work_orders' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('work_orders')}
                  >
                    <Wrench size={14} /> Work Orders
                  </button>
                </li>
                <li style={{ flexShrink: 0 }}>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'resources' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('resources')}
                  >
                    <Building2 size={14} /> Campus Spaces
                  </button>
                </li>

                {(isSuperAdmin || isOpsHead) && (
                  <li style={{ flexShrink: 0 }}>
                    <button 
                      type="button"
                      className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                      onClick={() => onSelectTab && onSelectTab('users')}
                    >
                      <Users size={14} /> User Roster
                    </button>
                  </li>
                )}

                <li style={{ flexShrink: 0 }}>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('timetable')}
                  >
                    <Calendar size={14} /> Timetable
                  </button>
                </li>
                <li style={{ flexShrink: 0 }}>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'agent_runs' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('agent_runs')}
                  >
                    <Cpu size={14} /> Telemetry
                  </button>
                </li>
              </>
            )}

            {/* Contact Support Link */}
            <li style={{ flexShrink: 0 }}>
              <button 
                type="button"
                className={`nav-item ${activeTab === 'contact' ? 'active' : ''}`}
                onClick={() => onSelectTab && onSelectTab('contact')}
              >
                <Phone size={14} /> Contact Desk
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Right User Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
        {/* Notifications Center Trigger */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('notifications')}
          className={`btn btn-sm ${activeTab === 'notifications' ? 'btn-primary' : 'btn-ghost'}`}
          title="Operations Notification Center"
          style={{
            position: 'relative',
            padding: '0.35rem 0.55rem',
            borderRadius: 'var(--radius-full)',
            border: activeTab === 'notifications' ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}
        >
          <Bell size={14} />
          {emergencyCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--status-danger)',
              color: '#FFFFFF',
              fontSize: '0.65rem',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 2px'
            }}>
              {emergencyCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab('profile')}
          className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
          title="Edit Profile & Account Settings"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.45rem', 
            padding: '0.28rem 0.55rem',
            borderRadius: 'var(--radius-full)',
            border: activeTab === 'profile' ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)',
            whiteSpace: 'nowrap'
          }}
        >
          {currentUser.avatar_url ? (
            <img 
              src={currentUser.avatar_url} 
              alt={currentUser.full_name}
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1px solid var(--color-primary)'
              }}
            />
          ) : (
            <div style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.74rem',
              fontWeight: 800
            }}>
              {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
          <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {currentUser.full_name.split(' ')[0]}
            </div>
            <div style={{ fontSize: '0.64rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
              {currentUser.role.replace('_', ' ')}
            </div>
          </div>
        </button>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onLogout}
          title="Sign Out"
          style={{ padding: '0.32rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
        >
          <LogOut size={13} />
          <span style={{ fontSize: '0.78rem' }}>Sign Out</span>
        </button>
      </div>
    </header>
  );
};

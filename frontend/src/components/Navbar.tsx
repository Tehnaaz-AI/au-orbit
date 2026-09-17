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
  User as UserIcon
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
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeTab = 'dashboard',
  onSelectTab,
  onLogout,
  onSignIn,
  onGetStarted,
  activeIncidentsCount = 0,
  emergencyCount = 0
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

  // 2. Authenticated Role-Specific Navbar (About link is strictly in Footer only)
  const isStudent = currentUser.role === 'STUDENT';
  const isFaculty = currentUser.role === 'FACULTY';
  const isTechnician = currentUser.role === 'TECHNICIAN';
  const isOpsHead = currentUser.role === 'OPERATIONAL_HEAD';
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = ['ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN', 'OPERATIONAL_HEAD'].includes(currentUser.role);

  return (
    <header className="navbar">
      {/* Brand & Canonical Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
        <a 
          href="/" 
          className="navbar-brand" 
          onClick={(e) => { 
            e.preventDefault(); 
            if (onSelectTab) onSelectTab('dashboard'); 
          }}
        >
          <img src="/logo.png" alt="AUOrbit" style={{ height: 30, objectFit: 'contain' }} />
        </a>

        <nav aria-label="Role Navigation">
          <ul className="nav-links">
            {/* Overview / Dashboard (All Roles) */}
            <li>
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
              <li>
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
              <li>
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
              <li>
                <button 
                  type="button"
                  className={`nav-item ${activeTab === 'work_orders' ? 'active' : ''}`}
                  onClick={() => onSelectTab && onSelectTab('work_orders')}
                >
                  <Wrench size={14} /> Assigned Work Queue
                </button>
              </li>
            )}

            {/* Admin / Super Admin / Ops Head: Canonical Operations Tabs */}
            {isAdmin && (
              <>
                <li>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('incidents')}
                  >
                    <ClipboardList size={14} /> Incidents
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'work_orders' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('work_orders')}
                  >
                    <Wrench size={14} /> Work Orders
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'resources' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('resources')}
                  >
                    <Building2 size={14} /> Campus Spaces
                  </button>
                </li>

                {(isSuperAdmin || isOpsHead) && (
                  <li>
                    <button 
                      type="button"
                      className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
                      onClick={() => onSelectTab && onSelectTab('users')}
                    >
                      <Users size={14} /> User Roster
                    </button>
                  </li>
                )}

                <li>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('timetable')}
                  >
                    <Calendar size={14} /> Timetable
                  </button>
                </li>
                <li>
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
          </ul>
        </nav>
      </div>

      {/* Right User Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {activeIncidentsCount > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
              {activeIncidentsCount} Active
            </span>
            {emergencyCount > 0 && (
              <span className="badge badge-danger" style={{ fontSize: '0.75rem' }}>
                {emergencyCount} Urgent
              </span>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab('profile')}
            className={`btn btn-sm ${activeTab === 'profile' ? 'btn-primary' : 'btn-ghost'}`}
            title="Edit Profile & Account Settings"
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.45rem', 
              padding: '0.3rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              border: activeTab === 'profile' ? '1px solid var(--color-primary)' : '1px solid var(--border-subtle)'
            }}
          >
            <div style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.72rem',
              fontWeight: 800
            }}>
              {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ textAlign: 'left', lineHeight: 1.15 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {currentUser.full_name.split(' ')[0]}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--color-primary-dark)', fontWeight: 600 }}>
                {currentUser.role.replace('_', ' ')}
              </div>
            </div>
          </button>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onLogout}
            title="Sign Out"
            style={{ padding: '0.35rem 0.55rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
          >
            <LogOut size={13} />
            <span style={{ fontSize: '0.78rem' }}>Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Role, User } from '../types';
import { 
  LogOut, 
  Activity, 
  Zap,
  LayoutDashboard,
  ClipboardList,
  Wrench,
  Calendar,
  Layers,
  PlusCircle,
  Building2
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
          <div className="navbar-brand-mark">AU</div>
          <span>AUOrbit</span>
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
          <button 
            type="button"
            className="btn btn-secondary btn-sm" 
            onClick={onSignIn}
          >
            Sign In
          </button>
          <button 
            type="button"
            className="btn btn-primary btn-sm" 
            onClick={onGetStarted}
          >
            Get Started
          </button>
        </div>
      </header>
    );
  }

  // 2. Authenticated Role-Specific Navbar
  const roleDisplayNames: Record<Role, string> = {
    STUDENT: 'Student',
    FACULTY: 'Faculty Member',
    TECHNICIAN: 'Operational Specialist',
    ADMIN: 'Administrator',
    UNIVERSITY_ADMIN: 'University Admin',
    SUPER_ADMIN: 'Super Administrator'
  };

  const isStudent = currentUser.role === 'STUDENT';
  const isFaculty = currentUser.role === 'FACULTY';
  const isTechnician = currentUser.role === 'TECHNICIAN';
  const isAdmin = ['ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  return (
    <header className="navbar">
      {/* Brand & Role-Specific Navigation Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        <a 
          href="/" 
          className="navbar-brand" 
          onClick={(e) => { 
            e.preventDefault(); 
            if (onSelectTab) onSelectTab('dashboard'); 
          }}
        >
          <div className="navbar-brand-mark">AU</div>
          <span>AUOrbit</span>
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

            {/* Student & Faculty: My Issues */}
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

            {/* Student & Faculty: Report Issue */}
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

            {/* Technician: Assigned Work */}
            {isTechnician && (
              <li>
                <button 
                  type="button"
                  className={`nav-item ${activeTab === 'work_orders' ? 'active' : ''}`}
                  onClick={() => onSelectTab && onSelectTab('work_orders')}
                >
                  <Wrench size={14} /> Assigned Work
                </button>
              </li>
            )}

            {/* Admin / Super Admin: Full Operational Navigation */}
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
                    <Building2 size={14} /> Campus Resources
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'timetable' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('timetable')}
                  >
                    <Calendar size={14} /> Reference Timetable
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    className={`nav-item ${activeTab === 'agent_runs' ? 'active' : ''}`}
                    onClick={() => onSelectTab && onSelectTab('agent_runs')}
                  >
                    <Layers size={14} /> Agent Telemetry
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>

      {/* Right Controls & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        
        {/* Live Operational Counters */}
        {emergencyCount > 0 && (
          <span className="badge badge-emergency">
            <Zap size={11} /> {emergencyCount} Emergency
          </span>
        )}
        <span className="badge badge-neutral">
          <Activity size={11} color="var(--color-primary)" /> {activeIncidentsCount} Active
        </span>

        {/* User Profile Badge */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.55rem',
          padding: '0.3rem 0.65rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ 
            width: 24, 
            height: 24, 
            borderRadius: '50%', 
            background: 'var(--color-primary)', 
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.72rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {currentUser.full_name}
            </span>
            <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
              {roleDisplayNames[currentUser.role] || currentUser.role}
            </span>
          </div>

          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={onLogout}
            title="Sign Out"
            style={{ padding: '0.15rem 0.35rem', color: 'var(--status-error-text)' }}
          >
            <LogOut size={13} />
          </button>
        </div>

      </div>
    </header>
  );
};

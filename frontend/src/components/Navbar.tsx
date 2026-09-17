import React from 'react';
import { motion } from 'framer-motion';
import { Role, User } from '../types';
import { 
  LogOut, 
  Activity, 
  Zap,
  LayoutDashboard,
  AlertCircle,
  Wrench,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck
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
  currentRole,
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

  // Public Navbar
  if (!currentUser) {
    return (
      <header className="navbar" style={{ backdropFilter: 'blur(12px)', background: 'rgba(251, 249, 243, 0.92)' }}>
        <a 
          href="/" 
          className="navbar-brand" 
          onClick={(e) => { 
            e.preventDefault(); 
            if (onSelectTab) onSelectTab('landing'); 
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          <motion.div whileHover={{ rotate: 5, scale: 1.05 }} className="navbar-brand-mark">AU</motion.div>
          <span>AUOrbit</span>
        </a>

        <nav>
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <motion.button 
            type="button"
            className="btn btn-secondary btn-sm" 
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={onSignIn}
            style={{ padding: '0.45rem 1rem' }}
          >
            Sign In
          </motion.button>
          <motion.button 
            type="button"
            className="btn btn-primary btn-sm" 
            whileHover={{ scale: 1.04, y: -1, boxShadow: '0 6px 14px rgba(227, 83, 54, 0.25)' }}
            whileTap={{ scale: 0.96 }}
            onClick={onGetStarted}
            style={{ padding: '0.45rem 1rem' }}
          >
            Get Started <ArrowRight size={14} />
          </motion.button>
        </div>
      </header>
    );
  }

  // Authenticated Navbar
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
      {/* Brand */}
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

        {/* Role-Specific Navigation Tabs */}
        <nav>
          <ul className="nav-links">
            <li>
              <button 
                type="button"
                className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => onSelectTab && onSelectTab('dashboard')}
              >
                <LayoutDashboard size={15} /> Dashboard
              </button>
            </li>

            {/* Incidents Tab for Student, Faculty, Admin */}
            {(isStudent || isFaculty || isAdmin) && (
              <li>
                <button 
                  type="button"
                  className={`nav-item ${activeTab === 'incidents' ? 'active' : ''}`}
                  onClick={() => onSelectTab && onSelectTab('incidents')}
                >
                  <AlertCircle size={15} /> {isStudent ? 'My Incidents' : isFaculty ? 'Department Incidents' : 'Incidents'}
                </button>
              </li>
            )}

            {/* Work Orders / Queue Tab for Technician & Admin */}
            {(isTechnician || isAdmin) && (
              <li>
                <button 
                  type="button"
                  className={`nav-item ${activeTab === 'work_orders' ? 'active' : ''}`}
                  onClick={() => onSelectTab && onSelectTab('work_orders')}
                >
                  <Wrench size={15} /> {isTechnician ? 'My Work Orders' : 'Work Orders'}
                </button>
              </li>
            )}

            {/* Campus Resources & Reference Timetable for Faculty & Admin */}
            {(isFaculty || isAdmin) && (
              <li>
                <button 
                  type="button"
                  className={`nav-item ${activeTab === 'resources' ? 'active' : ''}`}
                  onClick={() => onSelectTab && onSelectTab('resources')}
                >
                  <Calendar size={15} /> Resources & Timetable
                </button>
              </li>
            )}

            {/* Agent Runs & Governance for Admin */}
            {isAdmin && (
              <li>
                <button 
                  type="button"
                  className={`nav-item ${activeTab === 'agent_runs' ? 'active' : ''}`}
                  onClick={() => onSelectTab && onSelectTab('agent_runs')}
                >
                  <Layers size={15} /> Agent Runs
                </button>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* Right Controls & User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        
        {/* Live Operational Counters */}
        {emergencyCount > 0 && (
          <span className="badge badge-emergency" style={{ fontSize: '0.72rem' }}>
            <Zap size={12} /> {emergencyCount} Emergency
          </span>
        )}
        <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
          <Activity size={12} color="var(--color-primary)" /> {activeIncidentsCount} Active
        </span>

        {/* User Profile Badge */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.65rem',
          padding: '0.35rem 0.75rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)'
        }}>
          <div style={{ 
            width: 26, 
            height: 26, 
            borderRadius: '50%', 
            background: 'var(--color-primary)', 
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {currentUser.full_name}
            </span>
            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {roleDisplayNames[currentUser.role] || currentUser.role}
            </span>
          </div>

          <button
            type="button"
            className="btn-ghost btn-sm"
            onClick={onLogout}
            title="Sign Out"
            style={{ padding: '0.2rem', color: 'var(--status-error-text)', marginLeft: '0.25rem' }}
          >
            <LogOut size={14} />
          </button>
        </div>

      </div>
    </header>
  );
};

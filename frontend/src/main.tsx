import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { api, getStoredToken, getStoredUser, setStoredToken, setStoredUser } from './api';
import { 
  Incident, 
  Technician, 
  Room, 
  Equipment, 
  TimetableItem, 
  AnalyticsMetrics, 
  User 
} from './types';

// Components
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { LoginScreen } from './components/LoginScreen';
import { Dashboard } from './components/Dashboard';
import { StudentPortal } from './components/StudentPortal';
import { FacultyPortal } from './components/FacultyPortal';
import { TechnicianPortal } from './components/TechnicianPortal';
import { IncidentList } from './components/incidents/IncidentList';
import { WorkOrderList } from './components/workorders/WorkOrderList';
import { CampusHierarchyExplorer } from './components/spaces/CampusHierarchyExplorer';
import { UserManagementView } from './components/admin/UserManagementView';
import { TimetableManager } from './components/timetable/TimetableManager';
import { AgentExecutionTracker } from './components/AgentExecutionTracker';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { AboutPage } from './components/pages/AboutPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { ContactPage } from './components/pages/ContactPage';
import { NotificationsPage } from './components/pages/NotificationsPage';
import { NotFoundPage } from './components/pages/NotFoundPage';
import { Footer } from './components/Footer';
import { OrbitBackground } from './components/OrbitBackground';

// Icons
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import './style.css';

interface ToastAlert {
  message: string;
  type: 'success' | 'error';
}

export function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [showAuthScreen, setShowAuthScreen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Active Theme State (Default Light Mode as requested)
  const [theme, setTheme] = useState<'light'>('light');

  useEffect(() => {
    document.documentElement.removeAttribute('data-theme');
    localStorage.removeItem('auorbit_theme');
  }, []);

  // Application Data State
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [timetable, setTimetable] = useState<TimetableItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsMetrics | null>(null);

  // Selected Incident for Detail Modal
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  // Toast Notification State
  const [toast, setToast] = useState<ToastAlert | null>(null);

  const showError = useCallback((msg: string) => {
    setToast({ message: msg, type: 'error' });
  }, []);

  const showSuccess = useCallback((msg: string) => {
    setToast({ message: msg, type: 'success' });
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Validate stored session on mount
  useEffect(() => {
    const token = getStoredToken();
    if (token) {
      api.getMe()
        .then(u => {
          setCurrentUser(u);
          setStoredUser(u);
        })
        .catch(() => {
          setStoredToken(null);
          setStoredUser(null);
          setCurrentUser(null);
        });
    }
  }, []);

  // Refresh All Application Data
  const refreshAll = useCallback(async () => {
    if (!currentUser) return;
    try {
      const [incRes, techRes, roomRes, eqRes, ttRes, anRes] = await Promise.allSettled([
        api.getIncidents(),
        api.getTechnicians(),
        api.getRooms(),
        api.getEquipment(),
        api.getTimetable(),
        api.getAnalytics()
      ]);

      if (incRes.status === 'fulfilled') setIncidents(incRes.value);
      if (techRes.status === 'fulfilled') setTechnicians(techRes.value);
      if (roomRes.status === 'fulfilled') setRooms(roomRes.value);
      if (eqRes.status === 'fulfilled') setEquipment(eqRes.value);
      if (ttRes.status === 'fulfilled') setTimetable(ttRes.value);
      if (anRes.status === 'fulfilled') setAnalytics(anRes.value);
    } catch (err: any) {
      console.error('Data refresh error:', err.message);
    }
  }, [currentUser]);

  // Periodic background refresh for operational awareness
  useEffect(() => {
    if (!currentUser) return;
    refreshAll();
    const interval = setInterval(refreshAll, 6000);
    return () => clearInterval(interval);
  }, [currentUser, refreshAll]);

  const activeCount = incidents.filter(i => 
    !['RESOLVED', 'CLOSED'].includes(i.status)
  ).length;

  const emergencyCount = incidents.filter(i => 
    ['EMERGENCY', 'HIGH'].includes(i.priority) && !['RESOLVED', 'CLOSED'].includes(i.status)
  ).length;

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setShowAuthScreen(false);
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    setStoredToken(null);
    setStoredUser(null);
    setCurrentUser(null);
    setShowAuthScreen(false);
    setActiveTab('dashboard');
    showSuccess('You have been securely signed out.');
  };

  const openAuth = (mode: 'LOGIN' | 'REGISTER') => {
    setAuthMode(mode);
    setShowAuthScreen(true);
  };

  // 1. PUBLIC VISITOR EXPERIENCE
  // Unauthenticated Public Flow
  if (!currentUser) {
    const handlePublicNavigate = (tab: string) => {
      setShowAuthScreen(false);
      setActiveTab(tab);
    };

    if (showAuthScreen) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', position: 'relative' }}>
          <OrbitBackground />
          <Navbar
            currentUser={null}
            onSelectTab={handlePublicNavigate}
            onSignIn={() => openAuth('LOGIN')}
            onGetStarted={() => openAuth('REGISTER')}
          />

          {toast && (
            <div className="toast-bar" style={{ borderColor: toast.type === 'error' ? 'var(--status-danger-border)' : 'var(--primary-dark)' }}>
              {toast.type === 'error' ? <AlertCircle size={15} color="var(--status-danger)" /> : <CheckCircle size={15} color="var(--status-success)" />}
              <span style={{ fontSize: '0.84rem' }}>{toast.message}</span>
              <button className="btn-ghost btn-sm" onClick={() => setToast(null)} style={{ padding: 2, color: '#fff' }}><X size={13} /></button>
            </div>
          )}

          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem', position: 'relative', zIndex: 1 }}>
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              initialMode={authMode}
              onError={showError}
              onSuccess={showSuccess}
              onBackToLanding={() => setShowAuthScreen(false)}
            />
          </main>

          <Footer
            onNavigate={handlePublicNavigate}
            onSignIn={() => openAuth('LOGIN')}
            onGetStarted={() => openAuth('REGISTER')}
          />
        </div>
      );
    }

    if (activeTab === 'about') {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
          <Navbar
            currentUser={null}
            activeTab="about"
            onSelectTab={handlePublicNavigate}
            onSignIn={() => openAuth('LOGIN')}
            onGetStarted={() => openAuth('REGISTER')}
          />
          <main style={{ flex: 1 }}>
            <AboutPage onBackToApp={() => handlePublicNavigate('landing')} />
          </main>
          <Footer
            onNavigate={handlePublicNavigate}
            onSignIn={() => openAuth('LOGIN')}
            onGetStarted={() => openAuth('REGISTER')}
          />
        </div>
      );
    }

    if (activeTab === 'contact') {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
          <Navbar
            currentUser={null}
            activeTab="contact"
            onSelectTab={handlePublicNavigate}
            onSignIn={() => openAuth('LOGIN')}
            onGetStarted={() => openAuth('REGISTER')}
          />
          <main style={{ flex: 1 }}>
            <ContactPage 
              onBackToApp={() => handlePublicNavigate('landing')} 
              onNavigateToLogin={() => openAuth('LOGIN')} 
            />
          </main>
          <Footer
            onNavigate={handlePublicNavigate}
            onSignIn={() => openAuth('LOGIN')}
            onGetStarted={() => openAuth('REGISTER')}
          />
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', position: 'relative' }}>
        <OrbitBackground />
        <Navbar
          currentUser={null}
          activeTab={activeTab}
          onSelectTab={handlePublicNavigate}
          onSignIn={() => openAuth('LOGIN')}
          onGetStarted={() => openAuth('REGISTER')}
        />

        {toast && (
          <div className="toast-bar" style={{ borderColor: toast.type === 'error' ? 'var(--status-danger-border)' : 'var(--primary-dark)' }}>
            {toast.type === 'error' ? <AlertCircle size={15} color="var(--status-danger)" /> : <CheckCircle size={15} color="var(--status-success)" />}
            <span style={{ fontSize: '0.84rem' }}>{toast.message}</span>
            <button className="btn-ghost btn-sm" onClick={() => setToast(null)} style={{ padding: 2, color: '#fff' }}><X size={13} /></button>
          </div>
        )}

        <main style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <LandingPage
            onGetStarted={() => openAuth('REGISTER')}
            onSignIn={() => openAuth('LOGIN')}
            onTestScenario={() => openAuth('LOGIN')}
          />
        </main>

        <Footer
          onNavigate={handlePublicNavigate}
          onSignIn={() => openAuth('LOGIN')}
          onGetStarted={() => openAuth('REGISTER')}
        />
      </div>
    );
  }

  // 2. AUTHENTICATED USER EXPERIENCE
  const isTechnician = currentUser.role === 'TECHNICIAN';
  const isStudent = currentUser.role === 'STUDENT';
  const isFaculty = currentUser.role === 'FACULTY';
  const isOpsHead = currentUser.role === 'OPERATIONAL_HEAD';
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = ['ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN', 'OPERATIONAL_HEAD'].includes(currentUser.role);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', position: 'relative' }}>
      <OrbitBackground />
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        currentRole={currentUser.role}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={handleLogout}
        activeIncidentsCount={activeCount}
        emergencyCount={emergencyCount}
      />

      {/* Main App Container */}
      <main className="app-container" style={{ flex: 1 }}>
        
        {/* Toast Alert Bar */}
        {toast && (
          <div className="toast-bar" style={{ borderColor: toast.type === 'error' ? 'var(--status-danger-border)' : 'var(--primary-dark)' }}>
            {toast.type === 'error' ? <AlertCircle size={15} color="var(--status-danger)" /> : <CheckCircle size={15} color="var(--status-success)" />}
            <span style={{ fontSize: '0.84rem' }}>{toast.message}</span>
            <button className="btn-ghost btn-sm" onClick={() => setToast(null)} style={{ padding: 2, color: '#fff' }}><X size={13} /></button>
          </div>
        )}

        {/* Animated Tab Route Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ width: '100%' }}
          >
            {/* Tab: ABOUT AUORBIT */}
            {activeTab === 'about' && (
              <AboutPage onBackToApp={() => setActiveTab('dashboard')} />
            )}

            {/* Tab: CONTACT HELPDESK */}
            {activeTab === 'contact' && (
              <ContactPage onBackToApp={() => setActiveTab('dashboard')} />
            )}

            {/* Tab 1: OVERVIEW / DASHBOARD */}
            {activeTab === 'dashboard' && (
              isTechnician ? (
                <TechnicianPortal
                  currentUser={currentUser}
                  incidents={incidents}
                  technicians={technicians}
                  activeTab="overview"
                  onNavigateTab={setActiveTab}
                  onSelectIncident={setSelectedIncident}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              ) : (
                <Dashboard
                  currentUser={currentUser}
                  incidents={incidents}
                  analytics={analytics}
                  onSelectIncident={setSelectedIncident}
                  onNavigateTab={setActiveTab}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              )
            )}

            {/* Tab 2: MY ISSUES / CLASSROOM ISSUES */}
            {activeTab === 'my_issues' && (
              isStudent ? (
                <StudentPortal
                  currentUser={currentUser}
                  incidents={incidents}
                  rooms={rooms}
                  activeTab="my_issues"
                  onSelectIncident={setSelectedIncident}
                  onNavigateTab={setActiveTab}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              ) : isFaculty ? (
                <FacultyPortal
                  currentUser={currentUser}
                  incidents={incidents}
                  timetable={timetable}
                  rooms={rooms}
                  activeTab="my_issues"
                  onSelectIncident={setSelectedIncident}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              ) : (
                <Dashboard
                  currentUser={currentUser}
                  incidents={incidents}
                  analytics={analytics}
                  onSelectIncident={setSelectedIncident}
                  onNavigateTab={setActiveTab}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              )
            )}

            {/* Tab 3: REPORT ISSUE (Action Form) */}
            {activeTab === 'report_issue' && (
              isStudent ? (
                <StudentPortal
                  currentUser={currentUser}
                  incidents={incidents}
                  rooms={rooms}
                  activeTab="report_issue"
                  onSelectIncident={setSelectedIncident}
                  onNavigateTab={setActiveTab}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              ) : isFaculty ? (
                <FacultyPortal
                  currentUser={currentUser}
                  incidents={incidents}
                  timetable={timetable}
                  rooms={rooms}
                  activeTab="report_issue"
                  onSelectIncident={setSelectedIncident}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              ) : (
                <Dashboard
                  currentUser={currentUser}
                  incidents={incidents}
                  analytics={analytics}
                  onSelectIncident={setSelectedIncident}
                  onNavigateTab={setActiveTab}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              )
            )}

            {/* Tab 4: INCIDENTS (Dedicated Full Page) */}
            {activeTab === 'incidents' && isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <IncidentList
                  incidents={incidents}
                  onSelectIncident={setSelectedIncident}
                  title="Campus Incident Stream"
                  subtitle="All reported issues, autonomous triage priorities, and multi-agent dispatch states."
                  showFilters={true}
                />
              </div>
            )}

            {/* Tab 5: WORK ORDERS (Dedicated Full Page) */}
            {activeTab === 'work_orders' && (
              isTechnician ? (
                <TechnicianPortal
                  currentUser={currentUser}
                  incidents={incidents}
                  technicians={technicians}
                  activeTab="work_orders"
                  onNavigateTab={setActiveTab}
                  onSelectIncident={setSelectedIncident}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <WorkOrderList
                    incidents={incidents}
                    currentUser={currentUser}
                    technicians={technicians}
                    onSelectIncident={setSelectedIncident}
                    onRefresh={refreshAll}
                    onError={showError}
                    onSuccess={showSuccess}
                    title="All Dispatched Work Orders"
                    subtitle="Maintenance work orders assigned to campus specialists and technicians. Reassignment supported for Super Admins & Operations Heads."
                  />
                </div>
              )
            )}

            {/* Tab 6: CAMPUS RESOURCES & SPACES (Dedicated Full Page) */}
            {activeTab === 'resources' && isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <CampusHierarchyExplorer
                  rooms={rooms}
                  equipment={equipment}
                  currentUser={currentUser}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              </div>
            )}

            {/* Tab 7: USER ROSTER & RBAC MANAGEMENT (Dedicated Full Page) */}
            {activeTab === 'users' && (isSuperAdmin || isOpsHead || isAdmin) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <UserManagementView
                  currentUser={currentUser}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              </div>
            )}

            {/* Tab 8: REFERENCE TIMETABLE (Dedicated Full Page) */}
            {activeTab === 'timetable' && isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <TimetableManager
                  timetable={timetable}
                  rooms={rooms}
                  currentUser={currentUser}
                  onRefresh={refreshAll}
                  onError={showError}
                  onSuccess={showSuccess}
                />
              </div>
            )}

            {/* Tab 9: AGENT TELEMETRY (Dedicated Full Page) */}
            {activeTab === 'agent_runs' && isAdmin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {incidents.length > 0 ? (
                  <AgentExecutionTracker
                    incident={selectedIncident || incidents[0]}
                  />
                ) : (
                  <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>No Active Telemetry Streams</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Report a campus incident to inspect live 9-agent execution graphs, decision trees, and dispatch logs.</p>
                  </div>
                )}
              </div>
            )}

            {/* Tab 10: USER PROFILE & SECURITY */}
            {activeTab === 'profile' && (
              <ProfilePage
                currentUser={currentUser}
                onUpdateUser={setCurrentUser}
                onBackToApp={() => setActiveTab('dashboard')}
                onError={showError}
                onSuccess={showSuccess}
              />
            )}

            {/* Tab 11: OPERATIONS NOTIFICATIONS CENTER */}
            {activeTab === 'notifications' && (
              <NotificationsPage
                currentUser={currentUser}
                incidents={incidents}
                onSelectIncident={setSelectedIncident}
                onNavigateTab={setActiveTab}
                onRefresh={refreshAll}
              />
            )}

            {/* Fallback 404 for unknown tab */}
            {!['about', 'contact', 'dashboard', 'my_issues', 'report_issue', 'incidents', 'work_orders', 'resources', 'users', 'timetable', 'agent_runs', 'profile', 'notifications'].includes(activeTab) && (
              <NotFoundPage onBackToDashboard={() => setActiveTab('dashboard')} onNavigateTab={setActiveTab} />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {/* Incident Detail Modal */}
      {selectedIncident && (
        <IncidentDetailModal
          incident={selectedIncident}
          currentUser={currentUser}
          onClose={() => setSelectedIncident(null)}
          onRefresh={refreshAll}
          onError={showError}
          onSuccess={showSuccess}
        />
      )}

      {/* Footer */}
      <Footer
        onNavigate={setActiveTab}
        onSignIn={() => {}}
        onGetStarted={() => {}}
      />

    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<App />);
}

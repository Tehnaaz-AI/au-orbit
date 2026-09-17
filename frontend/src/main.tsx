import React, { useState, useEffect, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
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
import { AdminConsole } from './components/AdminConsole';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { AboutPage } from './components/pages/AboutPage';
import { ProfilePage } from './components/pages/ProfilePage';
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
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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

  // 1. PUBLIC VISITOR EXPERIENCE
  if (!currentUser) {
    if (activeTab === 'about') {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
          <Navbar
            currentUser={null}
            activeTab="about"
            onSelectTab={setActiveTab}
            onSignIn={() => { setShowAuthScreen(true); setActiveTab('dashboard'); }}
            onGetStarted={() => { setShowAuthScreen(true); setActiveTab('dashboard'); }}
          />
          <main style={{ flex: 1 }}>
            <AboutPage onBackToApp={() => setActiveTab('landing')} />
          </main>
          <Footer
            onNavigate={setActiveTab}
            onSignIn={() => { setShowAuthScreen(true); setActiveTab('dashboard'); }}
            onGetStarted={() => { setShowAuthScreen(true); setActiveTab('dashboard'); }}
          />
        </div>
      );
    }

    if (showAuthScreen) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)', position: 'relative' }}>
          <OrbitBackground />
          <Navbar
            currentUser={null}
            onSelectTab={() => setShowAuthScreen(false)}
            onSignIn={() => setShowAuthScreen(true)}
            onGetStarted={() => setShowAuthScreen(true)}
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
              onError={showError}
              onSuccess={showSuccess}
              onBackToLanding={() => setShowAuthScreen(false)}
            />
          </main>

          <Footer
            onNavigate={setActiveTab}
            onSignIn={() => setShowAuthScreen(true)}
            onGetStarted={() => setShowAuthScreen(true)}
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
          onSelectTab={setActiveTab}
          onSignIn={() => setShowAuthScreen(true)}
          onGetStarted={() => setShowAuthScreen(true)}
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
            onGetStarted={() => setShowAuthScreen(true)}
            onSignIn={() => setShowAuthScreen(true)}
            onTestScenario={() => setShowAuthScreen(true)}
          />
        </main>

        <Footer
          onNavigate={setActiveTab}
          onSignIn={() => setShowAuthScreen(true)}
          onGetStarted={() => setShowAuthScreen(true)}
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

        {/* Tab: ABOUT AUORBIT */}
        {activeTab === 'about' && (
          <AboutPage onBackToApp={() => setActiveTab('dashboard')} />
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

        {/* Tab 2: MY ISSUES / CLASSROOM ISSUES (Data View) */}
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

        {/* Tab 3: REPORT ISSUE (Action Form Only) */}
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

        {/* Tab 4: INCIDENTS (Admin & Ops Oversight) */}
        {activeTab === 'incidents' && isAdmin && (
          <AdminConsole
            currentUser={currentUser}
            incidents={incidents}
            technicians={technicians}
            rooms={rooms}
            equipment={equipment}
            timetable={timetable}
            analytics={analytics}
            activeSubTab="incidents"
            onSelectIncident={setSelectedIncident}
            onRefresh={refreshAll}
            onError={showError}
            onSuccess={showSuccess}
          />
        )}

        {/* Tab 5: WORK ORDERS (Technician & Admin) */}
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
            <AdminConsole
              currentUser={currentUser}
              incidents={incidents}
              technicians={technicians}
              rooms={rooms}
              equipment={equipment}
              timetable={timetable}
              analytics={analytics}
              activeSubTab="work_orders"
              onSelectIncident={setSelectedIncident}
              onRefresh={refreshAll}
              onError={showError}
              onSuccess={showSuccess}
            />
          )
        )}

        {/* Tab 6: CAMPUS RESOURCES & SPACES */}
        {activeTab === 'resources' && isAdmin && (
          <AdminConsole
            currentUser={currentUser}
            incidents={incidents}
            technicians={technicians}
            rooms={rooms}
            equipment={equipment}
            timetable={timetable}
            analytics={analytics}
            activeSubTab="resources"
            onSelectIncident={setSelectedIncident}
            onRefresh={refreshAll}
            onError={showError}
            onSuccess={showSuccess}
          />
        )}

        {/* Tab 7: USER ROSTER & RBAC MANAGEMENT */}
        {activeTab === 'users' && (isSuperAdmin || isOpsHead || isAdmin) && (
          <AdminConsole
            currentUser={currentUser}
            incidents={incidents}
            technicians={technicians}
            rooms={rooms}
            equipment={equipment}
            timetable={timetable}
            analytics={analytics}
            activeSubTab="users"
            onSelectIncident={setSelectedIncident}
            onRefresh={refreshAll}
            onError={showError}
            onSuccess={showSuccess}
          />
        )}

        {/* Tab 8: REFERENCE TIMETABLE */}
        {activeTab === 'timetable' && isAdmin && (
          <AdminConsole
            currentUser={currentUser}
            incidents={incidents}
            technicians={technicians}
            rooms={rooms}
            equipment={equipment}
            timetable={timetable}
            analytics={analytics}
            activeSubTab="timetable"
            onSelectIncident={setSelectedIncident}
            onRefresh={refreshAll}
            onError={showError}
            onSuccess={showSuccess}
          />
        )}

        {/* Tab 9: AGENT TELEMETRY */}
        {activeTab === 'agent_runs' && isAdmin && (
          <AdminConsole
            currentUser={currentUser}
            incidents={incidents}
            technicians={technicians}
            rooms={rooms}
            equipment={equipment}
            timetable={timetable}
            analytics={analytics}
            activeSubTab="agent_runs"
            onSelectIncident={setSelectedIncident}
            onRefresh={refreshAll}
            onError={showError}
            onSuccess={showSuccess}
          />
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

        {/* Fallback 404 for unknown tab */}
        {!['about', 'dashboard', 'my_issues', 'report_issue', 'incidents', 'work_orders', 'resources', 'users', 'timetable', 'agent_runs', 'profile'].includes(activeTab) && (
          <NotFoundPage onBackToDashboard={() => setActiveTab('dashboard')} />
        )}

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

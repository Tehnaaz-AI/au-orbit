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
import { WorkOrdersView } from './components/WorkOrdersView';
import { ResourcesView } from './components/ResourcesView';
import { IncidentDetailModal } from './components/IncidentDetailModal';
import { Footer } from './components/Footer';

// Icons
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
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
      const timer = setTimeout(() => setToast(null), 4500);
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

  // 1. PUBLIC EXPERIENCE (Landing Page or Integrated Sign In / Register Shell)
  if (!currentUser) {
    if (showAuthScreen) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
          {/* Top Navbar */}
          <Navbar
            currentUser={null}
            onSelectTab={() => setShowAuthScreen(false)}
            onSignIn={() => setShowAuthScreen(true)}
            onGetStarted={() => setShowAuthScreen(true)}
          />

          {/* Toast Notification */}
          {toast && (
            <div className="toast-bar" style={{ borderColor: toast.type === 'error' ? 'var(--status-error-border)' : 'var(--color-primary)' }}>
              {toast.type === 'error' ? <AlertCircle size={16} color="var(--status-error-text)" /> : <CheckCircle2 size={16} color="var(--color-primary)" />}
              <span style={{ fontSize: '0.85rem' }}>{toast.message}</span>
              <button className="btn-ghost btn-sm" onClick={() => setToast(null)} style={{ padding: 2, color: '#fff' }}><X size={14} /></button>
            </div>
          )}

          {/* Integrated Auth View */}
          <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.5rem' }}>
            <LoginScreen
              onLoginSuccess={handleLoginSuccess}
              onError={showError}
              onSuccess={showSuccess}
              onBackToLanding={() => setShowAuthScreen(false)}
            />
          </main>

          {/* Consistent Footer */}
          <Footer
            onNavigate={() => setShowAuthScreen(false)}
            onSignIn={() => setShowAuthScreen(true)}
            onGetStarted={() => setShowAuthScreen(true)}
          />
        </div>
      );
    }

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
        {/* Top Navbar */}
        <Navbar
          currentUser={null}
          onSelectTab={() => setShowAuthScreen(false)}
          onSignIn={() => setShowAuthScreen(true)}
          onGetStarted={() => setShowAuthScreen(true)}
        />

        {/* Toast Notification */}
        {toast && (
          <div className="toast-bar" style={{ borderColor: toast.type === 'error' ? 'var(--status-error-border)' : 'var(--color-primary)' }}>
            {toast.type === 'error' ? <AlertCircle size={16} color="var(--status-error-text)" /> : <CheckCircle2 size={16} color="var(--color-primary)" />}
            <span style={{ fontSize: '0.85rem' }}>{toast.message}</span>
            <button className="btn-ghost btn-sm" onClick={() => setToast(null)} style={{ padding: 2, color: '#fff' }}><X size={14} /></button>
          </div>
        )}

        {/* Public Landing Page */}
        <main style={{ flex: 1 }}>
          <LandingPage
            onGetStarted={() => setShowAuthScreen(true)}
            onSignIn={() => setShowAuthScreen(true)}
            onTestScenario={() => setShowAuthScreen(true)}
          />
        </main>

        {/* Consistent Footer */}
        <Footer
          onNavigate={() => setShowAuthScreen(false)}
          onSignIn={() => setShowAuthScreen(true)}
          onGetStarted={() => setShowAuthScreen(true)}
        />
      </div>
    );
  }

  // 2. AUTHENTICATED USER EXPERIENCE (Role-Specific Operational Platform)
  const isTechnician = currentUser.role === 'TECHNICIAN';
  const isStudent = currentUser.role === 'STUDENT';
  const isFaculty = currentUser.role === 'FACULTY';
  const isAdmin = ['ADMIN', 'UNIVERSITY_ADMIN', 'SUPER_ADMIN'].includes(currentUser.role);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-page)' }}>
      
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
          <div className="toast-bar" style={{ borderColor: toast.type === 'error' ? 'var(--status-error-border)' : 'var(--color-primary)' }}>
            {toast.type === 'error' ? <AlertCircle size={16} color="var(--status-error-text)" /> : <CheckCircle2 size={16} color="var(--color-primary)" />}
            <span style={{ fontSize: '0.85rem' }}>{toast.message}</span>
            <button className="btn-ghost btn-sm" onClick={() => setToast(null)} style={{ padding: 2, color: '#fff' }}><X size={14} /></button>
          </div>
        )}

        {/* Tab 1: DASHBOARD */}
        {activeTab === 'dashboard' && (
          isTechnician ? (
            <TechnicianPortal
              currentUser={currentUser}
              incidents={incidents}
              technicians={technicians}
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
              onRefresh={refreshAll}
              onError={showError}
              onSuccess={showSuccess}
            />
          )
        )}

        {/* Tab 2: INCIDENTS */}
        {activeTab === 'incidents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                  {isStudent ? 'My Reported Incidents' : isFaculty ? 'Department & Classroom Incidents' : 'Campus Incident Oversight'}
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  {isStudent 
                    ? 'Track real-time status and agent dispatch for your submitted issue reports.' 
                    : isFaculty 
                    ? 'Classroom issues linked with active timetable schedules and verification checks.' 
                    : 'Campus-wide operational incidents managed by the autonomous multi-agent pipeline.'}
                </p>
              </div>
            </div>

            {isStudent && (
              <StudentPortal
                currentUser={currentUser}
                incidents={incidents}
                rooms={rooms}
                onRefresh={refreshAll}
                onError={showError}
                onSuccess={showSuccess}
              />
            )}

            {isFaculty && (
              <FacultyPortal
                currentUser={currentUser}
                incidents={incidents}
                timetable={timetable}
                rooms={rooms}
                onRefresh={refreshAll}
                onError={showError}
                onSuccess={showSuccess}
              />
            )}

            {isAdmin && (
              <AdminConsole
                currentUser={currentUser}
                incidents={incidents}
                technicians={technicians}
                rooms={rooms}
                equipment={equipment}
                timetable={timetable}
                analytics={analytics}
                onRefresh={refreshAll}
                onError={showError}
                onSuccess={showSuccess}
              />
            )}
          </div>
        )}

        {/* Tab 3: WORK ORDERS */}
        {activeTab === 'work_orders' && (
          isTechnician ? (
            <TechnicianPortal
              currentUser={currentUser}
              incidents={incidents}
              technicians={technicians}
              onRefresh={refreshAll}
              onError={showError}
              onSuccess={showSuccess}
            />
          ) : (
            <WorkOrdersView
              incidents={incidents}
              currentUser={currentUser}
              onSelectIncident={setSelectedIncident}
              onRefresh={refreshAll}
              onError={showError}
              onSuccess={showSuccess}
            />
          )
        )}

        {/* Tab 4: RESOURCES & TIMETABLE */}
        {activeTab === 'resources' && (
          <ResourcesView
            rooms={rooms}
            equipment={equipment}
            timetable={timetable}
          />
        )}

        {/* Tab 5: AGENT RUNS */}
        {activeTab === 'agent_runs' && isAdmin && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem', color: 'var(--text-main)' }}>
                Agent Execution Runs & Telemetry
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Multi-agent telemetry, replanning correlation, and real-time execution histories.
              </p>
            </div>

            <AdminConsole
              currentUser={currentUser}
              incidents={incidents}
              technicians={technicians}
              rooms={rooms}
              equipment={equipment}
              timetable={timetable}
              analytics={analytics}
              onRefresh={refreshAll}
              onError={showError}
              onSuccess={showSuccess}
            />
          </div>
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

      {/* Consistent Footer */}
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

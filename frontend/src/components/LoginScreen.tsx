import React, { useState } from 'react';
import { User } from '../types';
import { api, setStoredToken, setStoredUser } from '../api';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  Shield,
  Zap,
  GraduationCap,
  BookOpen,
  Wrench,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
  onBackToLanding?: () => void;
}

const DEMO_PRESETS = [
  {
    role: 'FACULTY',
    label: 'Faculty',
    name: 'Dr. Ananya S.',
    email: 'faculty@anurag.edu.in',
    password: 'password123',
    icon: <BookOpen size={14} />,
    color: '#E35336',
    desc: 'Report classroom breakages & verify repairs'
  },
  {
    role: 'STUDENT',
    label: 'Student',
    name: 'Rahul Sharma',
    email: 'student@anurag.edu.in',
    password: 'password123',
    icon: <GraduationCap size={14} />,
    color: '#A0522D',
    desc: 'Report campus issues & track status'
  },
  {
    role: 'TECHNICIAN',
    label: 'Technician',
    name: 'Arjun Rao',
    email: 'technician@anurag.edu.in',
    password: 'password123',
    icon: <Wrench size={14} />,
    color: '#D97706',
    desc: 'Execute work orders & complete maintenance'
  },
  {
    role: 'ADMIN',
    label: 'Campus Admin',
    name: 'Operations Admin',
    email: 'admin@anurag.edu.in',
    password: 'password123',
    icon: <Shield size={14} />,
    color: '#2563EB',
    desc: 'Campus dispatch, resources & timetable'
  },
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    name: 'Platform Super Admin',
    email: 'superadmin@anurag.edu.in',
    password: 'password123',
    icon: <ShieldAlert size={14} />,
    color: '#7C3AED',
    desc: 'Cross-tenant platform administration'
  }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onError,
  onSuccess,
  onBackToLanding
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Register Form (Student / Faculty self-registration only)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [regDepartment, setRegDepartment] = useState('Department of AI');
  const [regPhone, setRegPhone] = useState('');

  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.login({ email: loginEmail.trim(), password: loginPassword });
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
      onSuccess(`Welcome back, ${res.user.full_name}!`);
    } catch (err: any) {
      onError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickLogin(email: string, pass: string) {
    setLoginEmail(email);
    setLoginPassword(pass);
    setLoading(true);
    try {
      const res = await api.login({ email: email.trim(), password: pass });
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
      onSuccess(`Authenticated as ${res.user.full_name} (${res.user.role})`);
    } catch (err: any) {
      onError(err.message || 'Quick login failed. Ensure database has initialized.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.register({
        email: regEmail.trim(),
        password: regPassword,
        full_name: regFullName.trim(),
        role: regRole,
        department: regDepartment.trim(),
        phone: regPhone.trim() || undefined
      });
      setStoredToken(res.token);
      setStoredUser(res.user);
      onLoginSuccess(res.user);
      onSuccess(`Account created for ${res.user.full_name}!`);
    } catch (err: any) {
      onError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1.5rem',
      backgroundColor: 'var(--bg-page)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        background: '#FFFFFF',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: '2.25rem',
        boxShadow: 'var(--shadow-modal)'
      }}>
        
        {/* Back to Home Link */}
        {onBackToLanding && (
          <button 
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onBackToLanding}
            style={{ marginBottom: '1.25rem', padding: '0.2rem 0.4rem', color: 'var(--text-muted)' }}
          >
            <ArrowLeft size={14} /> Back to Overview
          </button>
        )}

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div className="navbar-brand-mark" style={{ margin: '0 auto 0.75rem', width: 38, height: 38, fontSize: '1.05rem' }}>
            AU
          </div>
          <h1 style={{ fontSize: '1.45rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
            AUOrbit Operations
          </h1>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Autonomous University Operations & Dispatch System
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div style={{ 
          display: 'flex', 
          background: 'var(--bg-surface)', 
          padding: '0.25rem', 
          borderRadius: 'var(--radius-sm)', 
          marginBottom: '1.25rem',
          border: '1px solid var(--border-subtle)'
        }}>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'LOGIN' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setMode('LOGIN')}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`btn btn-sm ${mode === 'REGISTER' ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flex: 1 }}
            onClick={() => setMode('REGISTER')}
          >
            Register Account
          </button>
        </div>

        {/* SIGN IN FORM */}
        {mode === 'LOGIN' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* 1-Click Role Fill & Login */}
            <div style={{
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
              padding: '0.85rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.65rem' }}>
                <Zap size={14} color="var(--color-primary)" />
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  1-Click Role Login (Presentation Presets)
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.45rem' }}>
                {DEMO_PRESETS.map(p => (
                  <button
                    key={p.role}
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(p.email, p.password)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '0.45rem 0.6rem',
                      borderRadius: 'var(--radius-xs)',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-default)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--color-primary)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: p.color, fontWeight: 700, fontSize: '0.78rem', marginBottom: 2 }}>
                      {p.icon}
                      <span>{p.label}</span>
                    </div>
                    <span style={{ fontSize: '0.66rem', color: 'var(--text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                      {p.email}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
              <span>Or Sign In Manually</span>
              <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            </div>

            {/* Manual Form */}
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">University Email</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="faculty@anurag.edu.in"
                    required
                    style={{ paddingLeft: '2.25rem' }}
                  />
                  <Mail size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    className="form-input"
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    style={{ paddingLeft: '2.25rem', paddingRight: '2.25rem' }}
                  />
                  <Lock size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }} />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                  >
                    {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: '0.25rem' }}>
                {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
              </button>
            </form>
          </div>
        )}

        {/* REGISTRATION FORM (Student / Faculty Only) */}
        {mode === 'REGISTER' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Account Role</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button
                  type="button"
                  className={`btn btn-sm ${regRole === 'STUDENT' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRegRole('STUDENT')}
                >
                  Student
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${regRole === 'FACULTY' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setRegRole('FACULTY')}
                >
                  Faculty Member
                </button>
              </div>
              <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, display: 'block', lineHeight: 1.4 }}>
                <Shield size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 4 }} />
                Administrator and technician accounts are provisioned securely via university admin bootstrap.
              </small>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                value={regFullName}
                onChange={e => setRegFullName(e.target.value)}
                placeholder="Rahul Varma"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">University Email</label>
              <input
                type="email"
                className="form-input"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                placeholder="rahul@anurag.edu.in"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Department / Branch</label>
              <input
                type="text"
                className="form-input"
                value={regDepartment}
                onChange={e => setRegDepartment(e.target.value)}
                placeholder="Department of AI"
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Mobile Phone (Optional WhatsApp Alert)</label>
              <input
                type="tel"
                className="form-input"
                value={regPhone}
                onChange={e => setRegPhone(e.target.value)}
                placeholder="+919876543210"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showRegPassword ? 'text' : 'password'}
                  className="form-input"
                  value={regPassword}
                  onChange={e => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: '2.25rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                >
                  {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
              {loading ? 'Creating Account...' : 'Register Account'} <ArrowRight size={16} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};

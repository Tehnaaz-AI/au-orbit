import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import { api, setStoredToken, setStoredUser } from '../api';
import { 
  ArrowRight, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Zap, 
  GraduationCap, 
  BookOpen, 
  Wrench, 
  Shield, 
  ShieldAlert,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Building2
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
    email: 'faculty@anurag.edu.in',
    password: 'password123',
    icon: <BookOpen size={12} />,
    color: '#E35336'
  },
  {
    role: 'STUDENT',
    label: 'Student',
    email: 'student@anurag.edu.in',
    password: 'password123',
    icon: <GraduationCap size={12} />,
    color: '#A0522D'
  },
  {
    role: 'TECHNICIAN',
    label: 'Technician',
    email: 'technician@anurag.edu.in',
    password: 'password123',
    icon: <Wrench size={12} />,
    color: '#D97706'
  },
  {
    role: 'OPERATIONAL_HEAD',
    label: 'Ops Head',
    email: 'operations.head@anurag.edu.in',
    password: 'password123',
    icon: <Building2 size={12} />,
    color: '#059669'
  },
  {
    role: 'ADMIN',
    label: 'Admin',
    email: 'admin@anurag.edu.in',
    password: 'password123',
    icon: <Shield size={12} />,
    color: '#2563EB'
  },
  {
    role: 'SUPER_ADMIN',
    label: 'Super Admin',
    email: 'superadmin@anurag.edu.in',
    password: 'password123',
    icon: <ShieldAlert size={12} />,
    color: '#7C3AED'
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

  // Register Form
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regRole, setRegRole] = useState<'STUDENT' | 'FACULTY'>('STUDENT');
  const [regDepartment, setRegDepartment] = useState('');
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
      onSuccess(`Welcome, ${res.user.full_name}`);
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
      onSuccess(`Logged in as ${res.user.full_name}`);
    } catch (err: any) {
      onError(err.message || 'Login failed. Please check credentials.');
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
      onSuccess(`Account created for ${res.user.full_name}`);
    } catch (err: any) {
      onError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '84vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.25rem',
      width: '100%'
    }}>
      <div 
        className="auth-split-container"
        style={{
          width: '100%',
          maxWidth: '860px',
          background: '#FFFFFF',
          border: '1px solid var(--border-default)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex',
          flexWrap: 'wrap',
          position: 'relative'
        }}
      >
        
        {/* ============================================================
            LEFT HALF: DOMINANT COLOR BACKGROUND & CRISP WHITE TEXT
            ============================================================ */}
        <div 
          className="auth-left-panel"
          style={{
            flex: '1 1 360px',
            background: 'linear-gradient(145deg, #E35336 0%, #C84328 45%, #922E19 100%)',
            color: '#FFFFFF',
            padding: '2.5rem 2.25rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Ambient Glow & Orbital Ring Graphics in Left Card */}
          <div style={{
            position: 'absolute',
            top: '-80px',
            right: '-80px',
            width: '260px',
            height: '260px',
            borderRadius: '50%',
            border: '1px dashed rgba(255, 255, 255, 0.22)',
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-100px',
            left: '-60px',
            width: '320px',
            height: '320px',
            borderRadius: '50%',
            border: '1px solid rgba(255, 255, 255, 0.14)',
            pointerEvents: 'none'
          }} />

          {/* Top Brand Logo Container */}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ 
              display: 'inline-block',
              background: '#FFFFFF', 
              padding: '6px 14px', 
              borderRadius: '10px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
              marginBottom: '1.75rem'
            }}>
              <img 
                src="/logo.png" 
                alt="AUOrbit" 
                style={{ height: 28, objectFit: 'contain', display: 'block' }} 
              />
            </div>

            <h2 style={{ 
              fontSize: '1.75rem', 
              lineHeight: 1.2, 
              fontWeight: 800, 
              color: '#FFFFFF', 
              marginBottom: '0.85rem',
              fontFamily: 'var(--font-heading)'
            }}>
              Autonomous Campus Operations Platform
            </h2>

            <p style={{ 
              fontSize: '0.92rem', 
              lineHeight: 1.6, 
              color: 'rgba(255, 255, 255, 0.9)',
              marginBottom: '1.75rem'
            }}>
              Coordinating natural-language reporting, dynamic timetable context, specialist dispatch, and self-healing recovery.
            </p>

            {/* Value Highlights */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem', color: '#FFFFFF' }}>
                <CheckCircle2 size={16} color="#FFE0D3" /> Multimodal Photo & Video Issue Intake
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem', color: '#FFFFFF' }}>
                <CheckCircle2 size={16} color="#FFE0D3" /> 9-Agent Deterministic Workflow
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', fontSize: '0.84rem', color: '#FFFFFF' }}>
                <CheckCircle2 size={16} color="#FFE0D3" /> Closed-Loop Visual Verification & Replan
              </div>
            </div>
          </div>

          {/* Bottom Security / Status Footer in Left Panel */}
          <div style={{ 
            marginTop: '2rem', 
            paddingTop: '1rem', 
            borderTop: '1px solid rgba(255, 255, 255, 0.18)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.8)',
            position: 'relative', 
            zIndex: 2 
          }}>
            <span>Institutional RBAC Protected</span>
            <span style={{ fontWeight: 700 }}>v2.0</span>
          </div>

        </div>

        {/* ============================================================
            RIGHT HALF: DETAILS & AUTHENTICATION FORM CARD
            ============================================================ */}
        <div 
          className="auth-right-panel"
          style={{
            flex: '1 1 380px',
            padding: '2.25rem 2rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: '#FFFFFF'
          }}
        >
          
          {/* Top Bar with Back Button */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {mode === 'LOGIN' ? 'Sign In to Account' : 'Create New Account'}
            </div>

            {onBackToLanding && (
              <button 
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={onBackToLanding}
                style={{ padding: '0.2rem 0.45rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}
              >
                <ArrowLeft size={13} /> Back to Overview
              </button>
            )}
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
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.84rem' }}
              onClick={() => setMode('LOGIN')}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`btn btn-sm ${mode === 'REGISTER' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, padding: '0.4rem', fontSize: '0.84rem' }}
              onClick={() => setMode('REGISTER')}
            >
              Register
            </button>
          </div>

          {/* SIGN IN VIEW */}
          {mode === 'LOGIN' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              
              {/* Quick Role Fill Presets */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                padding: '0.65rem 0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.45rem' }}>
                  <Zap size={13} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1-Click Role Presets
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                  {DEMO_PRESETS.map(p => (
                    <button
                      key={p.role}
                      type="button"
                      disabled={loading}
                      onClick={() => handleQuickLogin(p.email, p.password)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.28rem',
                        padding: '0.25rem 0.55rem',
                        borderRadius: 'var(--radius-full)',
                        background: '#FFFFFF',
                        border: '1px solid var(--border-default)',
                        cursor: 'pointer',
                        fontSize: '0.74rem',
                        fontWeight: 600,
                        color: 'var(--text-main)',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.background = 'var(--color-primary-subtle)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--border-default)';
                        e.currentTarget.style.background = '#FFFFFF';
                      }}
                    >
                      <span style={{ color: p.color, display: 'flex', alignItems: 'center' }}>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Form inputs */}
              <form onSubmit={handleLogin} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>University Email</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      name="au_user_email"
                      className="form-input"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="user@anurag.edu.in"
                      required
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      style={{ paddingLeft: '2.1rem', fontSize: '0.86rem', padding: '0.5rem 0.75rem 0.5rem 2.1rem' }}
                    />
                    <Mail size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      name="au_user_pass"
                      className="form-input"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck={false}
                      style={{ paddingLeft: '2.1rem', paddingRight: '2.1rem', fontSize: '0.86rem', padding: '0.5rem 2.1rem 0.5rem 2.1rem' }}
                    />
                    <Lock size={15} color="var(--text-dim)" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }} />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                    >
                      {showLoginPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.35rem', padding: '0.6rem' }}>
                  {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={15} />
                </button>
              </form>

            </div>
          )}

          {/* REGISTER VIEW */}
          {mode === 'REGISTER' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              
              {/* 1-Click Register Presets */}
              <div style={{
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                padding: '0.55rem 0.75rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                  <Zap size={12} color="var(--color-primary)" />
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    1-Click Auto-Fill Demo
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(100 + Math.random() * 900);
                      setRegFullName(`Kavya Reddy (Student ${rand})`);
                      setRegEmail(`kavya.${rand}@anurag.edu.in`);
                      setRegRole('STUDENT');
                      setRegDepartment('Department of AI');
                      setRegPhone('+91 98765 43210');
                      setRegPassword('password123');
                    }}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-default)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'var(--text-main)'
                    }}
                  >
                    <GraduationCap size={12} color="#A0522D" /> Fill Student Demo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const rand = Math.floor(100 + Math.random() * 900);
                      setRegFullName(`Prof. Srinivas V. (${rand})`);
                      setRegEmail(`srinivas.${rand}@anurag.edu.in`);
                      setRegRole('FACULTY');
                      setRegDepartment('Department of CSE');
                      setRegPhone('+91 98456 12345');
                      setRegPassword('password123');
                    }}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      background: '#FFFFFF',
                      border: '1px solid var(--border-default)',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      color: 'var(--text-main)'
                    }}
                  >
                    <BookOpen size={12} color="#E35336" /> Fill Faculty Demo
                  </button>
                </div>
              </div>

              <form onSubmit={handleRegister} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Role</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${regRole === 'STUDENT' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setRegRole('STUDENT')}
                    style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${regRole === 'FACULTY' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setRegRole('FACULTY')}
                    style={{ padding: '0.35rem', fontSize: '0.8rem' }}
                  >
                    Faculty
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={regFullName}
                  onChange={e => setRegFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                  autoComplete="off"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>University Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={regEmail}
                  onChange={e => setRegEmail(e.target.value)}
                  placeholder="email@anurag.edu.in"
                  required
                  autoComplete="off"
                  style={{ padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Department</label>
                  <input
                    type="text"
                    className="form-input"
                    value={regDepartment}
                    onChange={e => setRegDepartment(e.target.value)}
                    placeholder="e.g. Artificial Intelligence"
                    autoComplete="off"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Phone</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+91..."
                    autoComplete="off"
                    style={{ padding: '0.45rem 0.65rem', fontSize: '0.84rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontSize: '0.8rem', marginBottom: '0.25rem' }}>Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    className="form-input"
                    value={regPassword}
                    onChange={e => setRegPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    required
                    autoComplete="new-password"
                    style={{ padding: '0.45rem 2.1rem 0.45rem 0.65rem', fontSize: '0.84rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-dim)' }}
                  >
                    {showRegPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

                <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.4rem', padding: '0.55rem' }}>
                  {loading ? 'Creating Account...' : 'Register'} <ArrowRight size={15} />
                </button>
              </form>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

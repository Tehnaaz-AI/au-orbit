import React from 'react';
import { Shield, Info, Layers, Lock, Cpu, Sparkles, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate?: (tab: string) => void;
  onSignIn?: () => void;
  onGetStarted?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onSignIn, onGetStarted }) => {
  const scrollToSection = (sectionId: string) => {
    if (onNavigate) {
      onNavigate('landing');
    }
    setTimeout(() => {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 50);
  };

  return (
    <footer style={{ 
      background: 'linear-gradient(180deg, #241A16 0%, #150F0D 100%)', 
      borderTop: '2px solid var(--color-primary)', 
      padding: '3.5rem 1.75rem 2.25rem',
      marginTop: 'auto',
      color: '#E8DED8'
    }}>
      <div style={{ maxWidth: '1120px', margin: '0 auto' }}>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '2.5rem',
          marginBottom: '2.75rem'
        }}>
          
          {/* Brand & Wordmark */}
          <div style={{ maxWidth: '340px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.85rem' }}>
              <img src="/logo.png" alt="AUOrbit" style={{ height: 34, objectFit: 'contain', background: '#FFFFFF', padding: '3px 8px', borderRadius: '6px' }} />
            </div>
            <p style={{ fontSize: '0.86rem', color: '#BCA89E', lineHeight: 1.6 }}>
              Autonomous University Operations coordinating multimodal campus maintenance, timetable awareness, controlled specialist execution, and self-healing replanning loops.
            </p>
          </div>

          {/* Product & Platform */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
              Platform Navigation
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.88rem' }}>
              <li>
                <button 
                  type="button" 
                  onClick={() => onNavigate && onNavigate('about')}
                  style={{ background: 'none', border: 'none', color: '#FF9E6C', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Info size={14} color="var(--color-primary-soft)" /> About AUOrbit System
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => scrollToSection('how-it-works')}
                  style={{ background: 'none', border: 'none', color: '#D4C5BD', cursor: 'pointer', padding: 0, font: 'inherit', transition: 'color 0.15s ease' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseOut={e => (e.currentTarget.style.color = '#D4C5BD')}
                >
                  How It Works (9-Stage Lifecycle)
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => scrollToSection('capabilities')}
                  style={{ background: 'none', border: 'none', color: '#D4C5BD', cursor: 'pointer', padding: 0, font: 'inherit', transition: 'color 0.15s ease' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseOut={e => (e.currentTarget.style.color = '#D4C5BD')}
                >
                  Capabilities & Features
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => scrollToSection('architecture')}
                  style={{ background: 'none', border: 'none', color: '#D4C5BD', cursor: 'pointer', padding: 0, font: 'inherit', transition: 'color 0.15s ease' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#FFFFFF')}
                  onMouseOut={e => (e.currentTarget.style.color = '#D4C5BD')}
                >
                  Self-Healing Architecture
                </button>
              </li>
            </ul>
          </div>

          {/* Operational Engine */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
              Autonomous Core
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.85rem', color: '#BCA89E' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}><Cpu size={13} color="var(--color-primary-soft)" /> Deterministic Agent State Machine</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}><Layers size={13} color="var(--color-primary-soft)" /> Timetable Conflict Escalation</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}><Shield size={13} color="var(--color-primary-soft)" /> Before/After Verification Audit</li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}><Lock size={13} color="var(--color-primary-soft)" /> Role-Based Access Control (RBAC)</li>
            </ul>
          </div>

          {/* Direct Access */}
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-primary-soft)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>
              Operational Access
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.7rem', fontSize: '0.88rem' }}>
              <li>
                <button 
                  type="button" 
                  onClick={onSignIn}
                  style={{ background: 'none', border: 'none', color: '#FF8C42', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 700 }}
                >
                  Sign In to AUOrbit Portal →
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={onGetStarted}
                  style={{ background: 'none', border: 'none', color: '#D4C5BD', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Register Student / Faculty
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{ 
          borderTop: '1px solid rgba(232, 214, 204, 0.15)', 
          paddingTop: '1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8rem',
          color: '#A89891'
        }}>
          <div>
            © 2026 AUOrbit Campus Operations Platform. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span style={{ color: '#FF8C42', fontWeight: 600 }}>PostgreSQL & SQLite Dual Architecture</span>
            <span>·</span>
            <span>Gemini Multimodal Triage</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

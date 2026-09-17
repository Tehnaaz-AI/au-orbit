import React from 'react';

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
      backgroundColor: '#FFFFFF', 
      borderTop: '1px solid var(--border-subtle)', 
      padding: '3.5rem 1.5rem 2rem',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          
          {/* Brand & Wordmark */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <div style={{ 
                width: 30, height: 30, borderRadius: 8, background: 'var(--color-primary)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 800, fontSize: '0.85rem' 
              }}>
                AU
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                AUOrbit
              </span>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Autonomous University Operations coordinating multi-agent campus maintenance, timetable awareness, controlled specialist execution, and autonomous replanning.
            </p>
          </div>

          {/* Product Navigation */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>
              Navigation
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.86rem' }}>
              <li>
                <button 
                  type="button" 
                  onClick={() => scrollToSection('how-it-works')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  How It Works
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => scrollToSection('capabilities')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Capabilities
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => scrollToSection('roles')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Role Workspaces
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => scrollToSection('architecture')}
                  style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  System Architecture
                </button>
              </li>
            </ul>
          </div>

          {/* Autonomous Features */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>
              Autonomous Core
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
              <li>Deterministic Agent Authority</li>
              <li>Timetable Conflict Escalation</li>
              <li>Specialist Capability Matching</li>
              <li>Self-Healing Replanning Loop</li>
              <li>PostgreSQL Authoritative History</li>
            </ul>
          </div>

          {/* Access & Account */}
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1rem' }}>
              Operational Access
            </div>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.86rem' }}>
              <li>
                <button 
                  type="button" 
                  onClick={onSignIn}
                  style={{ background: 'none', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: 0, font: 'inherit', fontWeight: 600 }}
                >
                  Sign In to AUOrbit
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={onGetStarted}
                  style={{ background: 'none', border: 'none', color: 'var(--text-body)', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Register Student / Faculty
                </button>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div style={{ 
          borderTop: '1px solid var(--border-subtle)', 
          paddingTop: '1.5rem', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.78rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            © 2026 AUOrbit. Built for autonomous university operations.
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span>PostgreSQL / Supabase Verified</span>
            <span>Gemini Structured Understanding</span>
          </div>
        </div>

      </div>
    </footer>
  );
};

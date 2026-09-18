import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  message?: string;
  subtext?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Synchronizing Campus Operations...',
  subtext = 'Connecting to AUOrbit autonomous multi-agent mesh',
  size = 'md',
  fullScreen = false
}) => {
  const dim = size === 'sm' ? 36 : size === 'lg' ? 72 : 52;
  const coreDim = size === 'sm' ? 14 : size === 'lg' ? 28 : 20;

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', padding: '2rem 1rem' }}>
      {/* Orbital Animation Rig */}
      <div style={{ position: 'relative', width: dim, height: dim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* Outer Orbit Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3.5, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '2px dashed var(--color-primary)',
            opacity: 0.45
          }}
        />

        {/* Counter Orbit Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ repeat: Infinity, duration: 2.2, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 4,
            borderRadius: '50%',
            borderTop: '2px solid var(--color-primary)',
            borderRight: '2px solid transparent',
            borderBottom: '2px solid var(--color-primary-soft)',
            borderLeft: '2px solid transparent'
          }}
        />

        {/* Glowing Center Core */}
        <motion.div
          animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.8, 1, 0.8] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          style={{
            width: coreDim,
            height: coreDim,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-hover) 100%)',
            boxShadow: '0 0 16px var(--color-primary-glow)'
          }}
        />
      </div>

      {/* Textual Feedback */}
      {message && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: size === 'sm' ? '0.82rem' : '0.94rem', fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
            {message}
          </div>
          {subtext && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {subtext}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {content}
      </div>
    );
  }

  return content;
};

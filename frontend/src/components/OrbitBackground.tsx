import React from 'react';
import { motion } from 'framer-motion';

export const OrbitBackground: React.FC = () => {
  return (
    <div 
      className="orbit-background-container" 
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0
      }}
    >
      {/* 1. TOP-RIGHT ORBITAL SYSTEM */}
      <div 
        style={{
          position: 'absolute',
          top: '-120px',
          right: '-140px',
          width: '680px',
          height: '680px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.65
        }}
      >
        {/* Central Ambient Glow Pulse */}
        <div className="orbit-core-glow" />

        {/* Orbit Ring 1 - Inner Swift Ring */}
        <div className="orbit-ring orbit-ring-1">
          <div className="orbit-satellite satellite-1">
            <div className="satellite-pulse" />
          </div>
        </div>

        {/* Orbit Ring 2 - Middle Orbit with Elliptical Tilt */}
        <div className="orbit-ring orbit-ring-2">
          <div className="orbit-satellite satellite-2">
            <div className="satellite-pulse" style={{ background: 'var(--color-primary)' }} />
          </div>
          <div className="orbit-satellite satellite-2-sub">
            <div className="satellite-pulse" style={{ width: 6, height: 6, background: '#FF8C42' }} />
          </div>
        </div>

        {/* Orbit Ring 3 - Outer Broad Ring */}
        <div className="orbit-ring orbit-ring-3">
          <div className="orbit-satellite satellite-3">
            <div className="satellite-pulse" style={{ width: 9, height: 9, background: 'var(--color-primary-dark)' }} />
          </div>
        </div>
      </div>

      {/* 2. BOTTOM-LEFT ORBITAL SYSTEM */}
      <div 
        style={{
          position: 'absolute',
          bottom: '-160px',
          left: '-160px',
          width: '740px',
          height: '740px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0.55
        }}
      >
        {/* Soft Amber Core Glow */}
        <div className="orbit-core-glow" style={{ background: 'radial-gradient(circle, rgba(255, 140, 66, 0.18) 0%, rgba(227, 83, 54, 0.05) 50%, transparent 70%)' }} />

        {/* Counter-Clockwise Orbit Ring 4 */}
        <div className="orbit-ring orbit-ring-counter-1">
          <div className="orbit-satellite satellite-counter-1">
            <div className="satellite-pulse" style={{ background: '#E35336' }} />
          </div>
        </div>

        {/* Outer Elliptical Orbit Ring 5 */}
        <div className="orbit-ring orbit-ring-counter-2">
          <div className="orbit-satellite satellite-counter-2">
            <div className="satellite-pulse" style={{ width: 7, height: 7, background: '#A0522D' }} />
          </div>
        </div>
      </div>

      {/* 3. SUBTLE FLOATING DRIFTING PARTICLES */}
      <div className="orbit-floating-particle p-1" />
      <div className="orbit-floating-particle p-2" />
      <div className="orbit-floating-particle p-3" />
      <div className="orbit-floating-particle p-4" />
      <div className="orbit-floating-particle p-5" />
    </div>
  );
};

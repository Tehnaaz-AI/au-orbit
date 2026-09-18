import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Home, PlusCircle, Headphones, Sparkles, Compass } from 'lucide-react';

interface NotFoundPageProps {
  onBackToDashboard: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBackToDashboard, onNavigateTab }) => {
  return (
    <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1.25rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="card"
        style={{ maxWidth: 540, width: '100%', textAlign: 'center', padding: '3rem 2.25rem', position: 'relative', overflow: 'hidden' }}
      >
        {/* Orbital Background Accent */}
        <div style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          border: '1px dashed rgba(227, 83, 54, 0.25)',
          pointerEvents: 'none'
        }} />

        {/* 404 Visual Icon */}
        <div style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'var(--status-error-bg)',
          color: 'var(--status-error-text)',
          border: '1px solid var(--status-error-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem',
          boxShadow: '0 8px 24px rgba(198, 40, 40, 0.12)'
        }}>
          <Compass size={36} color="var(--color-primary)" />
        </div>

        <div className="badge badge-warning" style={{ margin: '0 auto 0.75rem', display: 'inline-flex' }}>
          Error Code 404
        </div>

        <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)', lineHeight: 1.15 }}>
          Trajectory Lost in Campus Orbit
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginBottom: '2rem', lineHeight: 1.6, maxWidth: 440, margin: '0 auto 2rem' }}>
          The operational page, resource ID, or workspace you were navigating to does not exist in the AUOrbit catalog.
        </p>

        {/* Quick Nav Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onBackToDashboard}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Home size={15} /> Operational Hub
          </button>

          {onNavigateTab && (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onNavigateTab('report_issue')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <PlusCircle size={15} /> Report Issue
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onNavigateTab('contact')}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
              >
                <Headphones size={15} /> Contact Desk
              </button>
            </>
          )}
        </div>

        {/* Footnote */}
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          AUOrbit v2.0 • Autonomous University Operations Platform
        </div>
      </motion.div>
    </div>
  );
};

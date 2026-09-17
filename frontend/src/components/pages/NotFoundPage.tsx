import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, Home } from 'lucide-react';

interface NotFoundPageProps {
  onBackToDashboard: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBackToDashboard }) => {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card card-interactive"
        style={{ maxWidth: 480, width: '100%', textAlign: 'center', padding: '2.5rem 2rem' }}
      >
        <div style={{ 
          width: 56, 
          height: 56, 
          borderRadius: '50%', 
          background: 'var(--status-error-bg)', 
          color: 'var(--status-error-text)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          margin: '0 auto 1rem'
        }}>
          <AlertTriangle size={28} />
        </div>

        <h1 style={{ fontSize: '1.8rem', color: 'var(--text-main)', marginBottom: '0.4rem' }}>
          404 — Page Not Found
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
          The operational page or route you requested could not be located in the AUOrbit directory.
        </p>

        <button
          type="button"
          className="btn btn-primary"
          onClick={onBackToDashboard}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', margin: '0 auto' }}
        >
          <Home size={15} /> Return to Operational Hub
        </button>
      </motion.div>
    </div>
  );
};

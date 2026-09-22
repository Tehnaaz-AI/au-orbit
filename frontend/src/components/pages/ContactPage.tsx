import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  Headphones, 
  ShieldCheck, 
  Building2, 
  MessageSquare,
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { api } from '../../api';
import { ContactInfo } from '../../types';

interface ContactPageProps {
  onBackToApp?: () => void;
  onNavigateToLogin?: () => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onBackToApp, onNavigateToLogin }) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    contact_email_primary: '24eg106c58@anurag.edu.in',
    contact_email_secondary: '24eg106c63@anurag.edu.in',
    contact_phone_primary: '+91 9281478453',
    contact_phone_secondary: '+91 9490572567',
    contact_email: '24eg106c58@anurag.edu.in',
    contact_phone: '+91 9281478453',
    campus_hotline: '+91 9281478453',
    campus_name: 'Anurag University Main Campus',
    campus_address: 'Venkatapur, Ghatkesar, Hyderabad, Telangana 500088',
    campus_hours: 'Monday - Saturday: 08:30 AM - 05:30 PM (24/7 AI Triage)'
  });

  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{ ticket_id?: number; recipient_email?: string; mailto_url?: string } | null>(null);

  useEffect(() => {
    api.getContactInfo()
      .then(info => {
        if (info) setContactInfo(info);
      })
      .catch(err => {
        console.warn('Using local environment contact fallback:', err);
      });
  }, []);

  const primaryEmail = contactInfo.contact_email_primary || contactInfo.contact_email || '24eg106c58@anurag.edu.in';
  const secondaryEmail = contactInfo.contact_email_secondary || '24eg106c63@anurag.edu.in';
  const primaryPhone = contactInfo.contact_phone_primary || contactInfo.contact_phone || '+91 9281478453';
  const secondaryPhone = contactInfo.contact_phone_secondary || '+91 9490572567';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderEmail.trim() || !message.trim()) return;

    setLoading(true);
    try {
      const res = await api.sendContactMessage({
        name: senderName.trim() || 'Campus User',
        email: senderEmail.trim(),
        subject: subject.trim() || 'Campus Helpdesk Inquiry',
        message: message.trim()
      });
      setSubmissionResult(res);
      setSubmitted(true);
      if (res.mailto_url) {
        // Direct email client invocation
        window.location.href = res.mailto_url;
      }
    } catch (err) {
      console.warn('Backend contact submission fallback:', err);
      const mailto = `mailto:${primaryEmail}?cc=${encodeURIComponent(secondaryEmail)}&subject=${encodeURIComponent(subject.trim() || 'Campus Inquiry')}&body=${encodeURIComponent(`From: ${senderName} (${senderEmail})\n\n${message}`)}`;
      setSubmissionResult({
        recipient_email: primaryEmail,
        mailto_url: mailto
      });
      setSubmitted(true);
      window.location.href = mailto;
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{ maxWidth: '1080px', margin: '0 auto', padding: '2rem 1.25rem 4rem' }}
    >
      {/* Top Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.25rem 0.75rem', background: 'var(--color-primary-subtle)', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-orange)', marginBottom: '0.65rem' }}>
            <Headphones size={13} color="var(--color-primary)" />
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--color-primary-dark)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Campus Helpdesk & Operations Desk
            </span>
          </div>
          <h1 style={{ fontSize: '2.1rem', color: 'var(--text-main)', marginBottom: '0.35rem', fontFamily: 'var(--font-heading)' }}>
            Contact & Support Center
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', maxWidth: '650px' }}>
            Reach out to our campus operations desk, submit institutional inquiries, or reach emergency escalation teams directly.
          </p>
        </div>

        {onBackToApp && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onBackToApp}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <ArrowLeft size={14} /> Back to Overview
          </button>
        )}
      </div>

      {/* Grid: Left Contact Channels & Right Inquiry Form */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Direct Contact Info Channels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Dual Email Support Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="card" 
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', borderLeft: '4px solid var(--color-primary)' }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Mail size={22} />
            </div>
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary-dark)', letterSpacing: '0.05em' }}>
                Official Campus Operations Inboxes
              </div>
              
              <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Primary Helpdesk:</span>
                  <a 
                    href={`mailto:${primaryEmail}`}
                    style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', textDecoration: 'none', display: 'block' }}
                  >
                    {primaryEmail}
                  </a>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Secondary / Emergency Desk:</span>
                  <a 
                    href={`mailto:${secondaryEmail}`}
                    style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--primary-dark)', textDecoration: 'none', display: 'block' }}
                  >
                    {secondaryEmail}
                  </a>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                Response time within 2 hours during active academic schedule hours.
              </div>
            </div>
          </motion.div>

          {/* Dual Phone Support Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="card" 
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', borderLeft: '4px solid var(--color-orange-vibrant)' }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--color-primary-subtle)',
              color: 'var(--color-orange-vibrant)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Phone size={22} />
            </div>
            <div style={{ width: '100%' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-primary-dark)', letterSpacing: '0.05em' }}>
                Helpdesk Phone Lines
              </div>
              
              <div style={{ marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Primary Helpdesk Line:</span>
                  <a 
                    href={`tel:${primaryPhone}`}
                    style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', textDecoration: 'none', display: 'block' }}
                  >
                    {primaryPhone}
                  </a>
                </div>

                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Secondary Dispatch Line:</span>
                  <a 
                    href={`tel:${secondaryPhone}`}
                    style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--color-orange-vibrant)', textDecoration: 'none', display: 'block' }}
                  >
                    {secondaryPhone}
                  </a>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.45rem' }}>
                Operational Hours: {contactInfo.campus_hours}
              </div>
            </div>
          </motion.div>

          {/* 24/7 Emergency Dispatch Hotline Card */}
          <motion.div 
            whileHover={{ y: -2 }}
            className="card" 
            style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem', borderLeft: '4px solid #C84B31', background: 'var(--bg-surface)' }}
          >
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(200, 75, 49, 0.12)',
              color: '#C84B31',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: '#C84B31', letterSpacing: '0.05em' }}>
                24/7 Emergency Facilities Hotline
              </div>
              <a 
                href={`tel:${contactInfo.campus_hotline}`}
                style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', textDecoration: 'none', display: 'block', marginTop: '0.2rem' }}
              >
                {contactInfo.campus_hotline}
              </a>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                Power outage, severe water leakage, or emergency lab equipment containment.
              </div>
            </div>
          </motion.div>

          {/* Campus Location Card */}
          <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-surface)',
              color: 'var(--text-main)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid var(--border-subtle)'
            }}>
              <MapPin size={22} color="var(--color-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Physical Location
              </div>
              <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.2rem' }}>
                {contactInfo.campus_name}
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-body)', marginTop: '0.25rem', lineHeight: 1.45 }}>
                {contactInfo.campus_address}
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Clock size={12} /> {contactInfo.campus_hours}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Interactive Support / Inquiry Form */}
        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <MessageSquare size={20} color="var(--color-primary)" />
              <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', margin: 0, fontFamily: 'var(--font-heading)' }}>
                Send an Operational Inquiry
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Fill out this form to reach campus dispatchers directly.
            </p>
          </div>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                padding: '1.75rem',
                background: 'var(--status-success-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--status-success-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                textAlign: 'center',
                alignItems: 'center'
              }}
            >
              <CheckCircle2 size={36} color="var(--status-success-text)" />
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--status-success-text)', fontFamily: 'var(--font-heading)' }}>
                {submissionResult?.ticket_id ? `Inquiry Logged as Ticket #${submissionResult.ticket_id}` : 'Inquiry Transmitted Successfully'}
              </div>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-body)', margin: 0, maxWidth: '420px' }}>
                Your operational message has been registered with the <strong>AUOrbit Campus Operations Desk</strong> ({submissionResult?.recipient_email || contactInfo.contact_email}).
              </p>
              
              {submissionResult?.mailto_url && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem', width: '100%', maxWidth: '340px' }}>
                  <a
                    href={submissionResult.mailto_url}
                    className="btn btn-primary btn-sm"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.45rem 0.85rem' }}
                  >
                    <Mail size={14} /> Open in Email App (Direct Send)
                  </a>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Sends pre-filled message straight to {contactInfo.contact_email}
                  </span>
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setSubmitted(false);
                  setSenderName('');
                  setSenderEmail('');
                  setSubject('');
                  setMessage('');
                }}
                style={{ marginTop: '0.5rem' }}
              >
                Send Another Message
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="sender-name">Your Full Name *</label>
                <input
                  id="sender-name"
                  type="text"
                  className="form-input"
                  value={senderName}
                  onChange={e => setSenderName(e.target.value)}
                  placeholder="e.g. Prof. Arvind Rao or Student Roll No."
                  required
                  autoComplete="off"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="sender-email">Official Email Address *</label>
                <input
                  id="sender-email"
                  type="email"
                  className="form-input"
                  value={senderEmail}
                  onChange={e => setSenderEmail(e.target.value)}
                  placeholder="name@anurag.edu.in"
                  required
                  autoComplete="off"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="inquiry-subject">Subject / Category</label>
                <input
                  id="inquiry-subject"
                  type="text"
                  className="form-input"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g., Request for Lab Equipment Calibration"
                  autoComplete="off"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" htmlFor="inquiry-message">Detailed Message *</label>
                <textarea
                  id="inquiry-message"
                  className="form-textarea"
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Please describe your operational inquiry or facility question..."
                  rows={4}
                  required
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading || !senderEmail.trim() || !message.trim()}
                className="btn btn-primary"
                style={{ padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', marginTop: '0.35rem' }}
              >
                {loading ? 'Transmitting...' : 'Send Inquiry'} <Send size={15} />
              </motion.button>

            </form>
          )}

        </div>

      </div>

    </motion.div>
  );
};

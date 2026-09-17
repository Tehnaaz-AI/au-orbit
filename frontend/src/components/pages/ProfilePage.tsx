import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User } from '../../types';
import { api, setStoredUser } from '../../api';
import { 
  User as UserIcon, 
  Shield, 
  Mail, 
  Lock, 
  Save, 
  CheckCircle, 
  Key, 
  Building, 
  Phone, 
  Wrench,
  ArrowLeft,
  Sparkles
} from 'lucide-react';

interface ProfilePageProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  onBackToApp?: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  currentUser,
  onUpdateUser,
  onBackToApp,
  onError,
  onSuccess
}) => {
  const [fullName, setFullName] = useState(currentUser.full_name || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [specialty, setSpecialty] = useState(currentUser.specialty || '');
  const [phone, setPhone] = useState(currentUser.phone || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      onError('Full name cannot be empty.');
      return;
    }

    if (isChangingPassword) {
      if (!currentPassword) {
        onError('Current password is required to set a new password.');
        return;
      }
      if (newPassword.length < 4) {
        onError('New password must be at least 4 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        onError('New password and confirmation do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload: any = {
        full_name: fullName.trim(),
        department: department.trim() || undefined,
        specialty: specialty.trim() || undefined,
        phone: phone.trim() || undefined
      };

      if (isChangingPassword && newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const updated = await api.updateProfile(payload);
      setStoredUser(updated);
      onUpdateUser(updated);
      onSuccess('Your profile has been updated successfully!');
      
      // Reset password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsChangingPassword(false);
    } catch (err: any) {
      onError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h1 style={{ fontSize: '1.5rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
              <UserIcon size={24} color="var(--color-primary)" />
              Account & Profile Settings
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Manage your personal contact info, departmental affiliation, and security credentials.
          </p>
        </div>

        {onBackToApp && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onBackToApp}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <ArrowLeft size={13} /> Back to Dashboard
          </button>
        )}
      </div>

      {/* User Overview Banner */}
      <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            boxShadow: '0 3px 10px rgba(227, 83, 54, 0.3)'
          }}>
            {currentUser.full_name ? currentUser.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                {currentUser.full_name}
              </span>
              <span className="badge badge-role">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.15rem' }}>
              <Mail size={12} /> {currentUser.email}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <div>Organization: <b>University Main Campus</b></div>
          <div>Member since: {new Date(currentUser.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        <div>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.2rem', fontFamily: 'var(--font-heading)' }}>
            Personal Information
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Update your public name and organizational context.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
          <div>
            <label className="form-label" htmlFor="profile-fullname">Full Name *</label>
            <input
              id="profile-fullname"
              type="text"
              className="form-input"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="e.g. Dr. Ramesh Kumar"
              required
            />
          </div>

          <div>
            <label className="form-label" htmlFor="profile-email">Email Address (Read-Only)</label>
            <input
              id="profile-email"
              type="email"
              className="form-input"
              value={currentUser.email}
              disabled
              style={{ background: 'var(--bg-surface)', cursor: 'not-allowed', opacity: 0.7 }}
            />
          </div>

          <div>
            <label className="form-label" htmlFor="profile-phone">Contact Phone</label>
            <input
              id="profile-phone"
              type="tel"
              className="form-input"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
            />
          </div>

          <div>
            <label className="form-label" htmlFor="profile-dept">Department / Faculty</label>
            <input
              id="profile-dept"
              type="text"
              className="form-input"
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="e.g. Artificial Intelligence / Computer Science"
            />
          </div>

          {currentUser.role === 'TECHNICIAN' && (
            <div>
              <label className="form-label" htmlFor="profile-specialty">Field Specialty</label>
              <input
                id="profile-specialty"
                type="text"
                className="form-input"
                value={specialty}
                onChange={e => setSpecialty(e.target.value)}
                placeholder="e.g. Hardware & AV, Network & Power"
              />
            </div>
          )}
        </div>

        {/* Security & Password Change Section */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-heading)' }}>
                <Key size={16} color="var(--color-primary)" /> Security & Credentials
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Change your account password securely.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              style={{ fontSize: '0.75rem' }}
            >
              {isChangingPassword ? 'Cancel Password Change' : 'Change Password'}
            </button>
          </div>

          {isChangingPassword && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', background: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}
            >
              <div>
                <label className="form-label" htmlFor="current-pwd">Current Password *</label>
                <input
                  id="current-pwd"
                  type="password"
                  className="form-input"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="new-pwd">New Password *</label>
                <input
                  id="new-pwd"
                  type="password"
                  className="form-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min 4 characters"
                />
              </div>

              <div>
                <label className="form-label" htmlFor="confirm-pwd">Confirm New Password *</label>
                <input
                  id="confirm-pwd"
                  type="password"
                  className="form-input"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ padding: '0.55rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>

      </form>

    </div>
  );
};

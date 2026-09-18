import React, { useState, useRef } from 'react';
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
  Sparkles,
  Camera,
  Trash2,
  Upload,
  Smile
} from 'lucide-react';

interface ProfilePageProps {
  currentUser: User;
  onUpdateUser: (updated: User) => void;
  onBackToApp?: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
];

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
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatar_url || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarFile = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (file.size > 5 * 1024 * 1024) {
      onError('Avatar image size must be under 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setAvatarUrl(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

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
        phone: phone.trim() || undefined,
        avatar_url: avatarUrl || undefined
      };

      if (isChangingPassword && newPassword) {
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      const updated = await api.updateProfile(payload);
      setStoredUser(updated);
      onUpdateUser(updated);
      onSuccess('Your profile and avatar have been updated successfully!');
      
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
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.32 }}
      style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '3rem' }}
    >
      
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h1 style={{ fontSize: '1.6rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
              <UserIcon size={24} color="var(--color-primary)" />
              Account & Profile Settings
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            Manage your personal profile, custom profile picture, and security credentials.
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
      <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          
          {/* Avatar Picture with Camera Badge */}
          <div style={{ position: 'relative' }}>
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={fullName}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid var(--color-primary)',
                  boxShadow: '0 3px 12px var(--color-primary-glow)'
                }} 
              />
            ) : (
              <div style={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                fontWeight: 800,
                fontFamily: 'var(--font-heading)',
                boxShadow: '0 3px 12px var(--color-primary-glow)'
              }}>
                {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title="Change Profile Picture"
              style={{
                position: 'absolute',
                bottom: -3,
                right: -3,
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: '#FFFFFF',
                border: '2px solid var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            >
              <Camera size={12} />
            </button>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                {fullName || currentUser.full_name}
              </span>
              <span className="badge badge-role">
                {currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
              <Mail size={12} /> {currentUser.email}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <div>Tenant: <b>Anurag University Campus</b></div>
          <div>Joined: {new Date(currentUser.created_at).toLocaleDateString([], { month: 'short', year: 'numeric' })}</div>
        </div>
      </div>

      {/* Profile Photo Selector Section */}
      <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '0.2rem', fontFamily: 'var(--font-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Camera size={16} color="var(--color-primary)" /> Profile Picture & Avatar
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Upload your personal photo or select an avatar preset.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem' }}
            >
              <Upload size={13} /> Upload Photo
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleAvatarFile(e.target.files)}
            />
            {avatarUrl && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setAvatarUrl('')}
                style={{ color: 'var(--status-error-text)', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
        </div>

        {/* Avatar Preset Carousel */}
        <div>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.4rem' }}>
            Or choose a preset portrait avatar:
          </label>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {PRESET_AVATARS.map((url, i) => (
              <motion.img
                key={i}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                src={url}
                alt={`Preset Avatar ${i + 1}`}
                onClick={() => setAvatarUrl(url)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  cursor: 'pointer',
                  border: avatarUrl === url ? '3px solid var(--color-primary)' : '2px solid var(--border-default)',
                  boxShadow: avatarUrl === url ? '0 0 10px var(--color-primary-glow)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        <div>
          <h2 style={{ fontSize: '1.15rem', color: 'var(--text-main)', marginBottom: '0.2rem', fontFamily: 'var(--font-heading)' }}>
            Personal Information
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Update your public details and departmental affiliation.
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
              autoComplete="off"
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
              autoComplete="off"
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
              autoComplete="off"
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
                autoComplete="off"
              />
            </div>
          )}
        </div>

        {/* Security & Password Change Section */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
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
                  autoComplete="current-password"
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
                  autoComplete="new-password"
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
                  autoComplete="new-password"
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
            style={{ padding: '0.65rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
          >
            <Save size={15} /> {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>

      </form>

    </motion.div>
  );
};

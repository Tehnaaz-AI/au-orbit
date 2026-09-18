import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Role, Incident, Technician } from '../../types';
import { api } from '../../api';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Search, 
  CheckCircle, 
  XCircle, 
  Trash2, 
  RotateCcw, 
  Edit3, 
  Wrench,
  ArrowRight
} from 'lucide-react';

interface UserManagementViewProps {
  currentUser: User;
  incidents?: Incident[];
  technicians?: Technician[];
  onRefresh: () => void;
  onError: (msg: string) => void;
  onSuccess: (msg: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  incidents = [],
  technicians = [],
  onRefresh,
  onError,
  onSuccess
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Add User Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<Role>('STUDENT');
  const [newUserDept, setNewUserDept] = useState('');
  const [newUserSpecialty, setNewUserSpecialty] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);

  // Work Order Reassignment State
  const [showReassignModal, setShowReassignModal] = useState<number | null>(null);
  const [selectedTechId, setSelectedTechId] = useState<number>(technicians[0]?.id || 1);
  const [reassignNotes, setReassignNotes] = useState('');
  const [reassigning, setReassigning] = useState(false);

  async function fetchUsers() {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      onError(err.message || 'Failed to load user directory');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleRoleChange(userId: number, newRole: Role) {
    try {
      await api.updateUser(userId, { role: newRole });
      onSuccess(`User #${userId} role updated to ${newRole}`);
      fetchUsers();
    } catch (err: any) {
      onError(err.message || 'Failed to update user role');
    }
  }

  async function handleToggleActive(user: User) {
    try {
      await api.updateUser(user.id, { is_active: !user.is_active });
      onSuccess(`User #${user.id} status updated`);
      fetchUsers();
    } catch (err: any) {
      onError(err.message || 'Failed to update user status');
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!window.confirm(`Are you sure you want to permanently delete user #${userId}?`)) return;
    try {
      await api.deleteUser(userId);
      onSuccess(`User #${userId} removed.`);
      fetchUsers();
    } catch (err: any) {
      onError(err.message || 'Failed to delete user');
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPassword.trim() || !newUserName.trim()) return;

    setCreatingUser(true);
    try {
      await api.createUser({
        email: newUserEmail.trim(),
        password: newUserPassword.trim(),
        full_name: newUserName.trim(),
        role: newUserRole,
        department: newUserDept.trim() || undefined,
        specialty: newUserSpecialty.trim() || undefined,
        phone: newUserPhone.trim() || undefined
      });
      onSuccess(`User ${newUserName} created successfully.`);
      setShowAddModal(false);
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserName('');
      setNewUserDept('');
      setNewUserSpecialty('');
      setNewUserPhone('');
      fetchUsers();
    } catch (err: any) {
      onError(err.message || 'Failed to create user account');
    } finally {
      setCreatingUser(false);
    }
  }

  async function handleReassign(workOrderId: number) {
    setReassigning(true);
    try {
      await api.reassignWorkOrder(workOrderId, selectedTechId, reassignNotes);
      onSuccess(`Work order #${workOrderId} reassigned.`);
      setShowReassignModal(null);
      setReassignNotes('');
      onRefresh();
    } catch (err: any) {
      onError(err.message || 'Failed to reassign work order');
    } finally {
      setReassigning(false);
    }
  }

  const filteredUsers = users.filter(u => {
    if (filterRole !== 'ALL' && u.role !== filterRole) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q) ||
        (u.department && u.department.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const roleBadgeClass: Record<string, string> = {
    SUPER_ADMIN: 'badge-danger',
    ADMIN: 'badge-info',
    OPERATIONAL_HEAD: 'badge-warning',
    UNIVERSITY_ADMIN: 'badge-info',
    FACULTY: 'badge-role',
    TECHNICIAN: 'badge-neutral',
    STUDENT: 'badge-neutral'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
            <Users size={22} color="var(--color-primary)" />
            User Roster ({filteredUsers.length})
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
            Manage campus accounts, role permissions, and active statuses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <UserPlus size={14} /> Add User
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchUsers}
            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <RotateCcw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* Main Contained Card with Filters and Scrollable Table */}
      <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        
        {/* Filter & Search Toolbar */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          flexWrap: 'wrap', 
          gap: '0.65rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: '340px' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              style={{ paddingLeft: '2rem', height: '32px', fontSize: '0.82rem' }}
            />
          </div>

          {/* Role Filters */}
          <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
            {['ALL', 'STUDENT', 'FACULTY', 'TECHNICIAN', 'OPERATIONAL_HEAD', 'ADMIN', 'SUPER_ADMIN'].map(r => (
              <button
                key={r}
                type="button"
                className={`btn btn-sm ${filterRole === r ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilterRole(r)}
                style={{ fontSize: '0.72rem', padding: '0.2rem 0.5rem' }}
              >
                {r === 'OPERATIONAL_HEAD' ? 'Ops Head' : r === 'SUPER_ADMIN' ? 'Super Admin' : r}
              </button>
            ))}
          </div>
        </div>

        {/* Users Directory Table in Contained Scroll Container */}
        <div 
          className="table-scroll-container" 
          style={{ 
            maxHeight: '440px', 
            overflowY: 'auto', 
            overflowX: 'auto', 
            scrollbarWidth: 'thin', 
            scrollbarColor: 'var(--color-primary-soft) var(--bg-surface)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-sm)', 
            background: '#FFFFFF',
            boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.02)'
          }}
        >
          <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: '#FFFFFF' }}>
            <tr>
              <th style={{ background: 'var(--bg-surface)' }}>User</th>
              <th style={{ background: 'var(--bg-surface)' }}>Role Assignment</th>
              <th style={{ background: 'var(--bg-surface)' }}>Department / Specialty</th>
              <th style={{ background: 'var(--bg-surface)' }}>Status</th>
              <th style={{ background: 'var(--bg-surface)' }}>Joined</th>
              <th style={{ textAlign: 'right', background: 'var(--bg-surface)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                    <div style={{ 
                      width: 28, height: 28, borderRadius: '50%', background: 'var(--color-primary-subtle)', 
                      color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '0.75rem', fontWeight: 700 
                    }}>
                      {u.full_name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-main)' }}>
                        {u.full_name}
                      </div>
                      <div className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {u.email}
                      </div>
                    </div>
                  </div>
                </td>

                <td>
                  <select
                    className="form-select"
                    value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value as Role)}
                    style={{ height: '30px', fontSize: '0.75rem', padding: '0 0.35rem', fontWeight: 600 }}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="FACULTY">Faculty Member</option>
                    <option value="TECHNICIAN">Technician</option>
                    <option value="OPERATIONAL_HEAD">Operational Head</option>
                    <option value="ADMIN">Administrator</option>
                    <option value="SUPER_ADMIN">Super Administrator</option>
                  </select>
                </td>

                <td style={{ fontSize: '0.82rem' }}>
                  {u.department || u.specialty || 'General'}
                </td>

                <td>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(u)}
                    className={`badge ${u.is_active !== false ? 'badge-success' : 'badge-neutral'}`}
                    style={{ cursor: 'pointer', border: 'none' }}
                  >
                    {u.is_active !== false ? 'Active' : 'Inactive'}
                  </button>
                </td>

                <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>

                <td style={{ textAlign: 'right' }}>
                  {currentUser.role === 'SUPER_ADMIN' && u.id !== currentUser.id && (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteUser(u.id)}
                      style={{ color: 'var(--status-error-text)', padding: '0.2rem 0.4rem' }}
                      title="Delete User"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <UserPlus size={18} color="var(--color-primary)" />
                Create University User
              </h2>
              <button type="button" className="btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateUser} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  placeholder="e.g., Dr. Meera Nambiar"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  className="form-input"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  placeholder="e.g., meera@au.edu"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Initial Password *</label>
                <input
                  type="password"
                  className="form-input"
                  value={newUserPassword}
                  onChange={e => setNewUserPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Assign Role *</label>
                <select
                  className="form-select"
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value as Role)}
                >
                  <option value="STUDENT">Student</option>
                  <option value="FACULTY">Faculty Member</option>
                  <option value="TECHNICIAN">Technician</option>
                  <option value="OPERATIONAL_HEAD">Operational Head</option>
                  <option value="ADMIN">Administrator</option>
                  {currentUser.role === 'SUPER_ADMIN' && <option value="SUPER_ADMIN">Super Administrator</option>}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Department / Specialty (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={newUserDept}
                  onChange={e => setNewUserDept(e.target.value)}
                  placeholder="e.g., Computer Science, AV Systems, Facilities"
                />
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={creatingUser}>
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

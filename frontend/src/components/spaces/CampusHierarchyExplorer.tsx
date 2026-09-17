import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room, Equipment, User } from '../../types';
import { api } from '../../api';
import { 
  Building2, 
  Layers, 
  Search, 
  MapPin, 
  CheckCircle2, 
  AlertCircle, 
  Wrench,
  Clock,
  Activity,
  Check,
  Power
} from 'lucide-react';

interface CampusHierarchyExplorerProps {
  rooms: Room[];
  equipment: Equipment[];
  currentUser?: User;
  onSelectRoom?: (room: Room) => void;
  onRefresh?: () => void;
  onError?: (msg: string) => void;
  onSuccess?: (msg: string) => void;
  title?: string;
  subtitle?: string;
}

export const CampusHierarchyExplorer: React.FC<CampusHierarchyExplorerProps> = ({
  rooms,
  equipment,
  currentUser,
  onSelectRoom,
  onRefresh,
  onError,
  onSuccess,
  title = 'Campus Spatial Explorer',
  subtitle = 'Hierarchical navigation of university infrastructure organized by building block, floor levels, and instructional spaces.'
}) => {
  // Extract unique blocks
  const blocks = Array.from(new Set(rooms.map(r => r.block).filter(Boolean)));
  const [selectedBlock, setSelectedBlock] = useState<string>(blocks[0] || 'I');
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingRoom, setUpdatingRoom] = useState<string | null>(null);

  // Extract floors for selected block
  const blockRooms = rooms.filter(r => r.block === selectedBlock);
  const floors = Array.from(new Set(blockRooms.map(r => r.floor))).sort((a, b) => a - b);
  const [selectedFloor, setSelectedFloor] = useState<number | 'ALL'>('ALL');

  // Filter rooms on current block + floor + search
  const displayedRooms = blockRooms.filter(r => {
    if (selectedFloor !== 'ALL' && r.floor !== selectedFloor) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.code.toLowerCase().includes(q) || r.kind.toLowerCase().includes(q) || (r.department && r.department.toLowerCase().includes(q));
    }
    return true;
  });

  const canManageSpaces = currentUser && ['SUPER_ADMIN', 'ADMIN', 'OPERATIONAL_HEAD', 'UNIVERSITY_ADMIN'].includes(currentUser.role);

  async function handleAvailabilityChange(roomCode: string, newStatus: string) {
    setUpdatingRoom(roomCode);
    try {
      await api.updateRoomAvailability(roomCode, newStatus);
      if (onSuccess) onSuccess(`Space ${roomCode} status updated to ${newStatus}`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      if (onError) onError(err.message || 'Failed to update space availability');
    } finally {
      setUpdatingRoom(null);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Explorer Header */}
      <div>
        <h2 style={{ fontSize: '1.35rem', color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontFamily: 'var(--font-heading)' }}>
          <Building2 size={22} color="var(--primary-dark)" />
          {title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
          {subtitle}
        </p>
      </div>

      {/* 1. STEP 1: Building Block Selector Cards */}
      <div>
        <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)', marginBottom: '0.4rem', display: 'block' }}>
          Step 1: Select Academic / Operational Block
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.65rem' }}>
          {blocks.map(b => {
            const count = rooms.filter(r => r.block === b).length;
            const isSelected = selectedBlock === b;
            return (
              <motion.div
                key={b}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelectedBlock(b);
                  setSelectedFloor('ALL');
                }}
                className={`card ${isSelected ? 'card-interactive' : ''}`}
                style={{
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--primary-dark)' : 'var(--border-subtle)',
                  background: isSelected ? 'var(--color-primary-subtle)' : 'var(--bg-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? 'var(--primary-dark)' : 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                    Block {b}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {count} configured spaces
                  </div>
                </div>
                <Building2 size={20} color={isSelected ? 'var(--primary-dark)' : 'var(--text-dim)'} />
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 2. STEP 2: Floor Level Tabs & Search */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Floor Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginRight: '0.25rem' }}>
            <Layers size={13} /> Floor:
          </span>
          <button
            type="button"
            className={`btn btn-sm ${selectedFloor === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedFloor('ALL')}
            style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
          >
            All Floors
          </button>
          {floors.map(f => (
            <button
              key={f}
              type="button"
              className={`btn btn-sm ${selectedFloor === f ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedFloor(f)}
              style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
            >
              Floor {f}
            </button>
          ))}
        </div>

        {/* Space Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search spaces in Block ${selectedBlock}...`}
            style={{ paddingLeft: '1.85rem', height: '32px', fontSize: '0.8rem' }}
          />
        </div>
      </div>

      {/* 3. STEP 3: Classrooms Deck in Contained Scroll Deck */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Spaces on {selectedFloor === 'ALL' ? `Block ${selectedBlock} (All Floors)` : `Block ${selectedBlock} - Floor ${selectedFloor}`} ({displayedRooms.length})
          </span>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Contained Scroll Deck</span>
        </div>

        {displayedRooms.length === 0 ? (
          <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No spaces match this floor and search filter.
            </p>
          </div>
        ) : (
          <div className="contained-scroll-deck" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.85rem' }}>
            {displayedRooms.map(room => {
              const roomEq = equipment.filter(eq => eq.room_code === room.code);
              const faultCount = roomEq.filter(eq => eq.status === 'FAULT').length;
              return (
                <motion.div
                  key={room.code}
                  whileHover={{ y: -3, transition: { duration: 0.15 } }}
                  onClick={() => onSelectRoom && onSelectRoom(room)}
                  className="card card-interactive"
                  style={{
                    padding: '0.95rem 1.1rem',
                    cursor: onSelectRoom ? 'pointer' : 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary-dark)', fontFamily: 'var(--font-heading)' }}>
                      {room.code}
                    </span>
                    <span className={`badge ${room.availability === 'AVAILABLE' ? 'badge-success' : room.availability === 'MAINTENANCE' ? 'badge-danger' : 'badge-neutral'}`} style={{ fontSize: '0.72rem' }}>
                      {room.availability}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-main)' }}>
                    {room.kind} · Floor {room.floor}
                  </div>

                  {/* Operational Availability Toggle (Admin/Ops Head Control) */}
                  {canManageSpaces && (
                    <div style={{ marginTop: '0.2rem', paddingTop: '0.35rem', borderTop: '1px dashed var(--border-subtle)' }} onClick={e => e.stopPropagation()}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 600 }}>Set Venue State:</div>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {['AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'].map(st => (
                          <button
                            key={st}
                            type="button"
                            disabled={updatingRoom === room.code}
                            onClick={() => handleAvailabilityChange(room.code, st)}
                            style={{
                              fontSize: '0.68rem',
                              padding: '0.15rem 0.4rem',
                              borderRadius: '4px',
                              border: room.availability === st ? '1px solid var(--primary-dark)' : '1px solid var(--border-subtle)',
                              background: room.availability === st ? 'var(--color-primary-subtle)' : '#FFFFFF',
                              color: room.availability === st ? 'var(--primary-dark)' : 'var(--text-muted)',
                              cursor: 'pointer',
                              fontWeight: room.availability === st ? 700 : 500
                            }}
                          >
                            {st === 'AVAILABLE' ? 'Available' : st === 'OCCUPIED' ? 'Occupied' : st === 'MAINTENANCE' ? 'Maintenance' : 'Reserved'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.45rem', marginTop: '0.2rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Wrench size={12} /> {roomEq.length} Equipment items
                    </span>
                    {faultCount > 0 ? (
                      <span style={{ color: 'var(--status-error-text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <AlertCircle size={12} /> {faultCount} Fault
                      </span>
                    ) : (
                      <span style={{ color: 'var(--status-success-text)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <CheckCircle2 size={12} /> All Working
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

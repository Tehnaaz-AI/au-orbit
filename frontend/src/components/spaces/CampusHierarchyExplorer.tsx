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
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedKind, setSelectedKind] = useState<string>('ALL');

  // Filter rooms on current block + floor + status + kind + search
  const displayedRooms = blockRooms.filter(r => {
    if (selectedFloor !== 'ALL' && r.floor !== selectedFloor) return false;
    if (selectedStatus !== 'ALL' && (r.availability || 'AVAILABLE') !== selectedStatus) return false;
    if (selectedKind !== 'ALL' && r.kind !== selectedKind) return false;
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

  const [inspectedRoom, setInspectedRoom] = useState<Room | null>(null);

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
              <motion.button
                key={b}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setSelectedBlock(b || 'I');
                  setSelectedFloor('ALL');
                }}
                className={`card ${isSelected ? 'card-interactive' : ''}`}
                style={{
                  padding: '0.85rem 1rem',
                  cursor: 'pointer',
                  border: isSelected ? '1px solid var(--primary-dark)' : '1px solid var(--border-subtle)',
                  borderLeft: isSelected ? '4px solid var(--primary-dark)' : '4px solid var(--border-subtle)',
                  background: isSelected ? 'var(--color-primary-subtle)' : 'var(--bg-card)',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: isSelected ? 'var(--primary-dark)' : 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                    Block {b}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    {count} Instructional Venues
                  </div>
                </div>
                <Building2 size={18} color={isSelected ? 'var(--primary-dark)' : 'var(--text-dim)'} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. STEP 2: Floor & Availability Status Filter Controls */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '0.75rem',
        padding: '0.85rem 1rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Floor, Status & Kind Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          
          {/* Floor selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Floor:</span>
            <button
              type="button"
              className={`btn btn-sm ${selectedFloor === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setSelectedFloor('ALL')}
              style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
            >
              All
            </button>
            {floors.map(f => (
              <button
                key={f}
                type="button"
                className={`btn btn-sm ${selectedFloor === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedFloor(f)}
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
              >
                F{f}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

          {/* Status selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status:</span>
            {['ALL', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE'].map(st => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${selectedStatus === st ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedStatus(st)}
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
              >
                {st === 'ALL' ? 'All Status' : st}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 18, background: 'var(--border-subtle)' }} />

          {/* Room Kind selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Kind:</span>
            {['ALL', 'CLASSROOM', 'LAB', 'SEMINAR_HALL'].map(kd => (
              <button
                key={kd}
                type="button"
                className={`btn btn-sm ${selectedKind === kd ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setSelectedKind(kd)}
                style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
              >
                {kd === 'ALL' ? 'All' : kd === 'CLASSROOM' ? 'Classrooms' : kd === 'LAB' ? 'Labs' : 'Seminar'}
              </button>
            ))}
          </div>

        </div>

        {/* Room Search in Block */}
        <div style={{ position: 'relative', width: '200px' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search Block ${selectedBlock}...`}
            style={{ paddingLeft: '1.85rem', height: '30px', fontSize: '0.78rem' }}
          />
        </div>
      </div>

      {/* 3. STEP 3: Classrooms Deck in Contained Scroll Deck */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Spaces on {selectedFloor === 'ALL' ? `Block ${selectedBlock} (All Floors)` : `Block ${selectedBlock} - Floor ${selectedFloor}`} ({displayedRooms.length})
          </span>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Click any space to inspect details</span>
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
                  onClick={() => {
                    setInspectedRoom(room);
                    if (onSelectRoom) onSelectRoom(room);
                  }}
                  className="card card-interactive"
                  style={{
                    padding: '0.95rem 1.1rem',
                    cursor: 'pointer',
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

      {/* Interactive Room Detail Modal */}
      {inspectedRoom && (
        <div className="modal-overlay" onClick={() => setInspectedRoom(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="modal-content" 
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '640px' }}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Building2 size={22} color="var(--color-primary)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                    Venue Details: Room {inspectedRoom.code}
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Block {inspectedRoom.block} · Floor {inspectedRoom.floor} · {inspectedRoom.kind}
                  </div>
                </div>
              </div>
              <button type="button" className="btn-ghost btn-sm" onClick={() => setInspectedRoom(null)}>
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Space Overview Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Operational State</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    <span className={`badge ${inspectedRoom.availability === 'AVAILABLE' ? 'badge-success' : 'badge-warning'}`}>
                      {inspectedRoom.availability}
                    </span>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Space Type</div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {inspectedRoom.kind}
                  </div>
                </div>

                <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Unit</div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                    {inspectedRoom.department || 'General Academic'}
                  </div>
                </div>
              </div>

              {/* Installed Equipment Catalog */}
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Wrench size={14} color="var(--color-primary)" />
                  Installed Equipment & Infrastructure ({equipment.filter(e => e.room_code === inspectedRoom.code).length})
                </div>

                {equipment.filter(e => e.room_code === inspectedRoom.code).length === 0 ? (
                  <div style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center' }}>
                    No specific hardware assets mapped to this space.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {equipment.filter(e => e.room_code === inspectedRoom.code).map(eq => (
                      <div 
                        key={eq.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.55rem 0.85rem',
                          background: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.82rem'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{eq.name}</span>
                        <span className={`badge ${eq.status === 'WORKING' ? 'badge-success' : eq.status === 'FAULT' ? 'badge-danger' : 'badge-warning'}`}>
                          {eq.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setInspectedRoom(null)}>
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

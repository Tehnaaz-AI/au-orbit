import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Room, Equipment, Technician } from '../../types';
import { Building2, Wrench, Users, Search, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';

interface ResourceListProps {
  rooms: Room[];
  equipment: Equipment[];
  technicians: Technician[];
  onSetTechnicianStatus?: (techId: number, status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY') => void;
  title?: string;
  subtitle?: string;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  rooms,
  equipment,
  technicians,
  onSetTechnicianStatus,
  title = 'Campus Resources & Inventory',
  subtitle = 'Institutional database of university facilities, instructional equipment, and specialist fleet.'
}) => {
  const [activeCategory, setActiveCategory] = useState<'spaces' | 'equipment' | 'technicians'>('spaces');
  const [selectedBlock, setSelectedBlock] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const blocks = ['ALL', ...Array.from(new Set(rooms.map(r => r.block).filter(Boolean)))];

  const filteredRooms = rooms.filter(r => {
    if (selectedBlock !== 'ALL' && r.block !== selectedBlock) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return r.code.toLowerCase().includes(q) || r.kind.toLowerCase().includes(q) || (r.block && r.block.toLowerCase().includes(q));
    }
    return true;
  });

  const filteredEquipment = equipment.filter(eq => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return eq.name.toLowerCase().includes(q) || (eq.room_code && eq.room_code.toLowerCase().includes(q)) || (eq.block && eq.block.toLowerCase().includes(q));
    }
    return true;
  });

  const filteredTechnicians = technicians.filter(tech => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return tech.name.toLowerCase().includes(q) || tech.specialty.toLowerCase().includes(q) || tech.status.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Header Info */}
      <div>
        <h2 style={{ fontSize: '1.3rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
          {title}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
          {subtitle}
        </p>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
        <button
          type="button"
          className={`btn btn-sm ${activeCategory === 'spaces' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('spaces')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Building2 size={14} /> Spaces & Rooms ({rooms.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeCategory === 'equipment' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('equipment')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Wrench size={14} /> Equipment Registry ({equipment.length})
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeCategory === 'technicians' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveCategory('technicians')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
        >
          <Users size={14} /> Specialist Fleet ({technicians.length})
        </button>
      </div>

      {/* Search & Sub-filters */}
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
        <div style={{ position: 'relative', flex: '1 1 240px', maxWidth: '380px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeCategory}...`}
            style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.84rem' }}
          />
        </div>

        {activeCategory === 'spaces' && (
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {blocks.map(b => (
              <button
                key={b}
                type="button"
                className={`btn btn-sm ${selectedBlock === b ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedBlock(b)}
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
              >
                {b}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1. Spaces & Rooms View */}
      {activeCategory === 'spaces' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {filteredRooms.map(room => (
            <motion.div
              key={room.code}
              whileHover={{ y: -3 }}
              className="card card-interactive"
              style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary-dark)' }}>
                  {room.code}
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                  Block {room.block || 'Main'}
                </span>
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {room.kind} - Floor {room.floor}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Availability: {room.availability}</span>
                <span>Dept: {room.department || 'General'}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 2. Equipment Registry View */}
      {activeCategory === 'equipment' && (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Space / Room</th>
                <th>Block</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map(eq => (
                <tr key={eq.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{eq.name}</td>
                  <td><strong>{eq.room_code || 'General'}</strong></td>
                  <td>{eq.block || 'Main'} (Fl. {eq.floor || 1})</td>
                  <td>
                    <span className={`badge ${eq.status === 'WORKING' ? 'badge-success' : eq.status === 'FAULT' ? 'badge-danger' : 'badge-warning'}`}>
                      {eq.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Specialist Fleet View */}
      {activeCategory === 'technicians' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
          {filteredTechnicians.map(tech => (
            <motion.div
              key={tech.id}
              whileHover={{ y: -3 }}
              className="card card-interactive"
              style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <Users size={16} color="var(--color-primary)" />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                    {tech.name}
                  </span>
                </div>
                <span className={`badge ${tech.status === 'AVAILABLE' ? 'badge-success' : tech.status === 'BUSY' ? 'badge-warning' : 'badge-neutral'}`}>
                  {tech.status}
                </span>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Capability: <strong>{tech.specialty}</strong>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                <span>Phone: {tech.phone || '+91 98480 22338'}</span>
              </div>

              {onSetTechnicianStatus && (
                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.25rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem' }}>
                  <button
                    type="button"
                    className={`btn btn-sm ${tech.status === 'AVAILABLE' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
                    onClick={() => onSetTechnicianStatus(tech.id, 'AVAILABLE')}
                  >
                    Available
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${tech.status === 'BUSY' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
                    onClick={() => onSetTechnicianStatus(tech.id, 'BUSY')}
                  >
                    Busy
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${tech.status === 'OFF_DUTY' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem' }}
                    onClick={() => onSetTechnicianStatus(tech.id, 'OFF_DUTY')}
                  >
                    Off Duty
                  </button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

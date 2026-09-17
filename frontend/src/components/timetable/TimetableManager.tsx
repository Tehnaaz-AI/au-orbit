import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimetableItem, Room } from '../../types';
import { 
  Calendar, 
  Clock, 
  BookOpen, 
  MapPin, 
  Search, 
  Building2, 
  Layers, 
  UserCheck, 
  AlertTriangle,
  Grid,
  ListFilter
} from 'lucide-react';

interface TimetableManagerProps {
  timetable: TimetableItem[];
  rooms: Room[];
  title?: string;
  subtitle?: string;
}

export const TimetableManager: React.FC<TimetableManagerProps> = ({
  timetable,
  rooms,
  title = 'Reference Timetable & Instructional Schedules',
  subtitle = 'Contextual academic schedules organized hierarchically by Campus Block, Room, and Day to escalate incident priority and schedule non-disruptive maintenance.'
}) => {
  // Build room-to-block lookup map
  const roomBlockMap: Record<string, string> = {};
  rooms.forEach(r => {
    if (r.code && r.block) {
      roomBlockMap[r.code.toUpperCase()] = r.block.toUpperCase();
    }
  });

  // Helper function to extract block reliably from room code or room map
  const getBlockForRoom = (roomCode: string): string => {
    if (!roomCode) return 'Campus';
    const norm = roomCode.toUpperCase();
    if (roomBlockMap[norm]) return roomBlockMap[norm];
    if (norm.includes('-')) return norm.split('-')[0];
    return norm.charAt(0);
  };

  // Dynamically extract all blocks present in rooms or timetable
  const dynamicBlocks = Array.from(new Set([
    ...rooms.map(r => r.block?.toUpperCase()),
    ...timetable.map(t => getBlockForRoom(t.room_code))
  ].filter(Boolean))).sort();

  const [selectedBlock, setSelectedBlock] = useState<string>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [selectedRoom, setSelectedRoom] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'cards' | 'day_matrix'>('cards');

  const days = ['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Filter timetable
  const filtered = timetable.filter(item => {
    const itemBlock = getBlockForRoom(item.room_code);
    if (selectedBlock !== 'ALL' && itemBlock !== selectedBlock) return false;
    if (selectedDay !== 'ALL' && item.day && item.day.toLowerCase() !== selectedDay.toLowerCase()) return false;
    if (selectedRoom !== 'ALL' && item.room_code.toUpperCase() !== selectedRoom.toUpperCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.subject.toLowerCase().includes(q) ||
        item.room_code.toLowerCase().includes(q) ||
        (item.faculty && item.faculty.toLowerCase().includes(q)) ||
        (item.branch && item.branch.toLowerCase().includes(q)) ||
        itemBlock.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Rooms available for the selected block
  const availableRoomsInBlock = selectedBlock === 'ALL'
    ? rooms
    : rooms.filter(r => r.block?.toUpperCase() === selectedBlock);

  // Group by day for day_matrix view
  const groupedByDay: Record<string, TimetableItem[]> = {};
  ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(d => {
    groupedByDay[d] = filtered.filter(item => item.day?.toLowerCase() === d.toLowerCase());
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'var(--font-heading)' }}>
            <Calendar size={22} color="var(--color-primary)" />
            {title} ({filtered.length} sessions)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            {subtitle}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', background: 'var(--bg-surface)', padding: '0.2rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'cards' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('cards')}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            <ListFilter size={13} /> Session Cards
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'day_matrix' ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setViewMode('day_matrix')}
            style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
          >
            <Grid size={13} /> Day Matrix
          </button>
        </div>
      </div>

      {/* 1. STEP 1: Academic Block Selector Cards */}
      <div>
        <label style={{ fontSize: '0.76rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--primary-dark)', marginBottom: '0.45rem', display: 'block', fontFamily: 'var(--font-heading)' }}>
          Select Campus Block to View Timetables
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={() => {
              setSelectedBlock('ALL');
              setSelectedRoom('ALL');
            }}
            className={`card ${selectedBlock === 'ALL' ? 'card-interactive' : ''}`}
            style={{
              padding: '0.75rem 0.9rem',
              cursor: 'pointer',
              border: '1px solid',
              borderTop: selectedBlock === 'ALL' ? '3px solid var(--color-primary)' : '3px solid var(--border-subtle)',
              borderColor: selectedBlock === 'ALL' ? 'var(--color-primary)' : 'var(--border-subtle)',
              background: selectedBlock === 'ALL' ? 'var(--color-primary-subtle)' : 'var(--bg-card)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.88rem', color: selectedBlock === 'ALL' ? 'var(--color-primary-dark)' : 'var(--text-main)' }}>
                All Blocks
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {timetable.length} total classes
              </div>
            </div>
            <Building2 size={16} color={selectedBlock === 'ALL' ? 'var(--color-primary)' : 'var(--text-dim)'} />
          </motion.button>

          {dynamicBlocks.map(b => {
            const count = timetable.filter(t => getBlockForRoom(t.room_code) === b).length;
            const isSelected = selectedBlock === b;
            return (
              <motion.button
                key={b}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => {
                  setSelectedBlock(b);
                  setSelectedRoom('ALL');
                }}
                className={`card ${isSelected ? 'card-interactive' : ''}`}
                style={{
                  padding: '0.75rem 0.9rem',
                  cursor: 'pointer',
                  border: '1px solid',
                  borderTop: isSelected ? '3px solid var(--color-primary)' : '3px solid var(--color-primary-soft)',
                  borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-subtle)',
                  background: isSelected ? 'var(--color-primary-subtle)' : 'var(--bg-card)',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', color: isSelected ? 'var(--color-primary-dark)' : 'var(--text-main)', fontFamily: 'var(--font-heading)' }}>
                    Block {b}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {count} classes
                  </div>
                </div>
                <Building2 size={16} color={isSelected ? 'var(--color-primary)' : 'var(--text-dim)'} />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. STEP 2: Filter Controls & Search */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        flexWrap: 'wrap', 
        gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
        borderLeft: '4px solid var(--color-primary)'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '320px' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search subject, room, professor, branch..."
            style={{ paddingLeft: '2rem', height: '34px', fontSize: '0.82rem' }}
          />
        </div>

        {/* Room Filter Dropdown & Day Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            value={selectedRoom}
            onChange={e => setSelectedRoom(e.target.value)}
            style={{ height: '34px', fontSize: '0.8rem', padding: '0 0.5rem', minWidth: '140px' }}
          >
            <option value="ALL">All Spaces ({availableRoomsInBlock.length})</option>
            {availableRoomsInBlock.map(r => (
              <option key={r.code} value={r.code}>{r.code} ({r.kind})</option>
            ))}
          </select>

          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            {days.map(d => (
              <button
                key={d}
                type="button"
                className={`btn btn-sm ${selectedDay === d ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedDay(d)}
                style={{ fontSize: '0.74rem', padding: '0.2rem 0.55rem' }}
              >
                {d === 'ALL' ? 'All Days' : d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. STEP 3: Display Timetable Sessions in Contained Scroll Deck */}
      {viewMode === 'cards' ? (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {selectedBlock === 'ALL' ? 'All Campus Classes' : `Block ${selectedBlock} Classes`} {selectedDay !== 'ALL' ? `(${selectedDay})` : ''} ({filtered.length})
            </span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Contained Scroll Deck</span>
          </div>

          {filtered.length === 0 ? (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No scheduled instructional sessions match this block, room, or day criteria.
              </p>
            </div>
          ) : (
            <div className="contained-scroll-deck" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.85rem' }}>
              {filtered.map(item => {
                const blockName = getBlockForRoom(item.room_code);
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ y: -2 }}
                    className="card card-interactive"
                    style={{
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem',
                      borderLeft: '4px solid var(--color-primary)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-primary)', fontFamily: 'var(--font-heading)' }}>
                          {item.room_code}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.4rem', fontWeight: 600 }}>
                          (Block {blockName})
                        </span>
                      </div>
                      <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                        {item.activity_type || 'Lecture'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.3 }}>
                      {item.subject}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-body)' }}>
                      <Clock size={13} color="var(--color-primary)" />
                      <span style={{ fontWeight: 700, color: 'var(--color-primary-dark)' }}>{item.day}:</span>
                      <span>{item.start_time} – {item.end_time}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', marginTop: '0.2rem', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <UserCheck size={12} color="var(--color-primary)" /> {item.faculty || 'Department Faculty'}
                      </span>
                      <span className="mono" style={{ color: 'var(--color-primary-dark)', fontWeight: 700 }}>
                        {item.branch} ({item.semester})
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* DAY MATRIX VIEW */
        <div className="contained-scroll-deck" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(dayName => {
            const dayItems = groupedByDay[dayName] || [];
            if (selectedDay !== 'ALL' && selectedDay.toLowerCase() !== dayName.toLowerCase()) return null;
            return (
              <div key={dayName} className="card" style={{ padding: '1rem', borderTop: '3px solid var(--color-primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.4rem' }}>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '0.4rem', fontFamily: 'var(--font-heading)' }}>
                    <Clock size={15} color="var(--color-primary)" /> {dayName}
                  </div>
                  <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>{dayItems.length} scheduled</span>
                </div>

                {dayItems.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                    No instructional classes scheduled for {dayName} in {selectedBlock === 'ALL' ? 'campus' : `Block ${selectedBlock}`}.
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.65rem' }}>
                    {dayItems.map(item => (
                      <div key={item.id} style={{ background: 'var(--bg-surface)', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', borderLeft: '3px solid var(--color-primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--color-primary)' }}>{item.room_code}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.start_time}-{item.end_time}</span>
                        </div>
                        <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-main)' }}>{item.subject}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{item.faculty} · {item.branch}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

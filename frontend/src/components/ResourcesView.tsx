import React, { useState } from 'react';
import { Room, Equipment, TimetableItem } from '../types';
import { MapPin, Cpu, Calendar, Search, Filter, Info } from 'lucide-react';

interface ResourcesViewProps {
  rooms: Room[];
  equipment: Equipment[];
  timetable: TimetableItem[];
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({
  rooms,
  equipment,
  timetable
}) => {
  const [activeTab, setActiveTab] = useState<'TIMETABLE' | 'ROOMS' | 'EQUIPMENT'>('TIMETABLE');
  
  // Timetable filters
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [selectedSection, setSelectedSection] = useState<string>('ALL');
  const [roomSearch, setRoomSearch] = useState<string>('');

  // Equipment filter
  const [equipStatus, setEquipStatus] = useState<string>('ALL');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sections = Array.from(new Set(timetable.map(t => t.section).filter(Boolean)));

  const filteredTimetable = timetable.filter(item => {
    if (selectedDay !== 'ALL' && item.day !== selectedDay) return false;
    if (selectedSection !== 'ALL' && item.section !== selectedSection) return false;
    if (roomSearch.trim() && !item.room_code.toLowerCase().includes(roomSearch.toLowerCase())) return false;
    return true;
  });

  const filteredRooms = rooms.filter(r => {
    if (roomSearch.trim() && !r.code.toLowerCase().includes(roomSearch.toLowerCase())) return false;
    return true;
  });

  const filteredEquipment = equipment.filter(e => {
    if (equipStatus !== 'ALL' && e.status !== equipStatus) return false;
    if (roomSearch.trim() && !(e.room_code || '').toLowerCase().includes(roomSearch.toLowerCase()) && !e.name.toLowerCase().includes(roomSearch.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '0.25rem' }}>
            Campus Resources & Timetable
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Operational campus spaces, physical equipment inventories, and reference academic schedules.
          </p>
        </div>

        {/* Resource View Tabs */}
        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'TIMETABLE' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('TIMETABLE')}
          >
            <Calendar size={14} /> Timetable ({timetable.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'ROOMS' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('ROOMS')}
          >
            <MapPin size={14} /> Campus Spaces ({rooms.length})
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'EQUIPMENT' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('EQUIPMENT')}
          >
            <Cpu size={14} /> Equipment ({equipment.length})
          </button>
        </div>
      </div>

      {/* TIMETABLE VIEW */}
      {activeTab === 'TIMETABLE' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Reference Notice */}
          <div style={{ 
            background: 'var(--color-primary-subtle)', 
            border: '1px solid var(--color-primary-soft)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '0.65rem 0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.8rem',
            color: 'var(--color-primary-dark)'
          }}>
            <Info size={15} style={{ flexShrink: 0 }} />
            <span>
              <b>Reference Configuration Data:</b> Timetable records provide contextual occupancy evidence for priority escalation during active classroom lectures.
            </span>
          </div>

          {/* Filter Bar */}
          <div className="card" style={{ padding: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Day of Week</label>
                <select 
                  className="form-select" 
                  value={selectedDay} 
                  onChange={e => setSelectedDay(e.target.value)}
                >
                  <option value="ALL">All Days</option>
                  {days.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Section / Cohort</label>
                <select 
                  className="form-select" 
                  value={selectedSection} 
                  onChange={e => setSelectedSection(e.target.value)}
                >
                  <option value="ALL">All Sections</option>
                  {sections.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <label className="form-label">Search Room</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. I-302, D-101"
                  value={roomSearch}
                  onChange={e => setRoomSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Timetable Table */}
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Period / Time</th>
                  <th>Room</th>
                  <th>Subject</th>
                  <th>Faculty</th>
                  <th>Section</th>
                  <th>Activity</th>
                </tr>
              </thead>
              <tbody>
                {filteredTimetable.slice(0, 50).map(t => (
                  <tr key={t.id}>
                    <td><b>{t.day}</b></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Period {t.period} ({t.start_time} - {t.end_time})
                    </td>
                    <td>
                      <span className="badge badge-neutral mono">{t.room_code}</span>
                    </td>
                    <td><b>{t.subject}</b></td>
                    <td style={{ color: 'var(--text-body)' }}>{t.faculty}</td>
                    <td>{t.section}</td>
                    <td>
                      <span className={`badge ${t.activity_type === 'LAB' ? 'badge-info' : 'badge-neutral'}`} style={{ fontSize: '0.68rem' }}>
                        {t.activity_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ROOMS VIEW */}
      {activeTab === 'ROOMS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.85rem' }}>
            <div style={{ maxWidth: 300 }}>
              <label className="form-label">Filter Room Code</label>
              <input
                type="text"
                className="form-input"
                placeholder="Search code..."
                value={roomSearch}
                onChange={e => setRoomSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Room Code</th>
                  <th>Academic Block</th>
                  <th>Floor</th>
                  <th>Facility Type</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.slice(0, 60).map(r => (
                  <tr key={r.code}>
                    <td><b className="mono">{r.code}</b></td>
                    <td>Block {r.block}</td>
                    <td>Floor {r.floor}</td>
                    <td>
                      <span className="badge badge-neutral" style={{ fontSize: '0.68rem' }}>
                        {r.kind}
                      </span>
                    </td>
                    <td>{r.department || 'General Campus'}</td>
                    <td>
                      <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>
                        AVAILABLE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EQUIPMENT VIEW */}
      {activeTab === 'EQUIPMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '0.85rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Filter Status</label>
                <select className="form-select" value={equipStatus} onChange={e => setEquipStatus(e.target.value)}>
                  <option value="ALL">All Statuses</option>
                  <option value="WORKING">WORKING</option>
                  <option value="FAULT">FAULT</option>
                  <option value="MAINTENANCE">MAINTENANCE</option>
                </select>
              </div>
              <div>
                <label className="form-label">Search Equipment or Room</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Projector, I-302"
                  value={roomSearch}
                  onChange={e => setRoomSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Equipment Item</th>
                  <th>Location / Room</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredEquipment.slice(0, 60).map(eq => (
                  <tr key={eq.id}>
                    <td>#{eq.id}</td>
                    <td><b>{eq.name}</b></td>
                    <td><span className="badge badge-neutral mono">{eq.room_code || `Room ID ${eq.room_id}`}</span></td>
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
        </div>
      )}

    </div>
  );
};

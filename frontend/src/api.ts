import { Incident, Technician, Room, Equipment, TimetableItem, AnalyticsMetrics, User, AuthResponse, ContactInfo } from './types';

const rawBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api').trim();
const API_BASE = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/$/, '')}/api`;

export function getStoredToken(): string | null {
  return localStorage.getItem('auorbit_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('auorbit_token', token);
  } else {
    localStorage.removeItem('auorbit_token');
  }
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem('auorbit_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null) {
  if (user) {
    localStorage.setItem('auorbit_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('auorbit_user');
  }
}

export async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options?.headers || {})
      }
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `Server responded with ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.error(`AUOrbit API error [${endpoint}]:`, error.message || error);
    throw error;
  }
}


export const api = {
  // Incidents
  getIncidents: () => request<Incident[]>('/incidents'),
  getIncident: (id: number) => request<Incident>(`/incidents/${id}`),
  reportIncident: (data: { reporter: string; description: string; room_code?: string | null; media_urls?: string[] }) =>
    request<Incident>('/incidents', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateIncidentStatus: (id: number, status: string) =>
    request<Incident>(`/incidents/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  incidentAction: (id: number, action: string, notes?: string) =>
    request<Incident>(`/incidents/${id}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, notes })
    }),

  // Work Orders
  workOrderAction: (
    workId: number,
    action: string,
    payload?: { outcome?: string; notes?: string; technician_id?: number; resolution_media?: string[] }
  ) =>
    request<Incident>(`/work-orders/${workId}/action`, {
      method: 'POST',
      body: JSON.stringify({ action, ...payload })
    }),
  reassignWorkOrder: (workId: number, technician_id: number, notes?: string) =>
    request<Incident>(`/work-orders/${workId}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ technician_id, notes })
    }),

  // User Management & Governance
  getUsers: () => request<User[]>('/users'),
  createUser: (data: { email: string; password: string; full_name: string; role: string; department?: string; specialty?: string; phone?: string; organization_id?: number }) =>
    request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateUser: (id: number, data: Partial<User>) =>
    request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteUser: (id: number) =>
    request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE'
    }),

  // Technicians
  getTechnicians: (specialty?: string) =>
    request<Technician[]>(`/technicians${specialty ? `?specialty=${specialty}` : ''}`),
  setTechnicianStatus: (id: number, status: string) =>
    request<{ id: number; status: string }>(`/technicians/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Rooms & Facilities
  getRooms: (block?: string, kind?: string) => {
    const params = new URLSearchParams();
    if (block) params.append('block', block);
    if (kind) params.append('kind', kind);
    const qs = params.toString();
    return request<Room[]>(`/rooms${qs ? `?${qs}` : ''}`);
  },
  updateRoomAvailability: (code: string, status: string) =>
    request<{ code: string; availability: string }>(`/rooms/${code}/availability`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),
  getRoomEquipment: (code: string) => request<Equipment[]>(`/rooms/${code}/equipment`),

  // Equipment Management
  getEquipment: (status?: string, block?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (block) params.append('block', block);
    const qs = params.toString();
    return request<Equipment[]>(`/equipment${qs ? `?${qs}` : ''}`);
  },
  updateEquipmentStatus: (id: number, status: string) =>
    request<{ id: number; name: string; status: string }>(`/equipment/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Timetable
  getTimetable: (params?: { room_code?: string; section?: string; day?: string }) => {
    const search = new URLSearchParams();
    if (params?.room_code) search.append('room_code', params.room_code);
    if (params?.section) search.append('section', params.section);
    if (params?.day) search.append('day', params.day);
    const qs = search.toString();
    return request<TimetableItem[]>(`/timetable${qs ? `?${qs}` : ''}`);
  },
  createTimetableEntry: (data: Partial<TimetableItem>) =>
    request<TimetableItem>('/timetable', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateTimetableEntry: (id: number, data: Partial<TimetableItem>) =>
    request<TimetableItem>(`/timetable/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteTimetableEntry: (id: number) =>
    request<{ status: string; id: number }>(`/timetable/${id}`, {
      method: 'DELETE'
    }),

  // Analytics & Health
  getAnalytics: () => request<AnalyticsMetrics>('/analytics/metrics'),
  getHealth: () => request<{ status: string }>('/health'),

  // Optional WhatsApp Integration
  sendWhatsAppTest: (phone?: string) =>
    request<{ sent: boolean; target: string }>(`/whatsapp/test${phone ? `?phone=${phone}` : ''}`, {
      method: 'POST'
    }),

  // SSE Real-Time Event Streaming
  subscribeIncidentStream: (
    incidentId: number,
    onEvent: (event: any) => void,
    onError?: (err: any) => void
  ): (() => void) => {
    const token = getStoredToken();
    const url = `${API_BASE}/incidents/${incidentId}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('agent_event', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch (err) {
        console.error('Failed to parse SSE event payload:', err);
      }
    });

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
    };
  },
  getAgentRunEvents: (runId: number) => request<any[]>(`/agent-runs/${runId}/events`),
  getIncidentRuns: (incidentId: number) => request<any[]>(`/incidents/${incidentId}/runs`),

  // Contact & System Information
  getContactInfo: () => request<ContactInfo>('/system/contact'),
  sendContactMessage: (data: { name: string; email: string; subject?: string; message: string }) =>
    request<{ status: string; ticket_id: number; recipient_email: string; recipient_phone: string; campus_hotline: string; mailto_url: string; message: string }>('/system/contact', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Media Upload (Audio, Photo, Video)
  uploadMedia: (data: { media_url: string; type?: 'audio' | 'image' | 'video' }) =>
    request<{ status: string; url: string; type: string; message: string }>('/media/upload', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Authentication & Registration
  register: (data: { email: string; password: string; full_name: string; role: string; department?: string; specialty?: string; phone?: string; avatar_url?: string }) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  getMe: () => request<User>('/auth/me'),
  updateProfile: (data: { full_name?: string; department?: string; specialty?: string; phone?: string; avatar_url?: string; current_password?: string; new_password?: string }) =>
    request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    })
};



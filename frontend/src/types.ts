export type Role = 'STUDENT' | 'FACULTY' | 'TECHNICIAN' | 'ADMIN' | 'UNIVERSITY_ADMIN' | 'SUPER_ADMIN';

export interface Organization {
  id: number;
  name: string;
  slug: string;
  domain?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface User {
  id: number;
  organization_id: number;
  email: string;
  full_name: string;
  role: Role;
  department?: string | null;
  specialty?: string | null;
  phone?: string | null;
  avatar_color?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message: string;
}

export interface AgentEvent {
  id: number;
  agent_run_id?: number | null;
  agent: string;
  action: string;
  tool?: string;
  detail?: any;
  status: string;
  created_at: string;
}

export interface AgentRun {
  id: number;
  incident_id: number;
  run_number: number;
  trigger_reason: string;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  metadata_payload?: Record<string, any>;
  events: AgentEvent[];
}

export interface WorkOrderItem {
  id: number;
  organization_id?: number;
  status: 'PENDING' | 'ASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
  technician?: string | null;
  technician_id?: number | null;
  scheduled_for?: string | null;
  started_at?: string | null;
  notes?: string | null;
}

export interface UnderstandingDetail {
  problem_type?: string;
  category?: string;
  location?: string;
  is_location_ambiguous?: boolean;
  description?: string;
  urgency_signal?: string;
  affected_activity?: string;
  confidence?: number;
  reasoning_summary?: string;
  source?: string;
}

export interface PriorityAssessment {
  priority: string;
  is_timetable_escalated?: boolean;
  timetable_conflict?: boolean;
  timetable_evidence?: string;
  is_emergency?: boolean;
  confidence?: number;
  reasoning?: string;
  evidence?: string[];
}

export interface ResourceDecision {
  selected_technician_id?: number;
  selected_technician_name?: string;
  capability_requirement?: string;
  score?: number;
  candidates?: Array<{ id: number; name: string; specialty: string; status: string; score?: number }>;
  excluded_technician_ids?: number[];
  decision_reason?: string;
  is_feasible?: boolean;
}

export interface SchedulingDecision {
  scheduled?: boolean;
  scheduled_start?: string;
  scheduled_end?: string;
  target_date?: string;
  room_code?: string;
  technician_id?: number;
  priority?: string;
  conflict_detected?: boolean;
  conflict_reason?: string;
  decision_reason?: string;
  policy_applied?: string;
}

export interface Incident {
  id: number;
  organization_id: number;
  reporter: string;
  description: string;
  room_code?: string | null;
  category: string;
  priority: 'EMERGENCY' | 'HIGH' | 'NORMAL' | 'LOW';
  status: 'REPORTED' | 'UNDERSTOOD' | 'PRIORITIZED' | 'ASSIGNED' | 'SCHEDULED' | 'IN_PROGRESS' | 'AWAITING_VERIFICATION' | 'RESOLVED' | 'REOPENED' | 'REPLANNING' | 'CLOSED';
  replan_count: number;
  created_at: string;
  resolution?: string | null;
  understanding?: UnderstandingDetail | null;
  priority_assessment?: PriorityAssessment | null;
  resource_decision?: ResourceDecision | null;
  scheduling_decision?: SchedulingDecision | null;
  work_order?: WorkOrderItem | null;
  work_orders?: WorkOrderItem[];
  runs?: AgentRun[];
  events?: AgentEvent[];
}

export interface Technician {
  id: number;
  organization_id?: number;
  name: string;
  specialty: string;
  status: 'AVAILABLE' | 'BUSY' | 'OFF_DUTY' | 'ASSIGNED' | 'WORKING';
  phone?: string | null;
}

export interface Room {
  id?: number;
  organization_id?: number;
  code: string;
  block: string;
  floor: number;
  kind: string;
  availability: string;
  department?: string | null;
}

export interface Equipment {
  id: number;
  organization_id?: number;
  room_id: number;
  room_code?: string;
  block?: string;
  floor?: number;
  name: string;
  status: 'WORKING' | 'FAULT' | 'MAINTENANCE' | 'REPLACED';
  last_updated?: string;
}

export interface TimetableItem {
  id: number;
  organization_id?: number;
  room_code: string;
  branch: string;
  academic_year: string;
  semester: string;
  section: string;
  subject: string;
  faculty: string;
  day: string;
  period: number;
  start_time: string;
  end_time: string;
  activity_type: string;
  is_reference_data: boolean;
}

export interface AnalyticsMetrics {
  organization_id?: number;
  total_incidents: number;
  resolved_incidents: number;
  active_incidents: number;
  emergency_incidents: number;
  replan_rate_pct: number;
  replan_incidents_count: number;
  total_technicians: number;
  available_technicians: number;
  busy_technicians: number;
  technician_utilization_pct: number;
  total_rooms: number;
  total_equipment: number;
  fault_equipment_count: number;
  equipment_health_pct: number;
  category_distribution: Record<string, number>;
  agent_pipeline_success_rate_pct: number;
  avg_dispatch_seconds: number;
}

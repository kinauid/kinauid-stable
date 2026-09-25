import type * as THREE from 'three';
import type { Agent, AgentStatus, Division, OfficeZone } from '~/schemas/office.schema';

export interface VirtualOffice3DProps {
  agents: Agent[];
  zones?: OfficeZone[];
  selectedAgentId?: string;
  onSelectAgent?: (agent: Agent) => void;
  onUpdateStatus?: (agentId: string, status: AgentStatus) => void;
  onAssignTask?: (agentId: string, task: string, project?: string) => void;
  onPingAgent?: (agentId: string) => void;
  className?: string;
}

export interface DivisionConfigItem {
  cameraTarget: [number, number, number];
  icon: string;
  color: string;
  label: string;
  shortName: string;
}

export const DIVISION_CONFIG: Record<Division, DivisionConfigItem> = {
  operations: {
    cameraTarget: [-6.5, 0.8, 7.5],
    icon: 'Building',
    color: '#0284c7',
    label: 'Operations Center',
    shortName: 'Ops',
  },
  marketing: {
    cameraTarget: [6.5, 0.8, 7.5],
    icon: 'BarChart2',
    color: '#ec4899',
    label: 'Marketing Studio',
    shortName: 'Marketing',
  },
  finance: {
    cameraTarget: [6.5, 0.8, -8.5],
    icon: 'Database',
    color: '#10b981',
    label: 'Finance Hub',
    shortName: 'Finance',
  },
  sales: {
    cameraTarget: [-6.5, 0.8, -1.0],
    icon: 'Users',
    color: '#8b5cf6',
    label: 'Sales Studio',
    shortName: 'Sales',
  },
  development: {
    cameraTarget: [6.5, 0.8, -1.0],
    icon: 'ListTodo',
    color: '#6366f1',
    label: 'Delivery Studio',
    shortName: 'Delivery',
  },
  communication: {
    cameraTarget: [-6.5, 0.8, -8.5],
    icon: 'MessageSquare',
    color: '#f59e0b',
    label: 'Communication Hub',
    shortName: 'Comm',
  },
  general_hr: {
    cameraTarget: [0, 0.8, 0],
    icon: 'Briefcase',
    color: '#64748b',
    label: 'People & HR Floor',
    shortName: 'HR',
  },
};

export const AGENT_STATUS_CONFIG: Record<
  AgentStatus,
  { label: string; bgClass: string; textClass: string; ringColor: number; orbColor: string }
> = {
  working: {
    label: 'Bekerja',
    bgClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    textClass: 'text-emerald-600',
    ringColor: 0x10b981,
    orbColor: '#10b981',
  },
  meeting: {
    label: 'Rapat',
    bgClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    textClass: 'text-indigo-600',
    ringColor: 0x6366f1,
    orbColor: '#6366f1',
  },
  break: {
    label: 'Istirahat',
    bgClass: 'bg-amber-50 text-amber-700 border-amber-200',
    textClass: 'text-amber-600',
    ringColor: 0xf59e0b,
    orbColor: '#f59e0b',
  },
  away: {
    label: 'Pergi',
    bgClass: 'bg-slate-100 text-slate-600 border-slate-200',
    textClass: 'text-slate-500',
    ringColor: 0x94a3b8,
    orbColor: '#94a3b8',
  },
  offline: {
    label: 'Offline',
    bgClass: 'bg-slate-100 text-slate-500 border-slate-200',
    textClass: 'text-slate-400',
    ringColor: 0x94a3b8,
    orbColor: '#94a3b8',
  },
};

export interface CameraTransitionState {
  isMoving: boolean;
  startCamPos: THREE.Vector3;
  targetCamPos: THREE.Vector3;
  startLookAt: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  startZoom: number;
  targetZoom: number;
  progress: number;
  duration: number;
}

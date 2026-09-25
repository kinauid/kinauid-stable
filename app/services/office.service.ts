import type { ActionFunctionArgs } from 'react-router';
import {
  INITIAL_AGENTS,
  INITIAL_OFFICE_ZONES,
  type Agent,
  type AgentStatus,
  type OfficeZone,
  UpdateAgentStatusSchema,
  AssignTaskSchema,
} from '~/schemas/office.schema';
import { cacheData, invalidateCacheByTag } from '~/utils/cache';
import { successResponse, errorResponse, ApiError } from '~/utils/apiResponse';
import { ErrorCatch } from '~/lib/api';

// In-memory runtime database for agents state in Virtual Office
let OFFICE_AGENTS_DB: Agent[] = [...INITIAL_AGENTS];
const OFFICE_ZONES_DB: OfficeZone[] = [...INITIAL_OFFICE_ZONES];

export class OfficeService {
  static async getOfficeData() {
    return cacheData(
      'office:virtual_overview',
      60,
      async () => {
        try {
          const agents = OFFICE_AGENTS_DB;
          const totalAgents = agents.length;
          const workingCount = agents.filter((a) => a.status === 'working').length;
          const meetingCount = agents.filter((a) => a.status === 'meeting').length;
          const breakCount = agents.filter((a) => a.status === 'break').length;
          const awayCount = agents.filter((a) => a.status === 'away' || a.status === 'offline').length;
          const avgFocus = Math.round(
            agents.reduce((acc, a) => acc + a.focusScore, 0) / (totalAgents || 1)
          );

          return {
            agents,
            zones: OFFICE_ZONES_DB,
            stats: {
              totalAgents,
              workingCount,
              meetingCount,
              breakCount,
              awayCount,
              avgFocus,
              activeZones: OFFICE_ZONES_DB.length,
            },
          };
        } catch (error) {
          ErrorCatch({ error, context: 'OfficeService:getOfficeData' });
          return {
            agents: INITIAL_AGENTS,
            zones: INITIAL_OFFICE_ZONES,
            stats: {
              totalAgents: INITIAL_AGENTS.length,
              workingCount: 3,
              meetingCount: 2,
              breakCount: 1,
              awayCount: 1,
              avgFocus: 91,
              activeZones: 5,
            },
          };
        }
      },
      { tags: ['office'] }
    );
  }

  static async updateAgentStatus(agentId: string, status: AgentStatus) {
    const agent = OFFICE_AGENTS_DB.find((a) => a.id === agentId);
    if (!agent) {
      throw new ApiError(`Pegawai dengan ID ${agentId} tidak ditemukan`, 404);
    }
    agent.status = status;
    agent.lastActive = 'Baru saja diubah';
    invalidateCacheByTag('office');
    return { success: true, agent };
  }

  static async assignTask(agentId: string, task: string, project?: string) {
    const agent = OFFICE_AGENTS_DB.find((a) => a.id === agentId);
    if (!agent) {
      throw new ApiError(`Pegawai dengan ID ${agentId} tidak ditemukan`, 404);
    }
    agent.currentTask = task;
    if (project) {
      agent.currentProject = project;
    }
    agent.lastActive = 'Tugas diperbarui';
    invalidateCacheByTag('office');
    return { success: true, agent };
  }

  static async pingAgent(agentId: string, message?: string) {
    const agent = OFFICE_AGENTS_DB.find((a) => a.id === agentId);
    if (!agent) {
      throw new ApiError(`Pegawai dengan ID ${agentId} tidak ditemukan`, 404);
    }
    return {
      success: true,
      message: `Ping berhasil dikirim ke ${agent.name} (${agent.role})!`,
      pingTime: new Date().toLocaleTimeString('id-ID'),
    };
  }
}

export async function handleOfficeAction({ request }: ActionFunctionArgs) {
  try {
    const formData = await request.formData();
    const intent = formData.get('intent') as string;

    const strategies: Record<string, () => Promise<Response>> = {
      'update-agent-status': async () => {
        const agentId = String(formData.get('agentId') || '');
        const status = String(formData.get('status') || '');
        const parsed = UpdateAgentStatusSchema.safeParse({ agentId, status });
        if (!parsed.success) {
          const errMsg = parsed.error.issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Data status tidak valid';
          throw new ApiError(errMsg, 400);
        }
        const res = await OfficeService.updateAgentStatus(parsed.data.agentId, parsed.data.status);
        return successResponse(res);
      },
      'assign-agent-task': async () => {
        const agentId = String(formData.get('agentId') || '');
        const task = String(formData.get('task') || '');
        const project = formData.get('project') ? String(formData.get('project')) : undefined;
        const parsed = AssignTaskSchema.safeParse({ agentId, task, project });
        if (!parsed.success) {
          const errMsg = parsed.error.issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Data penugasan tidak valid';
          throw new ApiError(errMsg, 400);
        }
        const res = await OfficeService.assignTask(parsed.data.agentId, parsed.data.task, parsed.data.project);
        return successResponse(res);
      },
      'ping-agent': async () => {
        const agentId = String(formData.get('agentId') || '');
        if (!agentId) throw new ApiError('ID Pegawai wajib diisi untuk ping', 400);
        const res = await OfficeService.pingAgent(agentId);
        return successResponse(res);
      },
    };

    const strategy = strategies[intent];
    if (!strategy) {
      throw new ApiError(`Aksi "${intent}" tidak dikenali di modul Virtual Office`, 400);
    }

    return await strategy();
  } catch (error) {
    ErrorCatch({ error, context: 'handleOfficeAction' });
    return errorResponse(error);
  }
}

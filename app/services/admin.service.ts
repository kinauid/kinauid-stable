import type { ActionFunctionArgs } from 'react-router';
import {
  cacheData,
  invalidateCacheByTag,
  ApiError,
  errorResponse,
  routes,
  type AuthUser,
  type Role,
} from '~/builder';
import { setFlashMessage, flashRedirect } from '~/lib/flash.server';
import { ErrorCatch } from '~/lib/api';
import {
  CreateUserSchema,
  type AdminUserItem,
  type AdminManageState,
  type CreateUserInput,
} from '~/schemas/admin.schema';

// ============================================================================
// IN-MEMORY REPOSITORY (Demo Data Store)
// ============================================================================

let USERS_STORE: AdminUserItem[] = [
  {
    id: 'usr-01',
    name: 'Rayhanda Putra',
    email: 'rayhan@rayeen.web.id',
    role: 'admin',
    status: 'active',
    lastActive: 'Just now',
    createdAt: '2026-01-10',
  },
  {
    id: 'usr-02',
    name: 'Sarah Jenkins',
    email: 'sarah.j@enterprise.io',
    role: 'editor',
    status: 'active',
    lastActive: '10 mins ago',
    createdAt: '2026-02-14',
  },
  {
    id: 'usr-03',
    name: 'Alex Thorne',
    email: 'alex.t@devsec.net',
    role: 'viewer',
    status: 'pending',
    lastActive: '2 hours ago',
    createdAt: '2026-03-01',
  },
  {
    id: 'usr-04',
    name: 'Michael Chang',
    email: 'm.chang@fintech.co',
    role: 'editor',
    status: 'suspended',
    lastActive: '3 days ago',
    createdAt: '2026-01-20',
  },
  {
    id: 'usr-05',
    name: 'Elena Rostova',
    email: 'elena@quantum.org',
    role: 'admin',
    status: 'active',
    lastActive: 'Yesterday',
    createdAt: '2026-02-28',
  },
];

// ============================================================================
// ADMIN SERVICE (Business Logic & Data Access Layer)
// ============================================================================

export const AdminService = {
  /**
   * Fetches paginated/filtered user list with in-memory caching and simulated role permissions.
   */
  async getUsers(state: AdminManageState, sessionUser?: AuthUser | null) {
    const currentSimulatedRole = state.simulatedRole || sessionUser?.role || 'admin';

    const user: AuthUser = {
      id: sessionUser?.id || 'usr-master-01',
      name: sessionUser?.name || 'Rayhanda Putra',
      email: sessionUser?.email || 'rayhan@rayeen.web.id',
      role: currentSimulatedRole as Role,
      permissions:
        currentSimulatedRole === 'admin'
          ? ['user:read', 'user:create', 'user:update', 'user:delete', 'reports:export']
          : currentSimulatedRole === 'editor'
            ? ['user:read', 'user:update']
            : ['user:read'],
    };

    const allUsers = await cacheData(
      'dashboard:admin:users:raw',
      30,
      async () => [...USERS_STORE],
      { tags: ['admin-users'], staleWhileRevalidateSeconds: 60 }
    );

    const q = (state.search || '').toLowerCase();
    const filtered = allUsers.filter(
      (u) =>
        (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
        (state.role === 'all' || u.role === state.role) &&
        (state.status === 'all' || u.status === state.status)
    );

    return {
      users: filtered,
      totalCount: allUsers.length,
      filteredCount: filtered.length,
      user,
    };
  },

  /**
   * Creates a new user record and invalidates user cache.
   */
  async createUser(input: CreateUserInput): Promise<AdminUserItem> {
    const newUser: AdminUserItem = {
      id: `usr-${Date.now().toString().slice(-4)}`,
      name: input.name,
      email: input.email,
      role: input.role,
      status: input.status,
      lastActive: 'Baru saja',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    USERS_STORE.unshift(newUser);
    invalidateCacheByTag('admin-users');
    return newUser;
  },

  /**
   * Deletes a user record by ID and invalidates cache.
   */
  async deleteUser(id: string): Promise<boolean> {
    const initialLen = USERS_STORE.length;
    USERS_STORE = USERS_STORE.filter((u) => u.id !== id);
    invalidateCacheByTag('admin-users');
    return USERS_STORE.length < initialLen;
  },

  /**
   * Toggles active/suspended status of a user record.
   */
  async toggleStatus(id: string): Promise<AdminUserItem> {
    const user = USERS_STORE.find((u) => u.id === id);
    if (!user) {
      throw ApiError.notFound('Pengguna tidak ditemukan');
    }

    user.status = user.status === 'active' ? 'suspended' : 'active';
    invalidateCacheByTag('admin-users');
    return user;
  },
};

// ============================================================================
// SERVICE STRATEGY DISPATCHER (Zero-Logic Action Handler)
// ============================================================================

export async function handleAdminAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get('intent') || '');

  try {
    const intentHandlers: Record<string, () => Promise<Response>> = {
      'create-user': async () => {
        const parsed = CreateUserSchema.safeParse({
          name: formData.get('name'),
          email: formData.get('email'),
          role: formData.get('role'),
          status: formData.get('status') || 'active',
        });
        if (!parsed.success) return errorResponse(parsed.error);

        const user = await AdminService.createUser(parsed.data);
        const cookie = await setFlashMessage(request, {
          type: 'success',
          message: `Pengguna ${user.name} berhasil ditambahkan!`,
        });
        return flashRedirect(routes.dashboard.admin.manage(), cookie);
      },

      'delete-user': async () => {
        await AdminService.deleteUser(String(formData.get('id') || ''));
        const cookie = await setFlashMessage(request, {
          type: 'success',
          message: 'Pengguna berhasil dihapus.',
        });
        return flashRedirect(routes.dashboard.admin.manage(), cookie);
      },

      'toggle-status': async () => {
        const user = await AdminService.toggleStatus(String(formData.get('id') || ''));
        const cookie = await setFlashMessage(request, {
          type: 'success',
          message: `Status diperbarui ke ${user.status}`,
        });
        return flashRedirect(routes.dashboard.admin.manage(), cookie);
      },
    };

    const handler = intentHandlers[intent];
    if (!handler) {
      return errorResponse(ApiError.badRequest(`Intent '${intent}' tidak valid`));
    }

    return await handler();
  } catch (error) {
    ErrorCatch({ error, context: `action:admin-manage:${intent}` });
    return errorResponse(error);
  }
}

export default AdminService;

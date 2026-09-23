/**
 * Role-Based Access Control (RBAC) & Permission Engine Definitions
 * Type-safe constants, enums, matrices, and evaluation helpers for React Router v7.
 */

export type Role = 'superadmin' | 'admin' | 'editor' | 'viewer' | 'guest';

export const ROLES = {
  SUPERADMIN: 'superadmin',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
  GUEST: 'guest',
} as const;

export type Permission =
  // User Management
  | 'user:read'
  | 'user:create'
  | 'user:update'
  | 'user:delete'
  // Role & Access Control
  | 'role:manage'
  | 'role:assign'
  // Settings & Configuration
  | 'settings:read'
  | 'settings:update'
  // Reports & Analytics
  | 'reports:view'
  | 'reports:export'
  | 'analytics:view'
  // System Administration & Security
  | 'system:admin'
  | 'system:logs'
  | 'audit:view';

export const PERMISSIONS = {
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  ROLE_MANAGE: 'role:manage',
  ROLE_ASSIGN: 'role:assign',
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  ANALYTICS_VIEW: 'analytics:view',
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_LOGS: 'system:logs',
  AUDIT_VIEW: 'audit:view',
} as const;

/**
 * Standard Role to Permission Matrix.
 * Defines the baseline permissions granted to each standard role.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  superadmin: [
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'role:manage',
    'role:assign',
    'settings:read',
    'settings:update',
    'reports:view',
    'reports:export',
    'analytics:view',
    'system:admin',
    'system:logs',
    'audit:view',
  ],
  admin: [
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'role:manage',
    'settings:read',
    'settings:update',
    'reports:view',
    'reports:export',
    'analytics:view',
    'audit:view',
  ],
  editor: ['user:read', 'user:update', 'settings:read', 'reports:view', 'analytics:view'],
  viewer: ['user:read', 'reports:view', 'analytics:view'],
  guest: [],
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role | string;
  permissions?: (Permission | string)[];
  avatar?: string;
  [key: string]: any;
}

export interface MetaAccessConfig {
  /**
   * Allowed roles for this route or action.
   * If specified, user must have at least one of these roles (or be 'superadmin').
   */
  roles?: (Role | string)[];
  /**
   * Required permissions.
   * By default, user must have AT LEAST ONE of these permissions, unless `requireAll` is true.
   */
  permissions?: (Permission | string)[];
  /**
   * If true, user must possess ALL specified permissions.
   * Default: false (any permission satisfies).
   */
  requireAll?: boolean;
  /**
   * Custom redirect path when user is unauthenticated.
   * Defaults to '/login' or '/auth/login'.
   */
  redirectTo?: string;
  /**
   * Custom forbidden error message.
   */
  forbiddenMessage?: string;
}

/**
 * Computes the complete set of effective permissions for a user,
 * combining base role permissions with custom assigned permissions.
 */
export function getUserPermissions(user: AuthUser | null | undefined): (Permission | string)[] {
  if (!user) return [];
  if (user.role === 'superadmin') {
    return Object.values(PERMISSIONS);
  }

  const roleBase = (ROLE_PERMISSIONS[user.role as Role] as Permission[]) || [];
  const customPerms = user.permissions || [];
  return Array.from(new Set([...roleBase, ...customPerms]));
}

/**
 * Evaluates whether a user has one or more required roles.
 */
export function hasRole(
  user: AuthUser | null | undefined,
  role: Role | string | (Role | string)[]
): boolean {
  if (!user) return false;
  if (user.role === 'superadmin' || role === '*') return true;

  const targetRoles = Array.isArray(role) ? role : [role];
  return targetRoles.some((r) => r === '*' || user.role === r);
}

/**
 * Evaluates whether a user has one or more required permissions.
 */
export function hasPermission(
  user: AuthUser | null | undefined,
  permission: Permission | string | (Permission | string)[],
  requireAll: boolean = false
): boolean {
  if (!user) return false;
  if (user.role === 'superadmin') return true;

  const userPerms = getUserPermissions(user);
  const targetPerms = Array.isArray(permission) ? permission : [permission];

  if (targetPerms.length === 0) return true;

  if (requireAll) {
    return targetPerms.every((p) => p === '*' || userPerms.includes(p));
  }

  return targetPerms.some((p) => p === '*' || userPerms.includes(p));
}

export interface AccessCheckResult {
  allowed: boolean;
  status: 200 | 401 | 403;
  message?: string;
  requiredRoles?: string[];
  requiredPermissions?: string[];
}

/**
 * Pure evaluation function for MetaAccessConfig against an AuthUser.
 */
export function checkMetaAccess(
  metaAccess: MetaAccessConfig | null | undefined,
  user: AuthUser | null | undefined
): AccessCheckResult {
  if (!metaAccess) {
    return { allowed: true, status: 200 };
  }

  const { roles, permissions, requireAll = false, forbiddenMessage } = metaAccess;

  // 1. Authentication Check
  if (!user) {
    return {
      allowed: false,
      status: 401,
      message: 'Unauthenticated: Please log in to access this resource.',
    };
  }

  // Superadmin bypasses all role & permission barriers
  if (user.role === 'superadmin') {
    return { allowed: true, status: 200 };
  }

  // 2. Role Check
  if (roles && roles.length > 0) {
    const rolePassed = hasRole(user, roles);
    if (!rolePassed) {
      return {
        allowed: false,
        status: 403,
        message:
          forbiddenMessage ||
          `Forbidden: Role '${user.role}' does not have access. Required roles: ${roles.join(', ')}`,
        requiredRoles: roles as string[],
      };
    }
  }

  // 3. Permission Check
  if (permissions && permissions.length > 0) {
    const permissionPassed = hasPermission(user, permissions, requireAll);
    if (!permissionPassed) {
      return {
        allowed: false,
        status: 403,
        message:
          forbiddenMessage ||
          `Forbidden: Insufficient permissions. Required: ${permissions.join(requireAll ? ' AND ' : ' OR ')}`,
        requiredPermissions: permissions as string[],
      };
    }
  }

  return { allowed: true, status: 200 };
}

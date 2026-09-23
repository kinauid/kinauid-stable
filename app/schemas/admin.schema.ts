import { z } from 'zod';
import type { BadgeProps } from '~/builder';

// ============================================================================
// 1. DOMAIN INTERFACES & URL STATE
// ============================================================================

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'suspended' | 'pending';
  lastActive: string;
  createdAt: string;
}

export interface AdminManageState {
  search: string;
  role: 'all' | 'admin' | 'editor' | 'viewer';
  status: 'all' | 'active' | 'suspended' | 'pending';
  simulatedRole?: 'admin' | 'editor' | 'viewer';
  page: number;
  isCreateModalOpen: boolean;
}

// ============================================================================
// 2. ZOD VALIDATION SCHEMAS
// ============================================================================

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  role: z.enum(['admin', 'editor', 'viewer']),
  status: z.enum(['active', 'suspended', 'pending']).default('active'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const DeleteUserSchema = z.object({
  id: z.string().min(1, 'ID Pengguna wajib diisi'),
});

export const ToggleStatusSchema = z.object({
  id: z.string().min(1, 'ID Pengguna wajib diisi'),
});

// ============================================================================
// 3. UI BADGE MAPPINGS & SCHEMA PRESETS
// ============================================================================

export const ROLE_BADGES: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  admin: { label: 'Admin', variant: 'info' },
  editor: { label: 'Editor', variant: 'primary' },
  viewer: { label: 'Viewer', variant: 'secondary' },
};

export const STATUS_BADGES: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
  active: { label: 'Active', variant: 'success' },
  suspended: { label: 'Suspended', variant: 'danger' },
  pending: { label: 'Pending', variant: 'warning' },
};

export const ROLE_OPTIONS = [
  { value: 'all', label: 'Semua Role' },
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'viewer', label: 'Viewer' },
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua Status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'pending', label: 'Pending' },
];

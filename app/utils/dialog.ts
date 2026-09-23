import Swal, { type SweetAlertOptions } from 'sweetalert2';

export interface ConfirmDialogOptions {
  name?: string;
  title?: string;
  text?: string;
  icon?: 'warning' | 'error' | 'info' | 'question' | 'success';
  confirmButtonText?: string;
  cancelButtonText?: string;
  confirmButtonClass?: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

const DEFAULT_POPUP_CLASS =
  '!rounded-[24px] !bg-[var(--card)] !text-[var(--foreground)] !border !border-[var(--border)] shadow-[var(--shadow-card)]';

const DEFAULT_CONFIRM_CLASS =
  '!rounded-[1000px] !px-6 !py-2 font-semibold transition-opacity hover:opacity-90';

const DEFAULT_CANCEL_CLASS =
  '!rounded-[1000px] !bg-[var(--surface-subtle)] !text-[var(--foreground)] !border !border-[var(--border)] !px-6 !py-2 transition-opacity hover:opacity-90';

/**
 * Encapsulated SweetAlert2 Confirmation Dialog Helper
 * Provides a clean, declarative API for destructive actions, confirmations, and alerts.
 */
export const ConfirmDialog = {
  /**
   * Destructive Delete Confirmation Dialog
   */
  async delete(options: {
    name?: string;
    title?: string;
    text?: string;
    confirmButtonText?: string;
    cancelButtonText?: string;
    onConfirm?: () => void | Promise<void>;
  }): Promise<boolean> {
    const targetName = options.name ? ` "${options.name}"` : '';
    const title = options.title || 'Hapus Data?';
    const text =
      options.text ||
      `Apakah Anda yakin ingin menghapus data${targetName}? Tindakan ini tidak dapat dibatalkan.`;

    const result = await Swal.fire({
      title,
      text,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: options.confirmButtonText || 'Ya, Hapus',
      cancelButtonText: options.cancelButtonText || 'Batal',
      customClass: {
        popup: DEFAULT_POPUP_CLASS,
        confirmButton: `${DEFAULT_CONFIRM_CLASS} !bg-red-600 !text-white`,
        cancelButton: DEFAULT_CANCEL_CLASS,
      },
    });

    if (result.isConfirmed) {
      if (options.onConfirm) {
        await options.onConfirm();
      }
      return true;
    }

    return false;
  },

  /**
   * Generic Action Confirmation Dialog
   */
  async confirm(options: ConfirmDialogOptions): Promise<boolean> {
    const {
      title = 'Konfirmasi Aksi',
      text = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
      icon = 'question',
      confirmButtonText = 'Lanjutkan',
      cancelButtonText = 'Batal',
      confirmButtonClass = '!bg-[var(--primary)] !text-white',
      onConfirm,
      onCancel,
    } = options;

    const result = await Swal.fire({
      title,
      text,
      icon,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      customClass: {
        popup: DEFAULT_POPUP_CLASS,
        confirmButton: `${DEFAULT_CONFIRM_CLASS} ${confirmButtonClass}`,
        cancelButton: DEFAULT_CANCEL_CLASS,
      },
    });

    if (result.isConfirmed) {
      if (onConfirm) await onConfirm();
      return true;
    }

    if (onCancel) await onCancel();
    return false;
  },

  /**
   * Success Alert Notification
   */
  async success(title: string, text?: string): Promise<void> {
    await Swal.fire({
      title,
      text,
      icon: 'success',
      confirmButtonText: 'OK',
      customClass: {
        popup: DEFAULT_POPUP_CLASS,
        confirmButton: `${DEFAULT_CONFIRM_CLASS} !bg-[var(--primary)] !text-white`,
      },
    });
  },

  /**
   * Error Alert Notification
   */
  async error(title: string, text?: string): Promise<void> {
    await Swal.fire({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'Tutup',
      customClass: {
        popup: DEFAULT_POPUP_CLASS,
        confirmButton: `${DEFAULT_CONFIRM_CLASS} !bg-red-600 !text-white`,
      },
    });
  },
};

export default ConfirmDialog;

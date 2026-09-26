import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /** Renders the confirm button as destructive (red) — use for deletes. */
  danger?: boolean;
}

interface ConfirmState extends Required<ConfirmOptions> {
  resolve: (confirmed: boolean) => void;
}

/**
 * Single, app-wide confirmation modal. Call `confirm(...)` from anywhere
 * (services or components) and await the result instead of using window.confirm
 * or building a one-off dialog per feature.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly state = signal<ConfirmState | null>(null);

  confirm(options: ConfirmOptions): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? 'Confirm',
        cancelText: options.cancelText ?? 'Cancel',
        danger: options.danger ?? false,
        resolve,
      });
    });
  }

  respond(confirmed: boolean): void {
    this.state()?.resolve(confirmed);
    this.state.set(null);
  }
}

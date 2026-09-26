import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserAdminService } from '../../../../core/services/user-admin.service';
import { User } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-users-list',
  imports: [RouterLink, Icon],
  templateUrl: './users-list.html',
})
export class UsersList {
  private readonly userAdminService = inject(UserAdminService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly authService = inject(AuthService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly deletingId = signal<string | null>(null);

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.userAdminService.getAll().subscribe({
      next: (res) => {
        this.users.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load users');
        this.loading.set(false);
      },
    });
  }

  async remove(user: User): Promise<void> {
    const name = `${user.firstName} ${user.lastName ?? ''}`.trim();
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete user',
      message: `This will permanently delete ${name} (${user.email}). This action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.deletingId.set(user._id);
    this.userAdminService.delete(user._id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u._id !== user._id));
        this.deletingId.set(null);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not delete user');
        this.deletingId.set(null);
      },
    });
  }
}

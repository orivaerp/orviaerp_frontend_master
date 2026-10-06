import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserAdminService } from '../../../../core/services/user-admin.service';
import { User } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { DEFAULT_PAGE_SIZE, PageMeta } from '../../../../core/models/pagination.model';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';

@Component({
  selector: 'app-users-list',
  imports: [RouterLink, Icon, Pagination],
  templateUrl: './users-list.html',
})
export class UsersList {
  private readonly userAdminService = inject(UserAdminService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly authService = inject(AuthService);

  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly meta = signal<PageMeta | null>(null);
  readonly errorMessage = signal('');
  readonly deletingId = signal<string | null>(null);

  constructor() {
    this.loadPage();
  }

  private loadPage(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.userAdminService.getAll({ page: this.page(), limit: this.limit() }).subscribe({
      next: (res) => {
        const meta = res.meta ?? null;
        // The page we asked for is past the end (rows were removed) — step back.
        if (meta && res.data.length === 0 && this.page() > 1) {
          this.page.set(meta.totalPages);
          this.loadPage();
          return;
        }
        this.users.set(res.data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load users');
        this.loading.set(false);
      },
    });
  }

  goToPage(page: number): void {
    this.page.set(page);
    this.loadPage();
  }

  changePageSize(limit: number): void {
    this.limit.set(limit);
    this.page.set(1);
    this.loadPage();
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
        this.deletingId.set(null);
        // Reload so the page refills from the server and the total stays correct.
        this.loadPage();
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not delete user');
        this.deletingId.set(null);
      },
    });
  }
}

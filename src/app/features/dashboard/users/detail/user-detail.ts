import { Component, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { UserAdminService } from '../../../../core/services/user-admin.service';
import { User } from '../../../../core/models/user.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-user-detail',
  imports: [ReactiveFormsModule, RouterLink, Icon, SlicePipe],
  templateUrl: './user-detail.html',
})
export class UserDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly userAdminService = inject(UserAdminService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);

  private readonly userId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly user = signal<User | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly errorMessage = signal('');

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    role: ['user', [Validators.required]],
    status: ['active', [Validators.required]],
  });

  constructor() {
    this.userAdminService.getById(this.userId).subscribe({
      next: (res) => {
        this.user.set(res.data);
        this.form.patchValue({
          firstName: res.data.firstName,
          lastName: res.data.lastName ?? '',
          email: res.data.email,
          phone: res.data.phone ?? '',
          role: res.data.role,
          status: res.data.status,
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 404) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set(err?.error?.message ?? 'Could not load user');
        }
      },
    });
  }

  startEdit(): void {
    this.editing.set(true);
  }

  cancelEdit(): void {
    const user = this.user();
    if (user) {
      this.form.patchValue({
        firstName: user.firstName,
        lastName: user.lastName ?? '',
        email: user.email,
        phone: user.phone ?? '',
        role: user.role,
        status: user.status,
      });
    }
    this.editing.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const payload = this.form.getRawValue();

    this.userAdminService
      .update(this.userId, {
        firstName: payload.firstName!,
        lastName: payload.lastName || undefined,
        email: payload.email!,
        phone: payload.phone || undefined,
        role: payload.role as User['role'],
        status: payload.status as User['status'],
      })
      .subscribe({
        next: (res) => {
          this.user.set(res.data);
          this.saving.set(false);
          this.editing.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not save changes');
        },
      });
  }

  async remove(): Promise<void> {
    const user = this.user();
    if (!user) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete user',
      message: `This will permanently delete ${user.firstName} ${user.lastName ?? ''} (${user.email}). This action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.deleting.set(true);
    this.userAdminService.delete(this.userId).subscribe({
      next: () => this.router.navigate(['/dashboard/users']),
      error: (err) => {
        this.deleting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not delete user');
      },
    });
  }
}

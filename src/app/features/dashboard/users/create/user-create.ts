import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UserAdminService } from '../../../../core/services/user-admin.service';

@Component({
  selector: 'app-user-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './user-create.html',
})
export class UserCreate {
  private readonly fb = inject(FormBuilder);
  private readonly userAdminService = inject(UserAdminService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['user', [Validators.required]],
  });

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    const payload = this.form.getRawValue();

    this.userAdminService
      .create({
        firstName: payload.firstName!,
        lastName: payload.lastName || undefined,
        email: payload.email!,
        phone: payload.phone || undefined,
        password: payload.password!,
        role: payload.role as 'admin' | 'user' | 'vendor',
      })
      .subscribe({
        next: () => this.router.navigate(['/dashboard/users']),
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not create user');
        },
      });
  }
}

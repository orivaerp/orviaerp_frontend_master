import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule],
  templateUrl: './settings.html',
})
export class Settings {
  private readonly fb = inject(FormBuilder);
  readonly authService = inject(AuthService);

  readonly form = this.fb.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
  });

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly success = signal(false);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.success.set(false);
    const { currentPassword, newPassword } = this.form.getRawValue();

    this.authService.changePassword(currentPassword!, newPassword!).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.form.reset();
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not change password');
      },
    });
  }
}

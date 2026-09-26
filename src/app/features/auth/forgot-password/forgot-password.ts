import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthShell } from '../../../shared/components/auth-shell/auth-shell';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, AuthShell],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly sent = signal(false);
  /** Dev convenience: backend returns the raw reset token until email sending is wired up. */
  readonly devResetToken = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authService.forgotPassword(this.form.getRawValue().email!).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.sent.set(true);
        this.devResetToken.set(res.data?.resetToken ?? null);
      },
      error: (err) => {
        this.loading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Something went wrong');
      },
    });
  }
}

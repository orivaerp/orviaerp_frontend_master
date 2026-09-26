import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { BlogService } from '../../../../core/services/blog.service';
import { AuthService } from '../../../../core/services/auth.service';
import { BlogStatus } from '../../../../core/models/blog.model';
import { Icon } from '../../../../shared/components/icon/icon';

const EDITOR_MODULES = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'image'],
    ['clean'],
  ],
};

@Component({
  selector: 'app-blog-create',
  imports: [ReactiveFormsModule, RouterLink, QuillModule, Icon],
  templateUrl: './blog-create.html',
})
export class BlogCreate {
  private readonly fb = inject(FormBuilder);
  private readonly blogService = inject(BlogService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly editorModules = EDITOR_MODULES;

  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    category: [''],
    tags: [''],
    excerpt: ['', [Validators.maxLength(280)]],
    coverImage: [''],
    status: ['draft' as BlogStatus, [Validators.required]],
    content: ['', [Validators.required]],
    metaTitle: ['', [Validators.maxLength(70)]],
    metaDescription: ['', [Validators.maxLength(160)]],
  });

  /** Live-updating snapshot of the form, used to drive the preview modal. */
  readonly preview = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly previewOpen = signal(false);

  previewContent(): string {
    return this.preview()?.content || '<p class="text-[var(--color-text-subtle)]">Nothing written yet…</p>';
  }

  previewTags(): string[] {
    const raw = this.preview()?.tags ?? '';
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  openPreview(): void {
    this.previewOpen.set(true);
  }

  closePreview(): void {
    this.previewOpen.set(false);
  }

  slugify(title: string | null | undefined): string {
    return (title ?? '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'untitled-post';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    this.blogService
      .create({
        title: value.title!,
        content: value.content!,
        excerpt: value.excerpt || undefined,
        coverImage: value.coverImage || undefined,
        category: value.category || undefined,
        tags: this.previewTags(),
        status: value.status as BlogStatus,
        metaTitle: value.metaTitle || undefined,
        metaDescription: value.metaDescription || undefined,
      })
      .subscribe({
        next: () => this.router.navigate(['/dashboard/blog']),
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not publish this post');
        },
      });
  }
}

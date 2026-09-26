import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { BlogService } from '../../../../core/services/blog.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Blog, BlogStatus } from '../../../../core/models/blog.model';
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
  selector: 'app-blog-edit',
  imports: [ReactiveFormsModule, RouterLink, QuillModule, Icon],
  templateUrl: './blog-edit.html',
})
export class BlogEdit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly blogService = inject(BlogService);
  private readonly router = inject(Router);
  readonly authService = inject(AuthService);

  readonly blogId = this.route.snapshot.paramMap.get('id') ?? '';

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

  readonly preview = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  readonly blog = signal<Blog | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal('');
  readonly previewOpen = signal(false);

  constructor() {
    this.blogService.getById(this.blogId).subscribe({
      next: (res) => {
        this.blog.set(res.data);
        this.form.patchValue({
          title: res.data.title,
          category: res.data.category ?? '',
          tags: (res.data.tags ?? []).join(', '),
          excerpt: res.data.excerpt ?? '',
          coverImage: res.data.coverImage ?? '',
          status: res.data.status,
          content: res.data.content,
          metaTitle: res.data.metaTitle ?? '',
          metaDescription: res.data.metaDescription ?? '',
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 404) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set(err?.error?.message ?? 'Could not load this post');
        }
      },
    });
  }

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
    return (
      (title ?? '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'untitled-post'
    );
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    this.blogService
      .update(this.blogId, {
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
        next: () => this.router.navigate(['/dashboard/blog', this.blogId]),
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not save changes');
        },
      });
  }
}

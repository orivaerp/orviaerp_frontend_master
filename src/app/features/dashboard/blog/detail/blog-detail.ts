import { Component, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BlogService } from '../../../../core/services/blog.service';
import { Blog } from '../../../../core/models/blog.model';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-blog-detail',
  imports: [RouterLink, Icon, SlicePipe],
  templateUrl: './blog-detail.html',
})
export class BlogDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly blogService = inject(BlogService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  private readonly blogId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly blog = signal<Blog | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly errorMessage = signal('');
  readonly deleting = signal(false);

  constructor() {
    this.blogService.getById(this.blogId).subscribe({
      next: (res) => {
        this.blog.set(res.data);
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

  authorName(blog: Blog): string {
    if (typeof blog.author === 'string') return blog.author;
    return `${blog.author.firstName} ${blog.author.lastName ?? ''}`.trim();
  }

  async remove(): Promise<void> {
    const blog = this.blog();
    if (!blog) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete post',
      message: `This will permanently delete "${blog.title}". This action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.deleting.set(true);
    this.blogService.delete(this.blogId).subscribe({
      next: () => this.router.navigate(['/dashboard/blog']),
      error: (err) => {
        this.deleting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not delete this post');
      },
    });
  }
}

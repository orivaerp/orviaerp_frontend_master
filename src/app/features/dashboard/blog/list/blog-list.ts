import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../../core/services/blog.service';
import { Blog } from '../../../../core/models/blog.model';
import { Icon } from '../../../../shared/components/icon/icon';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { DEFAULT_PAGE_SIZE, PageMeta } from '../../../../core/models/pagination.model';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink, Icon, Pagination],
  templateUrl: './blog-list.html',
})
export class BlogList {
  private readonly blogService = inject(BlogService);

  readonly blogs = signal<Blog[]>([]);
  readonly loading = signal(true);
  readonly page = signal(1);
  readonly limit = signal(DEFAULT_PAGE_SIZE);
  readonly meta = signal<PageMeta | null>(null);
  readonly errorMessage = signal('');

  constructor() {
    this.loadPage();
  }

  private loadPage(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.blogService.getAll({ page: this.page(), limit: this.limit() }).subscribe({
      next: (res) => {
        const meta = res.meta ?? null;
        // The page we asked for is past the end (rows were removed) — step back.
        if (meta && res.data.length === 0 && this.page() > 1) {
          this.page.set(meta.totalPages);
          this.loadPage();
          return;
        }
        this.blogs.set(res.data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load blogs');
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

  authorName(blog: Blog): string {
    if (typeof blog.author === 'string') return blog.author;
    return `${blog.author.firstName} ${blog.author.lastName ?? ''}`.trim();
  }
}

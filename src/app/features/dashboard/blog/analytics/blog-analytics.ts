import { Component, computed, inject, signal } from '@angular/core';
import { BlogService } from '../../../../core/services/blog.service';
import { Blog } from '../../../../core/models/blog.model';

interface CategoryCount {
  category: string;
  count: number;
}

@Component({
  selector: 'app-blog-analytics',
  templateUrl: './blog-analytics.html',
})
export class BlogAnalytics {
  private readonly blogService = inject(BlogService);

  readonly blogs = signal<Blog[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  readonly totalBlogs = computed(() => this.blogs().length);
  readonly publishedCount = computed(() => this.blogs().filter((b) => b.status === 'published').length);
  readonly draftCount = computed(() => this.blogs().filter((b) => b.status === 'draft').length);
  readonly totalViews = computed(() => this.blogs().reduce((sum, b) => sum + (b.views ?? 0), 0));

  readonly topByViews = computed(() =>
    [...this.blogs()].sort((a, b) => (b.views ?? 0) - (a.views ?? 0)).slice(0, 5)
  );

  readonly categoryCounts = computed<CategoryCount[]>(() => {
    const counts = new Map<string, number>();
    for (const blog of this.blogs()) {
      const key = blog.category?.trim() || 'Uncategorized';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);
  });

  constructor() {
    this.blogService.getAll().subscribe({
      next: (res) => {
        this.blogs.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load blog analytics');
        this.loading.set(false);
      },
    });
  }
}

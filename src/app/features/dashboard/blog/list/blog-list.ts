import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BlogService } from '../../../../core/services/blog.service';
import { Blog } from '../../../../core/models/blog.model';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-blog-list',
  imports: [RouterLink, Icon],
  templateUrl: './blog-list.html',
})
export class BlogList {
  private readonly blogService = inject(BlogService);

  readonly blogs = signal<Blog[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.blogService.getAll().subscribe({
      next: (res) => {
        this.blogs.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load blogs');
        this.loading.set(false);
      },
    });
  }

  authorName(blog: Blog): string {
    if (typeof blog.author === 'string') return blog.author;
    return `${blog.author.firstName} ${blog.author.lastName ?? ''}`.trim();
  }
}

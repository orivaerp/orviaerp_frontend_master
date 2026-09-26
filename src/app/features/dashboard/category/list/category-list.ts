import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-category-list',
  imports: [RouterLink, Icon],
  templateUrl: './category-list.html',
})
export class CategoryList {
  private readonly categoryService = inject(CategoryService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly categories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly deletingId = signal<string | null>(null);

  constructor() {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.categoryService.getAll().subscribe({
      next: (res) => {
        this.categories.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load categories');
        this.loading.set(false);
      },
    });
  }

  parentName(category: Category): string {
    if (!category.parent) return '—';
    if (typeof category.parent === 'string') return category.parent;
    return category.parent.name;
  }

  async remove(category: Category): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete category',
      message: `This will permanently delete "${category.name}" and all of its subcategories. This action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.deletingId.set(category._id);
    this.categoryService.delete(category._id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.load();
      },
      error: (err) => {
        this.deletingId.set(null);
        this.errorMessage.set(err?.error?.message ?? 'Could not delete this category');
      },
    });
  }
}

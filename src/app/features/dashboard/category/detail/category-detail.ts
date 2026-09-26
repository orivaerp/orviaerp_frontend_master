import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-category-detail',
  imports: [ReactiveFormsModule, RouterLink, Icon],
  templateUrl: './category-detail.html',
})
export class CategoryDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly categoryService = inject(CategoryService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly fb = inject(FormBuilder);

  private readonly categoryId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly category = signal<Category | null>(null);
  readonly parents = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly errorMessage = signal('');

  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly deleting = signal(false);

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    parent: [''],
    description: [''],
    icon: [''],
    image: [''],
    isActive: [true],
    isFeatured: [false],
  });

  constructor() {
    this.categoryService.getAll().subscribe({
      next: (res) => this.parents.set(res.data.filter((c) => c._id !== this.categoryId)),
      error: () => {},
    });

    this.categoryService.getById(this.categoryId).subscribe({
      next: (res) => {
        this.category.set(res.data);
        this.patchForm(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 404) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set(err?.error?.message ?? 'Could not load this category');
        }
      },
    });
  }

  private patchForm(category: Category): void {
    const parentId = typeof category.parent === 'string' ? category.parent : category.parent?._id;
    this.form.patchValue({
      name: category.name,
      parent: parentId ?? '',
      description: category.description ?? '',
      icon: category.icon ?? '',
      image: category.image ?? '',
      isActive: category.isActive,
      isFeatured: category.isFeatured,
    });
  }

  parentName(category: Category): string {
    if (!category.parent) return '—';
    if (typeof category.parent === 'string') return category.parent;
    return category.parent.name;
  }

  startEdit(): void {
    this.editing.set(true);
  }

  cancelEdit(): void {
    const category = this.category();
    if (category) this.patchForm(category);
    this.editing.set(false);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    this.categoryService
      .update(this.categoryId, {
        name: value.name!,
        parent: value.parent || null,
        description: value.description || undefined,
        icon: value.icon || undefined,
        image: value.image || undefined,
        isActive: value.isActive!,
        isFeatured: value.isFeatured!,
      })
      .subscribe({
        next: (res) => {
          this.category.set(res.data);
          this.saving.set(false);
          this.editing.set(false);
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not save changes');
        },
      });
  }

  async remove(): Promise<void> {
    const category = this.category();
    if (!category) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete category',
      message: `This will permanently delete "${category.name}" and all of its subcategories. This action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.deleting.set(true);
    this.categoryService.delete(this.categoryId).subscribe({
      next: () => this.router.navigate(['/dashboard/categories']),
      error: (err) => {
        this.deleting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not delete this category');
      },
    });
  }
}

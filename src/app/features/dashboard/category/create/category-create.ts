import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';

@Component({
  selector: 'app-category-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './category-create.html',
})
export class CategoryCreate {
  private readonly fb = inject(FormBuilder);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly parents = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

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
      next: (res) => this.parents.set(res.data),
      error: () => {},
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    this.categoryService
      .create({
        name: value.name!,
        parent: value.parent || null,
        description: value.description || undefined,
        icon: value.icon || undefined,
        image: value.image || undefined,
        isActive: value.isActive!,
        isFeatured: value.isFeatured!,
      })
      .subscribe({
        next: () => this.router.navigate(['/dashboard/categories']),
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not create this category');
        },
      });
  }
}

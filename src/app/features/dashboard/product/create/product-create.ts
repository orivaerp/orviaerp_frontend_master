import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { PricingType, ProductStatus } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-create',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-create.html',
})
export class ProductCreate {
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly allCategories = signal<Category[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    category: ['', [Validators.required]],
    subCategory: [''],
    subSubCategory: [''],
    shortDescription: ['', [Validators.maxLength(300)]],
    description: [''],
    tags: [''],
    pricingType: ['starting-from' as PricingType, [Validators.required]],
    price: [null as number | null],
    currency: ['INR'],
    discount: [0],
    features: [''],
    deliverables: [''],
    thumbnail: [''],
    demoUrl: [''],
    status: ['draft' as ProductStatus, [Validators.required]],
    isFeatured: [false],
  });

  private readonly categoryId = signal('');
  private readonly subCategoryId = signal('');

  readonly topCategories = computed(() => this.allCategories().filter((c) => c.level === 0));
  readonly subCategories = computed(() =>
    this.allCategories().filter((c) => this.parentIdOf(c) === this.categoryId() && c.level === 1)
  );
  readonly subSubCategories = computed(() =>
    this.allCategories().filter((c) => this.parentIdOf(c) === this.subCategoryId() && c.level === 2)
  );

  constructor() {
    this.categoryService.getAll().subscribe({
      next: (res) => this.allCategories.set(res.data),
      error: () => {},
    });

    this.form.controls.category.valueChanges.subscribe((value) => {
      this.categoryId.set(value ?? '');
      this.form.patchValue({ subCategory: '', subSubCategory: '' }, { emitEvent: false });
      this.subCategoryId.set('');
    });

    this.form.controls.subCategory.valueChanges.subscribe((value) => {
      this.subCategoryId.set(value ?? '');
      this.form.patchValue({ subSubCategory: '' }, { emitEvent: false });
    });
  }

  private parentIdOf(category: Category): string {
    if (!category.parent) return '';
    return typeof category.parent === 'string' ? category.parent : category.parent._id;
  }

  private splitList(raw: string | null): string[] {
    return (raw ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    this.productService
      .create({
        name: value.name!,
        category: value.category!,
        subCategory: value.subCategory || undefined,
        subSubCategory: value.subSubCategory || undefined,
        shortDescription: value.shortDescription || undefined,
        description: value.description || undefined,
        tags: this.splitList(value.tags),
        pricingType: value.pricingType as PricingType,
        price: value.price ?? undefined,
        currency: value.currency || 'INR',
        discount: value.discount ?? 0,
        features: this.splitList(value.features),
        deliverables: this.splitList(value.deliverables),
        thumbnail: value.thumbnail || undefined,
        demoUrl: value.demoUrl || undefined,
        status: value.status as ProductStatus,
        isFeatured: value.isFeatured!,
      })
      .subscribe({
        next: () => this.router.navigate(['/dashboard/products']),
        error: (err) => {
          this.loading.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not create this product');
        },
      });
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryService } from '../../../../core/services/category.service';
import { Category } from '../../../../core/models/category.model';
import { Product, PricingType, ProductStatus } from '../../../../core/models/product.model';

@Component({
  selector: 'app-product-edit',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './product-edit.html',
})
export class ProductEdit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly router = inject(Router);

  readonly productId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly allCategories = signal<Category[]>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly saving = signal(false);
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
    });
    this.form.controls.subCategory.valueChanges.subscribe((value) => {
      this.subCategoryId.set(value ?? '');
    });

    this.productService.getById(this.productId).subscribe({
      next: (res) => {
        this.patchForm(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        if (err?.status === 404) {
          this.notFound.set(true);
        } else {
          this.errorMessage.set(err?.error?.message ?? 'Could not load this product');
        }
      },
    });
  }

  private idOf(ref: Product['category'] | Product['subCategory']): string {
    if (!ref) return '';
    return typeof ref === 'string' ? ref : ref._id;
  }

  private patchForm(product: Product): void {
    this.categoryId.set(this.idOf(product.category));
    this.subCategoryId.set(this.idOf(product.subCategory));
    this.form.patchValue({
      name: product.name,
      category: this.idOf(product.category),
      subCategory: this.idOf(product.subCategory),
      subSubCategory: this.idOf(product.subSubCategory),
      shortDescription: product.shortDescription ?? '',
      description: product.description ?? '',
      tags: (product.tags ?? []).join(', '),
      pricingType: product.pricingType,
      price: product.price ?? null,
      currency: product.currency,
      discount: product.discount,
      features: (product.features ?? []).join(', '),
      deliverables: (product.deliverables ?? []).join(', '),
      thumbnail: product.thumbnail ?? '',
      demoUrl: product.demoUrl ?? '',
      status: product.status,
      isFeatured: product.isFeatured,
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

    this.saving.set(true);
    this.errorMessage.set('');
    const value = this.form.getRawValue();

    this.productService
      .update(this.productId, {
        name: value.name!,
        category: value.category!,
        subCategory: value.subCategory || null,
        subSubCategory: value.subSubCategory || null,
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
        next: () => this.router.navigate(['/dashboard/products', this.productId]),
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message ?? 'Could not save changes');
        },
      });
  }
}

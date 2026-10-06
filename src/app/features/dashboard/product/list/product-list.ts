import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';
import { Icon } from '../../../../shared/components/icon/icon';
import { Pagination } from '../../../../shared/components/pagination/pagination';
import { DEFAULT_PAGE_SIZE, PageMeta } from '../../../../core/models/pagination.model';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, Icon, Pagination],
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly productService = inject(ProductService);

  readonly products = signal<Product[]>([]);
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

    this.productService.getAll(undefined, { page: this.page(), limit: this.limit() }).subscribe({
      next: (res) => {
        const meta = res.meta ?? null;
        // The page we asked for is past the end (rows were removed) — step back.
        if (meta && res.data.length === 0 && this.page() > 1) {
          this.page.set(meta.totalPages);
          this.loadPage();
          return;
        }
        this.products.set(res.data);
        this.meta.set(meta);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load products');
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

  categoryName(product: Product): string {
    if (typeof product.category === 'string') return product.category;
    return product.category?.name ?? '—';
  }

  /** Both sub-levels (subCategory, subSubCategory), for the muted line under the main category. */
  subCategoryNames(product: Product): string {
    const names = [product.subCategory, product.subSubCategory]
      .map((ref) => (ref ? (typeof ref === 'string' ? ref : ref.name) : null))
      .filter((name): name is string => !!name);
    return names.join(' › ');
  }

  displayPrice(product: Product): string {
    if (product.pricingType === 'custom-quote') return 'Custom quote';
    if (product.price == null) return '—';
    const prefix = product.pricingType === 'starting-from' ? 'From ' : '';
    const suffix = product.pricingType === 'monthly' ? '/mo' : '';
    return `${prefix}${product.currency} ${product.price}${suffix}`;
  }
}

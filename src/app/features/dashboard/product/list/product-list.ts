import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, Icon],
  templateUrl: './product-list.html',
})
export class ProductList {
  private readonly productService = inject(ProductService);

  readonly products = signal<Product[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');

  constructor() {
    this.productService.getAll().subscribe({
      next: (res) => {
        this.products.set(res.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error?.message ?? 'Could not load products');
        this.loading.set(false);
      },
    });
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

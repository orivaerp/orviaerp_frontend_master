import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';
import { Product } from '../../../../core/models/product.model';
import { ConfirmDialogService } from '../../../../shared/services/confirm-dialog.service';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-product-detail',
  imports: [RouterLink, Icon],
  templateUrl: './product-detail.html',
})
export class ProductDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  private readonly productId = this.route.snapshot.paramMap.get('id') ?? '';

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly errorMessage = signal('');
  readonly deleting = signal(false);

  constructor() {
    this.productService.getById(this.productId).subscribe({
      next: (res) => {
        this.product.set(res.data);
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

  categoryName(ref: Product['category'] | Product['subCategory']): string {
    if (!ref) return '—';
    return typeof ref === 'string' ? ref : ref.name;
  }

  displayPrice(product: Product): string {
    if (product.pricingType === 'custom-quote') return 'Custom quote';
    if (product.price == null) return '—';
    const prefix = product.pricingType === 'starting-from' ? 'From ' : '';
    const suffix = product.pricingType === 'monthly' ? '/mo' : '';
    return `${prefix}${product.currency} ${product.price}${suffix}`;
  }

  async remove(): Promise<void> {
    const product = this.product();
    if (!product) return;

    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete product',
      message: `This will permanently delete "${product.name}". This action cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });
    if (!confirmed) return;

    this.deleting.set(true);
    this.productService.delete(this.productId).subscribe({
      next: () => this.router.navigate(['/dashboard/products']),
      error: (err) => {
        this.deleting.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Could not delete this product');
      },
    });
  }
}

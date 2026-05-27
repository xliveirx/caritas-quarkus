import type { ProductDetailResponse } from './product-detail-response';

export interface KitItemResponse {
  id: number;
  quantity: number;
  product: ProductDetailResponse;
}

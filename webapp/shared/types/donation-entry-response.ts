import type { ProductDetailResponse } from './product-detail-response';

export type BatchUnit = 'KG' | 'G' | 'ML' | 'L' | 'UNIDADES';

export interface BatchEntryResponse {
  id: number;
  unit: BatchUnit | null;
  quantity: number;
  product: ProductDetailResponse;
}

export interface DonationEntryResponse {
  id: number;
  date: string;
  donator: string | null;
  observation: string | null;
  status: 'CONFIRMED' | 'CANCELED';
  parish: { id: number; name: string };
  batches: BatchEntryResponse[];
}

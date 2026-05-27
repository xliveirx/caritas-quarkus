import type { FamilyResponse } from './family-response';
import type { ParishResponse } from './parish-response';
import type { KitResponse } from './kit-response';
import type { ProductDetailResponse } from './product-detail-response';
import type { DonationStatus } from './donation-entry-summary';

export interface ExitBatchResponse {
  id: number;
  quantity: number;
  product: ProductDetailResponse;
}

export interface DonationExitResponse {
  id: number;
  date: string;
  observation: string | null;
  parish: ParishResponse;
  status: DonationStatus;
  family: FamilyResponse;
  batches: ExitBatchResponse[];
  kit: KitResponse;
}

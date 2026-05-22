import type { StockUnit } from './clothes-stock-item';

export interface FoodDetailResponse {
  id: number;
  name: string;
  batch: string | null;
  description: string | null;
  active: boolean;
  expirationDate: string;
  defaultUnit: StockUnit | null;
}

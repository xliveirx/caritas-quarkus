import type { ClothesDetailResponse } from './clothes-detail-response';

export type StockUnit = 'KG' | 'G' | 'ML' | 'L' | 'UNIDADES';

export interface ClothesStockItem {
  id: number;
  availableQuantity: number;
  parish: { id: number; name: string };
  clothes: ClothesDetailResponse;
}

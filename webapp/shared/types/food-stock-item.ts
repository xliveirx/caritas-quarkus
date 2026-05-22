import type { FoodDetailResponse } from './food-detail-response';

export interface FoodStockItem {
  id: number;
  availableQuantity: number;
  parish: { id: number; name: string };
  food: FoodDetailResponse;
}

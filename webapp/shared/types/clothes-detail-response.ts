import type { StockUnit } from './clothes-stock-item';
import type { AttributeResponse } from './attribute-response';

export interface ClothesDetailResponse {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  attributes: AttributeResponse[];
  defaultUnit: StockUnit | null;
}

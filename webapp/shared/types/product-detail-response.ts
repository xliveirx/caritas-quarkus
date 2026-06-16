import type { AttributeResponse } from './attribute-response';

export interface ClothesProductDetail {
  type: 'CLOTHES';
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  defaultUnit: string | null;
  attributes: AttributeResponse[];
}

export interface FoodProductDetail {
  type: 'FOOD';
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  defaultUnit: string | null;
  batch: string | null;
  expirationDate: string | null;
}

export type ProductDetailResponse = ClothesProductDetail | FoodProductDetail;

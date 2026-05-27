export interface ClothesProductDetail {
  type: 'CLOTHES';
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  defaultUnit: string | null;
  size: string | null;
  category: string | null;
  gender: string | null;
  condition: 'NOVO' | 'USADO';
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

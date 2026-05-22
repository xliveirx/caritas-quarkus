export type ProductType = 'FOOD' | 'CLOTHES';

export interface ProductResponse {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  type: ProductType | null;
}

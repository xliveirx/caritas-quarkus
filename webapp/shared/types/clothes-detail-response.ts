import type { StockUnit } from './clothes-stock-item';

export type ClothesSize = 'P' | 'M' | 'G' | 'GG' | 'GGG';
export type ClothesGender = 'MASCULINO' | 'FEMININO' | 'UNISSEX';
export type ClothesCategory = 'CALCA' | 'CAMISETA' | 'MOLETOM' | 'CASACO' | 'TENIS' | 'SAPATO' | 'BOTA' | 'ACESSORIO' | 'JAQUETA';
export type ClothesCondition = 'NOVO' | 'USADO';

export interface ClothesDetailResponse {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  size: ClothesSize | null;
  category: ClothesCategory | null;
  gender: ClothesGender | null;
  condition: ClothesCondition;
  defaultUnit: StockUnit | null;
}

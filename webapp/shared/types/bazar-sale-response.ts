import type { ParishResponse } from './parish-response';

export interface BazarSaleItemResponse {
  id: number;
  productName: string;
  productType: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BazarSaleResponse {
  id: number;
  buyerName: string;
  buyerCpf: string;
  soldAt: string;
  total: number;
  parish: ParishResponse;
  items: BazarSaleItemResponse[];
}

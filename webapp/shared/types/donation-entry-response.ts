export type BatchUnit = 'KG' | 'G' | 'ML' | 'L' | 'UNIDADES';

export interface BatchEntryResponse {
  id: number;
  unit: BatchUnit | null;
  quantity: number;
  product: { id: number; name: string; description: string | null; active: boolean; type: 'FOOD' | 'CLOTHES' | null };
}

export interface DonationEntryResponse {
  id: number;
  date: string;
  donator: string | null;
  observation: string | null;
  status: 'CONFIRMED' | 'CANCELED';
  parish: { id: number; name: string };
  batches: BatchEntryResponse[];
}

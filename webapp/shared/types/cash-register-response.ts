import type { ParishResponse } from './parish-response';

export type CashMovementType   = 'INCOME' | 'EXPENSE';
export type CashMovementOrigin = 'BAZAR'  | 'BRECHO' | 'MANUAL';

export interface CashMovementResponse {
  id: number;
  type: CashMovementType;
  origin: CashMovementOrigin;
  description: string | null;
  referenceId: number | null;
  occuredAt: string;
  amount: number;
}

export interface CashRegisterResponse {
  id: number;
  parish: ParishResponse;
  balance: number;
  movements: CashMovementResponse[];
}

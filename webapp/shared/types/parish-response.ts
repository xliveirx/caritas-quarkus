import type { AddressResponse } from './address-response';

export interface ParishResponse {
  id: number;
  name: string;
  address: AddressResponse;
  cnpj: string;
  isDiocese: boolean;
  createdAt: string;
  updatedAt: string;
}

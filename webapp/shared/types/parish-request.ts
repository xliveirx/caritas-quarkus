import type { AddressRequest } from './address-request';

export interface ParishRequest {
  name: string;
  address: AddressRequest;
  cnpj: string;
}

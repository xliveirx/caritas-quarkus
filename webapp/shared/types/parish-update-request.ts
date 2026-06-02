import type { AddressRequest } from './address-request';

export interface ParishUpdateRequest {
  name?: string;
  address?: Partial<AddressRequest>;
  cnpj?: string;
}

export interface AddressRequest {
  street: string;
  number?: number;
  complement?: string;
  city: string;
  state: string;
  postalCode: string;
}

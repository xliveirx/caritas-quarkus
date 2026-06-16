import type { FamilyMemberResponse } from './family-member-response';
import type { Situation } from './situation';
import type { AddressResponse } from './address-response';

export interface FamilyResponse {
  id: number;
  parishId: number;
  parishName: string;
  members: FamilyMemberResponse[];
  monthlyIncome: number;
  bolsaFamilia: boolean;
  situation: Situation;
  observation: string | null;
  address: AddressResponse | null;
}

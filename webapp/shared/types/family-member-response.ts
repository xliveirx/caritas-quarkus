export interface FamilyMemberResponse {
  id: number;
  name: string;
  cpf: string;
  /** ISO date string YYYY-MM-DD */
  birthDate: string;
  motherName: string;
  responsible: boolean;
}

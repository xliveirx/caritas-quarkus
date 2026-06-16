export type AttributeType = 'SIZE' | 'CATEGORY' | 'GENDER' | 'CONDITION';

export interface AttributeResponse {
  id: number;
  type: AttributeType;
  label: string;
  position: number | null;
}

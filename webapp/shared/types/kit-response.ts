import type { ParishResponse } from './parish-response';
import type { KitItemResponse } from './kit-item-response';

export interface KitResponse {
  id: number;
  name: string;
  description: string | null;
  active: boolean;
  parish: ParishResponse;
  items: KitItemResponse[];
}

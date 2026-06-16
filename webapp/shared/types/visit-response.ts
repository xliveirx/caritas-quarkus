import type { FamilyResponse } from './family-response';
import type { ParishResponse } from './parish-response';

export type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELED';

export interface VisitUserSummary {
  id: number;
  name: string;
  email: string;
}

export interface VisitResponse {
  id: number;
  scheduledDate: string;
  completedDate: string | null;
  status: VisitStatus;
  reason: string;
  createdAt: string;
  family: FamilyResponse;
  parish: ParishResponse;
  user: VisitUserSummary;
}

import type { FamilyResponse } from './family-response';
import type { ParishResponse } from './parish-response';
import type { VolunteerResponse } from './volunteer-response';

export type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELED';

export interface VisitResponse {
  id: number;
  scheduledDate: string;
  completedDate: string | null;
  status: VisitStatus;
  reason: string;
  createdAt: string;
  family: FamilyResponse;
  parish: ParishResponse;
  volunteer: VolunteerResponse;
}

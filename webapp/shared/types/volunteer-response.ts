export interface VolunteerResponse {
  id: number;
  name: string;
  email: string;
  parishId: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
  hasPassword: boolean;
}

export interface VolunteerRequest {
  name: string;
  email: string;
  parishId: number | null;
  password: string;
  confirmPassword: string;
}

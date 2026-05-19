import type { UserRole } from './user-role';

export interface AuthUser {
  email: string;
  roles: UserRole[];
}

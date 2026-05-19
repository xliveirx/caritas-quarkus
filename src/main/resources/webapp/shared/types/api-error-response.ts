import type { ViolationError } from './violation-error';

export interface ApiErrorResponse {
  title: string;
  message: string;
  status: number;
  timestamp: string;
  errors?: ViolationError[];
}

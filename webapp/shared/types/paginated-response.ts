import type { Pagination } from './pagination';

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

import { z } from 'zod';

// 统一分页约定（docs/00 §6、docs/05 §2.7）：page 默认 1，pageSize 默认 12、最大 50。
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export function buildPageResult<T>(
  items: T[],
  total: number,
  { page, pageSize }: PaginationQuery,
): PageResult<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}

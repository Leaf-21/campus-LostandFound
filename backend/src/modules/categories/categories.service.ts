import { prisma } from '../../config/prisma.js';

export interface CategoryDto {
  id: string;
  name: string;
  sort: number;
}

/** 只返回启用分类，且不含 code / isActive（与前端 mock 一致） */
export async function listCategories(): Promise<CategoryDto[]> {
  const rows = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true, sortOrder: true },
  });
  return rows.map((c) => ({ id: c.id, name: c.name, sort: c.sortOrder }));
}

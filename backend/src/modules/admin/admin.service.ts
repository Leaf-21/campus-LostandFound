import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { BusinessCode } from '../../common/exception/business-code.js';
import { AppError, notFound } from '../../common/exception/app-error.js';
import { buildPageResult, type PageResult } from '../../common/pagination/pagination.js';
import { postInclude, toPostDto, type PostDto } from '../../common/serializer/post.js';
import { toIsoShanghai } from '../../utils/time.js';
import type { ListAdminPostsQuery } from './admin.schema.js';

const TARGET_TYPE_POST = 'POST';

/** 管理端信息列表：不排除 HIDDEN，并额外返回 previousStatus 供前端判断能否恢复 */
export interface AdminPostDto extends PostDto {
  previousStatus: string | null;
}

export async function listAdminPosts(query: ListAdminPostsQuery): Promise<PageResult<AdminPostDto>> {
  const where: Prisma.PostWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.postType) where.postType = query.postType;
  if (query.keyword) {
    where.OR = [
      { title: { contains: query.keyword } },
      { description: { contains: query.keyword } },
      { location: { contains: query.keyword } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  const items: AdminPostDto[] = rows.map((row) => ({
    ...toPostDto(row),
    previousStatus: (row as { previousStatus?: string | null }).previousStatus ?? null,
  }));

  return buildPageResult(items, total, query);
}

export interface AdminActionDto {
  id: string;
  targetType: string;
  targetId: string;
  action: string;
  reason: string | null;
  createdAt: string | null;
}

/** 隐藏信息：保存原状态 → HIDDEN，并写审计日志（单事务） */
export async function hidePost(
  adminId: string,
  postId: string,
  reason?: string,
): Promise<{ post: AdminPostDto; action: AdminActionDto }> {
  return prisma.$transaction(async (tx) => {
    const post = await tx.post.findUnique({ where: { id: postId } });
    if (!post) throw notFound('信息不存在或已被删除');
    if (post.status === 'HIDDEN') {
      throw new AppError(409, BusinessCode.STATE_CONFLICT, '该信息已被隐藏，无需重复操作');
    }

    // 保存隐藏前状态，恢复时用（docs/05 §10.3）
    const updated = await tx.post.update({
      where: { id: postId },
      data: { status: 'HIDDEN', previousStatus: post.status },
      include: postInclude,
    });

    const action = await tx.adminAction.create({
      data: {
        adminId,
        targetType: TARGET_TYPE_POST,
        targetId: postId,
        action: 'HIDE',
        reason: reason ?? null,
      },
    });

    return {
      post: {
        ...toPostDto(updated),
        previousStatus: updated.previousStatus ?? null,
      },
      action: toAdminActionDto(action),
    };
  });
}

/** 恢复信息：仅 HIDDEN 可恢复，还原隐藏前状态（无历史值时回落 OPEN） */
export async function restorePost(
  adminId: string,
  postId: string,
  reason?: string,
): Promise<{ post: AdminPostDto; action: AdminActionDto }> {
  return prisma.$transaction(async (tx) => {
    const post = await tx.post.findUnique({ where: { id: postId } });
    if (!post) throw notFound('信息不存在或已被删除');
    if (post.status !== 'HIDDEN') {
      throw new AppError(409, BusinessCode.STATE_CONFLICT, '仅恢复此前被隐藏的信息');
    }

    const restoredStatus = post.previousStatus ?? 'OPEN';
    const updated = await tx.post.update({
      where: { id: postId },
      data: { status: restoredStatus, previousStatus: null },
      include: postInclude,
    });

    const action = await tx.adminAction.create({
      data: {
        adminId,
        targetType: TARGET_TYPE_POST,
        targetId: postId,
        action: 'RESTORE',
        reason: reason ?? null,
      },
    });

    return {
      post: {
        ...toPostDto(updated),
        previousStatus: updated.previousStatus ?? null,
      },
      action: toAdminActionDto(action),
    };
  });
}

/** 查询某条信息的操作日志（便于审计，P1 附带能力） */
export async function listPostAdminActions(postId: string): Promise<AdminActionDto[]> {
  const rows = await prisma.adminAction.findMany({
    where: { targetType: TARGET_TYPE_POST, targetId: postId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toAdminActionDto);
}

function toAdminActionDto(row: {
  id: string;
  targetType: string;
  targetId: string;
  action: string;
  reason: string | null;
  createdAt: Date;
}): AdminActionDto {
  return {
    id: row.id,
    targetType: row.targetType,
    targetId: row.targetId,
    action: row.action,
    reason: row.reason,
    createdAt: toIsoShanghai(row.createdAt),
  };
}

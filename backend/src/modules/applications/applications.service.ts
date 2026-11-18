import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { BusinessCode } from '../../common/exception/business-code.js';
import { AppError, forbidden, notFound } from '../../common/exception/app-error.js';
import { buildPageResult, type PageResult } from '../../common/pagination/pagination.js';
import { applicationInclude, toApplicationDto, type ApplicationDto } from '../../common/serializer/application.js';
import type { z } from 'zod';
import type {
  decisionSchema,
  myApplicationsQuerySchema,
} from './applications.schema.js';

const AUTO_REJECT_NOTE = '该信息已由其他申请处理';

export async function createApplication(
  userId: string,
  postId: string,
  details: string,
): Promise<ApplicationDto> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, publisherId: true, status: true, postType: true },
  });
  if (!post || post.status === 'HIDDEN') throw notFound('信息不存在或已被删除');
  if (post.publisherId === userId) throw forbidden('不能对自己发布的信息提交申请');
  if (post.status !== 'OPEN') {
    throw new AppError(409, BusinessCode.STATE_CONFLICT, '当前状态不允许提交申请');
  }

  // 事务内复查，防并发重复提交（docs/08 §2「快速重复点击」）
  const created = await prisma.$transaction(async (tx) => {
    const duplicate = await tx.application.findFirst({
      where: { postId, applicantId: userId, status: { in: ['PENDING', 'ACCEPTED'] } },
      select: { id: true },
    });
    if (duplicate) {
      throw new AppError(409, BusinessCode.DUPLICATE_APPLICATION, '您已经提交过申请，请等待发布者处理');
    }
    return tx.application.create({
      data: {
        postId,
        applicantId: userId,
        applicationType: post.postType === 'FOUND' ? 'CLAIM' : 'CLUE',
        details,
        status: 'PENDING',
      },
      include: applicationInclude,
    });
  });

  return toApplicationDto(created);
}

/** 发布者查看某条信息收到的申请：PENDING 优先 + createdAt 倒序（K1：返回数组） */
export async function listPostApplications(
  userId: string,
  isAdmin: boolean,
  postId: string,
  status?: string,
): Promise<ApplicationDto[]> {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, publisherId: true } });
  if (!post) throw notFound('信息不存在或已被删除');
  if (!isAdmin && post.publisherId !== userId) {
    throw forbidden('只有发布者可以查看收到的申请');
  }

  const where: Prisma.ApplicationWhereInput = { postId };
  if (status) where.status = status as never;

  const rows = await prisma.application.findMany({
    where,
    include: applicationInclude,
    orderBy: { createdAt: 'desc' },
  });
  // 待处理优先（稳定排序，避免依赖 DB 的 CASE 支持差异）
  return rows
    .map(toApplicationDto)
    .sort((a, b) => {
      const rank = (s: string): number => (s === 'PENDING' ? 0 : 1);
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });
}

type MyApplicationsQuery = z.infer<typeof myApplicationsQuerySchema>;

export async function listMyApplications(
  userId: string,
  query: MyApplicationsQuery,
): Promise<PageResult<ApplicationDto>> {
  const where: Prisma.ApplicationWhereInput =
    query.role === 'SUBMITTED'
      ? { applicantId: userId }
      : { post: { publisherId: userId } };
  if (query.status) where.status = query.status;

  const [total, rows] = await Promise.all([
    prisma.application.count({ where }),
    prisma.application.findMany({
      where,
      include: applicationInclude,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  const items = rows.map(toApplicationDto);
  // 收到的申请：待处理优先（与前端 mock 一致）
  if (query.role === 'RECEIVED') {
    items.sort((a, b) => {
      const rank = (s: string): number => (s === 'PENDING' ? 0 : 1);
      if (rank(a.status) !== rank(b.status)) return rank(a.status) - rank(b.status);
      return (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
    });
  }
  return buildPageResult(items, total, query);
}

export async function getApplication(
  userId: string,
  isAdmin: boolean,
  applicationId: string,
): Promise<ApplicationDto> {
  const app = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { ...applicationInclude, post: { select: { title: true, publisherId: true } } },
  });
  if (!app) throw notFound('申请不存在或已被删除');
  if (!isAdmin && app.applicant.id !== userId && app.post.publisherId !== userId) {
    throw forbidden('无权查看该申请');
  }
  return toApplicationDto(app);
}

type DecisionInput = z.infer<typeof decisionSchema>;

/** 接受/拒绝：接受需单事务联动帖子与其他申请（docs/04 §5） */
export async function decideApplication(
  userId: string,
  applicationId: string,
  input: DecisionInput,
): Promise<ApplicationDto> {
  return prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: applicationId },
      include: { post: { select: { id: true, publisherId: true, status: true } } },
    });
    if (!app) throw notFound('申请不存在或已被删除');
    if (app.post.publisherId !== userId) throw forbidden('只有发布者可以处理申请');
    if (app.status !== 'PENDING') {
      throw new AppError(409, BusinessCode.STATE_CONFLICT, '该申请已处理，请刷新后查看');
    }

    if (input.decision === 'ACCEPTED') {
      if (app.post.status !== 'OPEN') {
        throw new AppError(409, BusinessCode.STATE_CONFLICT, '当前信息状态不允许接受申请');
      }
      // 条件更新：并发下只有第一个能成功
      const affected = await tx.application.updateMany({
        where: { id: applicationId, status: 'PENDING' },
        data: { status: 'ACCEPTED', reviewNote: input.reviewNote ?? null, reviewedAt: new Date() },
      });
      if (affected.count === 0) {
        throw new AppError(409, BusinessCode.STATE_CONFLICT, '该申请已处理，请刷新后查看');
      }
      // 同帖其余 PENDING 自动拒绝
      await tx.application.updateMany({
        where: { postId: app.postId, id: { not: applicationId }, status: 'PENDING' },
        data: { status: 'REJECTED', reviewNote: AUTO_REJECT_NOTE, reviewedAt: new Date() },
      });
      await tx.post.update({ where: { id: app.postId }, data: { status: 'PROCESSING' } });
    } else {
      const affected = await tx.application.updateMany({
        where: { id: applicationId, status: 'PENDING' },
        data: { status: 'REJECTED', reviewNote: input.reviewNote ?? null, reviewedAt: new Date() },
      });
      if (affected.count === 0) {
        throw new AppError(409, BusinessCode.STATE_CONFLICT, '该申请已处理，请刷新后查看');
      }
    }

    const updated = await tx.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: applicationInclude,
    });
    return toApplicationDto(updated);
  });
}

/** 确认完成交接：申请 ACCEPTED + 帖子 PROCESSING → 双方进入终态 */
export async function completeApplication(userId: string, applicationId: string): Promise<ApplicationDto> {
  return prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({
      where: { id: applicationId },
      include: { post: { select: { id: true, publisherId: true, status: true } } },
    });
    if (!app) throw notFound('申请不存在或已被删除');
    if (app.post.publisherId !== userId) throw forbidden('只有发布者可以确认完成');
    if (app.status !== 'ACCEPTED') {
      throw new AppError(409, BusinessCode.STATE_CONFLICT, '只有已接受的申请可以确认完成');
    }
    const now = new Date();
    const affected = await tx.application.updateMany({
      where: { id: applicationId, status: 'ACCEPTED' },
      data: { status: 'COMPLETED', completedAt: now },
    });
    if (affected.count === 0) {
      throw new AppError(409, BusinessCode.STATE_CONFLICT, '该申请状态已变更，请刷新后重试');
    }
    await tx.post.update({ where: { id: app.postId }, data: { status: 'RESOLVED', resolvedAt: now } });

    const updated = await tx.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: applicationInclude,
    });
    return toApplicationDto(updated);
  });
}

/** 申请人撤回待处理申请（P1） */
export async function cancelApplication(userId: string, applicationId: string): Promise<ApplicationDto> {
  return prisma.$transaction(async (tx) => {
    const app = await tx.application.findUnique({ where: { id: applicationId } });
    if (!app) throw notFound('申请不存在或已被删除');
    if (app.applicantId !== userId) throw forbidden('只能撤回本人提交的申请');
    if (app.status !== 'PENDING') {
      throw new AppError(409, BusinessCode.STATE_CONFLICT, '仅待处理的申请可以撤回');
    }
    const affected = await tx.application.updateMany({
      where: { id: applicationId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });
    if (affected.count === 0) {
      throw new AppError(409, BusinessCode.STATE_CONFLICT, '该申请状态已变更，请刷新后重试');
    }
    const updated = await tx.application.findUniqueOrThrow({
      where: { id: applicationId },
      include: applicationInclude,
    });
    return toApplicationDto(updated);
  });
}

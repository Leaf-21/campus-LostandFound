import type { Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { BusinessCode } from '../../common/exception/business-code.js';
import { AppError, forbidden, notFound } from '../../common/exception/app-error.js';
import { buildPageResult, type PageResult } from '../../common/pagination/pagination.js';
import { postInclude, toPostDto, type PostDto } from '../../common/serializer/post.js';
import { parseIso } from '../../utils/time.js';
import type { CreatePostInput, ListPostsQuery, MyPostsQuery, UpdatePostInput } from './posts.schema.js';

/** 信息广场默认只展示「可处理」信息（docs/05 §8.1） */
const DEFAULT_VISIBLE_STATUSES = ['OPEN', 'PROCESSING'] as const;

export async function listPosts(query: ListPostsQuery): Promise<PageResult<PostDto>> {
  const where: Prisma.PostWhereInput = {};

  // HIDDEN 永不公开展示（docs/13 D3）
  if (query.status && query.status !== 'HIDDEN') {
    where.status = query.status;
  } else {
    where.status = { in: [...DEFAULT_VISIBLE_STATUSES] };
  }
  if (query.postType) where.postType = query.postType;
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.location) where.location = { contains: query.location };
  if (query.keyword) {
    where.OR = [{ title: { contains: query.keyword } }, { description: { contains: query.keyword } }];
  }

  const [total, rows] = await Promise.all([
    prisma.post.count({ where }),
    prisma.post.findMany({
      where,
      include: postInclude,
      orderBy: { createdAt: query.sort === 'OLDEST' ? 'asc' : 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return buildPageResult(rows.map(toPostDto), total, query);
}

export interface PostDetailDto extends PostDto {
  currentUserRelation: { isPublisher: boolean; myApplicationStatus: string | null } | null;
}

export async function getPostDetail(postId: string, viewerId?: string): Promise<PostDetailDto> {
  const post = await prisma.post.findUnique({ where: { id: postId }, include: postInclude });
  // 隐藏信息对公开访问等同不存在
  if (!post || post.status === 'HIDDEN') throw notFound('信息不存在或已被删除');

  let currentUserRelation: PostDetailDto['currentUserRelation'] = null;
  if (viewerId) {
    const isPublisher = post.publisher.id === viewerId;
    // docs/13 D4：优先 PENDING/ACCEPTED，否则最近一条
    const apps = await prisma.application.findMany({
      where: { postId, applicantId: viewerId },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    });
    const preferred = apps.find((a) => a.status === 'PENDING' || a.status === 'ACCEPTED');
    currentUserRelation = {
      isPublisher,
      myApplicationStatus: (preferred?.status ?? apps[0]?.status ?? null) as string | null,
    };
  }

  return { ...toPostDto(post), currentUserRelation };
}

export async function listMyPosts(userId: string, query: MyPostsQuery): Promise<PageResult<PostDto>> {
  const where: Prisma.PostWhereInput = { publisherId: userId };
  if (query.status) where.status = query.status;
  if (query.postType) where.postType = query.postType;

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
  return buildPageResult(rows.map(toPostDto), total, query);
}

async function assertCategory(categoryId: string): Promise<void> {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || !category.isActive) {
    throw new AppError(400, BusinessCode.VALIDATION_FAILED, '请求参数不正确', {
      fieldErrors: [{ field: 'categoryId', reason: '分类不存在或已停用' }],
    });
  }
}

function assertOccurredAt(occurredAt: string): Date {
  const date = parseIso(occurredAt);
  if (!date) {
    throw new AppError(400, BusinessCode.VALIDATION_FAILED, '请求参数不正确', {
      fieldErrors: [{ field: 'occurredAt', reason: '发生时间格式不正确' }],
    });
  }
  if (date.getTime() > Date.now()) {
    throw new AppError(400, BusinessCode.VALIDATION_FAILED, '请求参数不正确', {
      fieldErrors: [{ field: 'occurredAt', reason: '发生时间不能晚于当前时间' }],
    });
  }
  return date;
}

export async function createPost(userId: string, input: CreatePostInput): Promise<PostDto> {
  await assertCategory(input.categoryId);
  const occurredAt = assertOccurredAt(input.occurredAt);
  const images = input.images ?? [];

  const created = await prisma.$transaction(async (tx) => {
    const post = await tx.post.create({
      data: {
        publisherId: userId,
        categoryId: input.categoryId,
        postType: input.postType,
        title: input.title,
        description: input.description,
        location: input.location,
        occurredAt,
        reward: input.reward ?? null,
        status: 'OPEN',
        images: {
          create: images.map((url, index) => ({ url, sortOrder: index })),
        },
      },
      include: postInclude,
    });
    return post;
  });

  return toPostDto(created);
}

export async function updatePost(userId: string, postId: string, input: UpdatePostInput): Promise<PostDto> {
  const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, publisherId: true, status: true } });
  if (!post) throw notFound('信息不存在或已被删除');
  if (post.publisherId !== userId) throw forbidden('只能编辑本人发布的信息');
  if (post.status !== 'OPEN') {
    throw new AppError(409, BusinessCode.STATE_CONFLICT, '仅「正在寻找 / 等待认领」状态的信息可以编辑');
  }
  if (input.categoryId) await assertCategory(input.categoryId);
  const occurredAt = input.occurredAt ? assertOccurredAt(input.occurredAt) : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    // images 传了则整组替换（docs/13 D10）
    if (input.images !== undefined) {
      await tx.postImage.deleteMany({ where: { postId } });
      if (input.images.length > 0) {
        await tx.postImage.createMany({
          data: input.images.map((url, index) => ({ postId, url, sortOrder: index })),
        });
      }
    }
    return tx.post.update({
      where: { id: postId },
      data: {
        title: input.title,
        description: input.description,
        categoryId: input.categoryId,
        location: input.location,
        occurredAt,
        reward: input.reward === undefined ? undefined : input.reward,
      },
      include: postInclude,
    });
  });

  return toPostDto(updated);
}

export async function closePost(userId: string, postId: string): Promise<PostDto> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true, publisherId: true, status: true, _count: { select: { applications: true } } },
  });
  if (!post) throw notFound('信息不存在或已被删除');
  if (post.publisherId !== userId) throw forbidden('只能关闭本人发布的信息');
  if (post.status !== 'OPEN') {
    throw new AppError(409, BusinessCode.STATE_CONFLICT, '仅「正在寻找 / 等待认领」状态的信息可以关闭');
  }
  const accepted = await prisma.application.count({ where: { postId, status: 'ACCEPTED' } });
  if (accepted > 0) {
    throw new AppError(409, BusinessCode.STATE_CONFLICT, '该信息已有被接受的申请，请先完成或拒绝后再关闭');
  }
  const updated = await prisma.post.update({
    where: { id: postId },
    data: { status: 'CLOSED' },
    include: postInclude,
  });
  return toPostDto(updated);
}

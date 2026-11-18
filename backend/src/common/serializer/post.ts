import { toIsoShanghai } from '../../utils/time.js';
import { toUserSummary, type UserSummaryDto } from './user.js';

// Prisma 查询结果的最小形状（含 include 的 images / category / publisher）
export interface PostWithRelations {
  id: string;
  postType: string;
  title: string;
  description: string;
  categoryId: string;
  location: string;
  occurredAt: Date;
  reward: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  category: { name: string };
  publisher: { id: string; nickname: string; avatarUrl: string | null };
  images: { url: string; sortOrder: number }[];
  _count?: { applications: number };
}

export interface PostDto {
  id: string;
  postType: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  images: string[];
  location: string;
  occurredAt: string | null;
  reward: string | null;
  status: string;
  publisher: UserSummaryDto;
  applicationCount: number;
  createdAt: string | null;
  updatedAt: string | null;
}

/** DB → API 形状（docs/05 §8.1）：snake→camel、images 按 sortOrder、时间 +08:00 */
export function toPostDto(post: PostWithRelations): PostDto {
  return {
    id: post.id,
    postType: post.postType,
    title: post.title,
    description: post.description,
    categoryId: post.categoryId,
    categoryName: post.category.name,
    images: [...post.images].sort((a, b) => a.sortOrder - b.sortOrder).map((i) => i.url),
    location: post.location,
    occurredAt: toIsoShanghai(post.occurredAt),
    reward: post.reward,
    status: post.status,
    publisher: toUserSummary(post.publisher),
    applicationCount: post._count?.applications ?? 0,
    createdAt: toIsoShanghai(post.createdAt),
    updatedAt: toIsoShanghai(post.updatedAt),
  };
}

/** 列表/详情统一的 Prisma include，保证 serializer 需要的字段齐全 */
export const postInclude = {
  category: { select: { name: true } },
  publisher: { select: { id: true, nickname: true, avatarUrl: true } },
  images: { select: { url: true, sortOrder: true } },
  _count: { select: { applications: true } },
} as const;

import type { User } from '@prisma/client';
import { toIsoShanghai } from '../../utils/time.js';

export interface UserSummaryDto {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface UserDto {
  id: string;
  account: string;
  nickname: string;
  avatarUrl: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  createdAt: string | null;
}

/** 公开摘要：列表与详情只暴露这三项（docs/00 §7.4 隐私） */
export function toUserSummary(user: Pick<User, 'id' | 'nickname' | 'avatarUrl'>): UserSummaryDto {
  return { id: user.id, nickname: user.nickname, avatarUrl: user.avatarUrl };
}

/** 本人信息：仅 /auth/me 返回，永不含 passwordHash */
export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    account: user.account,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    phone: user.phone,
    email: user.email,
    role: user.role,
    createdAt: toIsoShanghai(user.createdAt),
  };
}

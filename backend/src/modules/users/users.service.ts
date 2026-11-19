import { prisma } from '../../config/prisma.js';
import { toUserDto, type UserDto } from '../../common/serializer/user.js';
import { notFound } from '../../common/exception/app-error.js';
import type { UpdateMeInput } from './users.schema.js';

/** 修改本人资料：只写白名单字段（account / role 不可改） */
export async function updateMe(userId: string, input: UpdateMeInput): Promise<UserDto> {
  const exists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!exists) throw notFound('用户不存在');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      nickname: input.nickname,
      avatarUrl: input.avatarUrl,
      phone: input.phone,
      email: input.email,
    },
  });
  return toUserDto(updated);
}

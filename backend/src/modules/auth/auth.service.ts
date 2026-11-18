import type { User } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { BusinessCode } from '../../common/exception/business-code.js';
import { AppError, unauthorized } from '../../common/exception/app-error.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import { expiresInSeconds, signAccessToken } from '../../utils/jwt.js';
import { toUserDto, type UserDto } from '../../common/serializer/user.js';
import type { LoginInput, RegisterInput } from './auth.schema.js';

export async function register(input: RegisterInput): Promise<Pick<User, 'id' | 'account' | 'nickname' | 'role'>> {
  const exists = await prisma.user.findUnique({ where: { account: input.account } });
  if (exists) {
    throw new AppError(409, BusinessCode.ACCOUNT_EXISTS, '该账号已被注册，换一个试试');
  }
  const user = await prisma.user.create({
    data: {
      account: input.account,
      passwordHash: await hashPassword(input.password),
      nickname: input.nickname,
      email: input.email ?? null,
      role: 'USER',
    },
    select: { id: true, account: true, nickname: true, role: true },
  });
  return user;
}

export interface LoginResult {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: UserDto;
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { account: input.account } });
  // 账号不存在与密码错误返回同一提示，避免账号枚举（docs/05 §2.3）
  if (!user) throw unauthorized('账号或密码错误');
  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw unauthorized('账号或密码错误');

  return {
    accessToken: signAccessToken({ sub: user.id, role: user.role }),
    tokenType: 'Bearer',
    expiresIn: expiresInSeconds(),
    user: toUserDto(user),
  };
}

export async function getMe(userId: string): Promise<UserDto> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw unauthorized();
  return toUserDto(user);
}

import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { sendSuccess } from '../../common/response/api-response.js';
import { loginSchema, registerSchema } from './auth.schema.js';
import { getMe, login, register } from './auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  validate('body', registerSchema),
  asyncHandler(async (req, res) => {
    const user = await register(req.body as never);
    sendSuccess(res, user, { status: 201, message: '注册成功' });
  }),
);

authRouter.post(
  '/login',
  validate('body', loginSchema),
  asyncHandler(async (req, res) => {
    const result = await login(req.body as never);
    sendSuccess(res, result);
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await getMe(req.user!.id);
    sendSuccess(res, user);
  }),
);

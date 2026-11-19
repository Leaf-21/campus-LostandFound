import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { sendSuccess } from '../../common/response/api-response.js';
import { updateMeSchema } from './users.schema.js';
import { updateMe } from './users.service.js';

// 挂在 /users/me 下，与其他 me 路由共享前缀
export const meProfileRouter = Router();

meProfileRouter.patch(
  '/',
  requireAuth,
  validate('body', updateMeSchema),
  asyncHandler(async (req, res) => {
    const user = await updateMe(req.user!.id, req.body as never);
    sendSuccess(res, user, { message: '资料已更新' });
  }),
);

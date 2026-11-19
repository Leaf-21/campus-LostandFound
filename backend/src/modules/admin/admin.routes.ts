import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { param } from '../../utils/params.js';
import { requireAdmin, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { sendSuccess } from '../../common/response/api-response.js';
import {
  adminPostIdParamSchema,
  hidePostSchema,
  listAdminPostsQuerySchema,
  restorePostSchema,
} from './admin.schema.js';
import { hidePost, listAdminPosts, listPostAdminActions, restorePost } from './admin.service.js';

// 全部接口需登录 + ADMIN 角色（docs/05 §10）
export const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);

adminRouter.get(
  '/posts',
  validate('query', listAdminPostsQuerySchema),
  asyncHandler(async (req, res) => {
    sendSuccess(res, await listAdminPosts(req.query as never));
  }),
);

adminRouter.post(
  '/posts/:postId/hide',
  validate('params', adminPostIdParamSchema),
  validate('body', hidePostSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as { reason?: string };
    const result = await hidePost(req.user!.id, param(req.params.postId, 'postId'), body.reason);
    sendSuccess(res, result, { message: '信息已隐藏' });
  }),
);

adminRouter.post(
  '/posts/:postId/restore',
  validate('params', adminPostIdParamSchema),
  validate('body', restorePostSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as { reason?: string };
    const result = await restorePost(req.user!.id, param(req.params.postId, 'postId'), body.reason);
    sendSuccess(res, result, { message: '信息已恢复' });
  }),
);

adminRouter.get(
  '/posts/:postId/actions',
  validate('params', adminPostIdParamSchema),
  asyncHandler(async (req, res) => {
    sendSuccess(res, await listPostAdminActions(param(req.params.postId, 'postId')));
  }),
);

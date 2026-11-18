import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { param } from '../../utils/params.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { sendSuccess } from '../../common/response/api-response.js';
import {
  createPostSchema,
  listPostsQuerySchema,
  myPostsQuerySchema,
  postIdParamSchema,
  updatePostSchema,
} from './posts.schema.js';
import {
  closePost,
  createPost,
  getPostDetail,
  listMyPosts,
  listPosts,
  updatePost,
} from './posts.service.js';

export const postsRouter = Router();

/** 信息广场：公开，登录时详情带 currentUserRelation */
postsRouter.get(
  '/',
  validate('query', listPostsQuerySchema),
  asyncHandler(async (req, res) => {
    sendSuccess(res, await listPosts(req.query as never));
  }),
);

postsRouter.post(
  '/',
  requireAuth,
  validate('body', createPostSchema),
  asyncHandler(async (req, res) => {
    const post = await createPost(req.user!.id, req.body as never);
    sendSuccess(res, post, { status: 201, message: '发布成功' });
  }),
);

postsRouter.get(
  '/:postId',
  optionalAuth,
  validate('params', postIdParamSchema),
  asyncHandler(async (req, res) => {
    sendSuccess(res, await getPostDetail(param(req.params.postId, 'postId'), req.user?.id));
  }),
);

postsRouter.patch(
  '/:postId',
  requireAuth,
  validate('params', postIdParamSchema),
  validate('body', updatePostSchema),
  asyncHandler(async (req, res) => {
    const post = await updatePost(req.user!.id, param(req.params.postId, 'postId'), req.body as never);
    sendSuccess(res, post, { message: '修改成功' });
  }),
);

postsRouter.post(
  '/:postId/close',
  requireAuth,
  validate('params', postIdParamSchema),
  asyncHandler(async (req, res) => {
    const post = await closePost(req.user!.id, param(req.params.postId, 'postId'));
    sendSuccess(res, post, { message: '信息已关闭' });
  }),
);

/** 我的发布 */
export const mePostsRouter = Router();

mePostsRouter.get(
  '/posts',
  requireAuth,
  validate('query', myPostsQuerySchema),
  asyncHandler(async (req, res) => {
    sendSuccess(res, await listMyPosts(req.user!.id, req.query as never));
  }),
);
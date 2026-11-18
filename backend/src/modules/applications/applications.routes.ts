import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { param } from '../../utils/params.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { sendSuccess } from '../../common/response/api-response.js';
import {
  applicationIdParamSchema,
  createApplicationSchema,
  decisionSchema,
  listPostApplicationsQuerySchema,
  myApplicationsQuerySchema,
  postIdParamSchema,
} from './applications.schema.js';
import {
  cancelApplication,
  completeApplication,
  createApplication,
  decideApplication,
  getApplication,
  listMyApplications,
  listPostApplications,
} from './applications.service.js';

/** 挂在 /posts 下的申请路由 */
export const postApplicationsRouter = Router({ mergeParams: true });

postApplicationsRouter.post(
  '/:postId/applications',
  requireAuth,
  validate('params', postIdParamSchema),
  validate('body', createApplicationSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as { details: string };
    const app = await createApplication(req.user!.id, param(req.params.postId, 'postId'), body.details);
    sendSuccess(res, app, { status: 201, message: '申请提交成功' });
  }),
);

postApplicationsRouter.get(
  '/:postId/applications',
  requireAuth,
  validate('params', postIdParamSchema),
  validate('query', listPostApplicationsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as { status?: string };
    const list = await listPostApplications(
      req.user!.id,
      req.user!.role === 'ADMIN',
      param(req.params.postId, 'postId'),
      query.status,
    );
    sendSuccess(res, list);
  }),
);

/** 挂在 /applications 下的处理路由 */
export const applicationsRouter = Router();

applicationsRouter.post(
  '/:applicationId/decision',
  requireAuth,
  validate('params', applicationIdParamSchema),
  validate('body', decisionSchema),
  asyncHandler(async (req, res) => {
    const app = await decideApplication(req.user!.id, param(req.params.applicationId, 'applicationId'), req.body as never);
    sendSuccess(res, app, { message: '处理成功' });
  }),
);

applicationsRouter.post(
  '/:applicationId/complete',
  requireAuth,
  validate('params', applicationIdParamSchema),
  asyncHandler(async (req, res) => {
    const app = await completeApplication(req.user!.id, param(req.params.applicationId, 'applicationId'));
    sendSuccess(res, app, { message: '交接完成' });
  }),
);

applicationsRouter.post(
  '/:applicationId/cancel',
  requireAuth,
  validate('params', applicationIdParamSchema),
  asyncHandler(async (req, res) => {
    const app = await cancelApplication(req.user!.id, param(req.params.applicationId, 'applicationId'));
    sendSuccess(res, app, { message: '申请已撤回' });
  }),
);

applicationsRouter.get(
  '/:applicationId',
  requireAuth,
  validate('params', applicationIdParamSchema),
  asyncHandler(async (req, res) => {
    const app = await getApplication(req.user!.id, req.user!.role === 'ADMIN', param(req.params.applicationId, 'applicationId'));
    sendSuccess(res, app);
  }),
);

/** 我的申请 / 我收到的申请 */
export const meApplicationsRouter = Router();

meApplicationsRouter.get(
  '/applications',
  requireAuth,
  validate('query', myApplicationsQuerySchema),
  asyncHandler(async (req, res) => {
    sendSuccess(res, await listMyApplications(req.user!.id, req.query as never));
  }),
);
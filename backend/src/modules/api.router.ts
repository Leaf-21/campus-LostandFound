import { Router } from 'express';
import { authRouter } from './auth/auth.routes.js';
import { categoriesRouter } from './categories/categories.routes.js';
import { mePostsRouter, postsRouter } from './posts/posts.routes.js';
import { filesRouter } from './files/files.routes.js';
import { applicationsRouter, meApplicationsRouter, postApplicationsRouter } from './applications/applications.routes.js';

// /api/v1 业务路由聚合（docs/05 §2.1）
export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/files', filesRouter);

// 帖子相关：帖子收到的申请挂在同一路径前缀下，先注册具体子路径
apiRouter.use('/posts', postApplicationsRouter);
apiRouter.use('/posts', postsRouter);

apiRouter.use('/applications', applicationsRouter);

// /users/me/*
apiRouter.use('/users/me', mePostsRouter);
apiRouter.use('/users/me', meApplicationsRouter);

import { Router } from 'express';

// /api/v1 业务路由聚合入口。
// 按 docs/06 §5 交付顺序挂载：auth → categories/posts → files → applications → admin。
export const apiRouter = Router();

// 示例（后续任务实现后启用）：
// apiRouter.use('/auth', authRouter);
// apiRouter.use('/categories', categoriesRouter);
// apiRouter.use('/posts', postsRouter);

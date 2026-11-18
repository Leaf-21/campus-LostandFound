import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../common/response/api-response.js';
import { listCategories } from './categories.service.js';

export const categoriesRouter = Router();

categoriesRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    sendSuccess(res, await listCategories());
  }),
);

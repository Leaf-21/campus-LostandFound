import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../../middleware/auth.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { sendSuccess } from '../../common/response/api-response.js';
import { AppError } from '../../common/exception/app-error.js';
import { BusinessCode } from '../../common/exception/business-code.js';
import { ALLOWED_MIME, buildStoredName, recordUpload, uploadLimits } from './files.service.js';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadLimits.dir),
  filename: (_req, file, cb) => cb(null, buildStoredName(file.originalname)),
});

const uploader = multer({
  storage,
  limits: { fileSize: uploadLimits.fileSize, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      // 交给路由层统一转成 415/40002
      cb(new AppError(415, BusinessCode.FILE_INVALID, '图片格式不支持（仅支持 JPG/PNG/WEBP）'));
      return;
    }
    cb(null, true);
  },
});

export const filesRouter = Router();

filesRouter.post(
  '/',
  requireAuth,
  (req, res, next) => {
    uploader.single('file')(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(new AppError(413, BusinessCode.FILE_INVALID, '图片大小超出限制（单张不超过 5MB）'));
          return;
        }
        next(new AppError(400, BusinessCode.FILE_INVALID, '上传请求不正确'));
        return;
      }
      next(err);
    });
  },
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError(400, BusinessCode.FILE_INVALID, '请选择要上传的图片');
    }
    const file = await recordUpload({
      uploaderId: req.user!.id,
      storedName: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      contentType: req.file.mimetype,
    });
    sendSuccess(res, file, { status: 201, message: '上传成功' });
  }),
);

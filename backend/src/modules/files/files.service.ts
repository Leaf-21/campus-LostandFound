import { randomUUID } from 'node:crypto';
import { prisma } from '../../config/prisma.js';
import { env, uploadDirAbs, publicBaseUrl } from '../../config/env.js';

export const ALLOWED_MIME = new Map<string, string>([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

export interface FileDto {
  fileId: string;
  url: string;
  fileName: string;
  size: number;
  contentType: string;
}

/** 生成不会冲突、不含用户输入的存储文件名，避免路径穿越 */
export function buildStoredName(originalName: string): string {
  const ext = originalName.includes('.') ? originalName.split('.').pop()!.toLowerCase() : '';
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? (ext === 'jpeg' ? 'jpg' : ext) : 'png';
  return `${randomUUID()}.${safeExt}`;
}

export function buildPublicUrl(storedName: string): string {
  return `${publicBaseUrl}/uploads/${storedName}`;
}

/** 落库上传元数据（docs/13 D1） */
export async function recordUpload(params: {
  uploaderId: string;
  storedName: string;
  originalName: string;
  size: number;
  contentType: string;
}): Promise<FileDto> {
  const url = buildPublicUrl(params.storedName);
  const file = await prisma.uploadedFile.create({
    data: {
      url,
      fileName: params.originalName.slice(0, 255),
      size: params.size,
      contentType: params.contentType,
      uploaderId: params.uploaderId,
    },
  });
  return {
    fileId: file.id,
    url: file.url,
    fileName: file.fileName,
    size: file.size,
    contentType: file.contentType,
  };
}

export const uploadLimits = {
  fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  dir: uploadDirAbs,
};

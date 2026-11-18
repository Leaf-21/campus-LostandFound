// 业务错误码（docs/05 §2.6），新增码必须先更新 API 文档。
export const BusinessCode = {
  SUCCESS: 0,
  VALIDATION_FAILED: 40001,
  FILE_INVALID: 40002,
  UNAUTHORIZED: 40101,
  FORBIDDEN: 40301,
  NOT_FOUND: 40401,
  STATE_CONFLICT: 40901,
  DUPLICATE_APPLICATION: 40902,
  POST_ALREADY_CONFIRMED: 40903,
  ACCOUNT_EXISTS: 40904,
  INTERNAL_ERROR: 50000,
} as const;

export type BusinessCodeValue = (typeof BusinessCode)[keyof typeof BusinessCode];

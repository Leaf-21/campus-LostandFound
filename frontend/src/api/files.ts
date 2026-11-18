import { http } from './http'
import { mockUploadFile, useMock } from '@/mock'
import type { FileInfo } from '@/types'

/** 上传图片（multipart/form-data，需要登录） */
export function uploadFile(file: File): Promise<FileInfo> {
  if (useMock()) return mockUploadFile(file)
  const form = new FormData()
  form.append('file', file)
  return http.post<FileInfo>('/files', form)
}

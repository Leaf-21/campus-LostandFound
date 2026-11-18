<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { AlertCircle, ImagePlus, Loader2, Trash2 } from 'lucide-vue-next'
import { uploadFile } from '@/api/files'
import { errorMessage } from '@/utils/format'

/**
 * 图片上传器：
 * - 点击选择 + 拖拽上传，JPG/PNG/WEBP，单张 ≤ 5MB，最多 5 张
 * - 本地预览 + 上传状态 + 失败提示 + 删除
 * - modelValue 为上传成功后的 URL 数组（编辑模式可预填已有图片）
 */
const props = defineProps<{ modelValue: string[] }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string[]): void }>()

const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024
const MAX_COUNT = 5

interface UploadItem {
  key: string
  preview: string
  url: string | null
  status: 'uploading' | 'success' | 'error'
  message?: string
}

const items = ref<UploadItem[]>([])
const inputRef = ref<HTMLInputElement>()
const dragging = ref(false)
let keySeq = 0

/** 同步外部已有图片（编辑模式预填）；内部上传过程不会自我触发重建 */
watch(
  () => props.modelValue,
  (urls) => {
    const current = items.value.map((i) => i.url).filter(Boolean)
    const same =
      urls.length === current.length && urls.every((u, i) => u === current[i])
    if (same) return
    items.value = urls.map((u) => ({
      key: `ext-${keySeq++}`,
      preview: u,
      url: u,
      status: 'success' as const
    }))
  },
  { immediate: true }
)

const canAdd = computed(() => items.value.length < MAX_COUNT)

function syncModel() {
  const urls = items.value
    .filter((i) => i.status === 'success' && i.url)
    .map((i) => i.url as string)
  emit('update:modelValue', urls)
}

function validateFile(file: File): string | null {
  if (!ACCEPT_TYPES.includes(file.type)) return '仅支持 JPG / PNG / WEBP 格式'
  if (file.size > MAX_SIZE) return '单张图片不能超过 5MB'
  return null
}

function addFiles(fileList: FileList | File[]) {
  const files = Array.from(fileList)
  if (!canAdd.value) {
    ElMessage.warning(`最多上传 ${MAX_COUNT} 张图片`)
    return
  }
  for (const file of files) {
    if (items.value.length >= MAX_COUNT) {
      ElMessage.warning(`最多上传 ${MAX_COUNT} 张图片`)
      break
    }
    const preview = URL.createObjectURL(file)
    const invalid = validateFile(file)
    if (invalid) {
      items.value.push({ key: `err-${keySeq++}`, preview, url: null, status: 'error', message: invalid })
      continue
    }
    const item: UploadItem = { key: `up-${keySeq++}`, preview, url: null, status: 'uploading' }
    items.value.push(item)
    void uploadOne(file, item)
  }
  if (inputRef.value) inputRef.value.value = ''
}

async function uploadOne(file: File, item: UploadItem) {
  try {
    const res = await uploadFile(file)
    item.url = res.url
    item.status = 'success'
  } catch (e) {
    item.status = 'error'
    item.message = errorMessage(e)
  }
  syncModel()
}

function remove(index: number) {
  const item = items.value[index]
  if (item && item.preview.startsWith('blob:')) URL.revokeObjectURL(item.preview)
  items.value.splice(index, 1)
  syncModel()
}

function onInputChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) addFiles(input.files)
}

function onDrop(e: DragEvent) {
  dragging.value = false
  if (e.dataTransfer?.files?.length) addFiles(e.dataTransfer.files)
}
</script>

<template>
  <div class="image-uploader">
    <div class="image-uploader__grid">
      <div v-for="(item, index) in items" :key="item.key" class="upload-item">
        <img :src="item.preview" alt="已选图片" />
        <div
          v-if="item.status === 'uploading'"
          class="upload-item__mask"
          role="status"
          aria-label="上传中"
        >
          <Loader2 :size="20" class="upload-item__spin" />
          <span>上传中…</span>
        </div>
        <div
          v-else-if="item.status === 'error'"
          class="upload-item__mask upload-item__mask--error"
          :title="item.message"
        >
          <AlertCircle :size="20" />
          <span>上传失败</span>
          <small>{{ item.message }}</small>
        </div>
        <button
          v-if="item.status !== 'uploading'"
          type="button"
          class="upload-item__remove"
          aria-label="删除图片"
          @click.stop="remove(index)"
        >
          <Trash2 :size="14" />
        </button>
      </div>

      <button
        v-if="canAdd"
        type="button"
        class="upload-add"
        :class="{ 'is-dragging': dragging }"
        @click="inputRef?.click()"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <ImagePlus :size="26" />
        <span class="upload-add__text">点击或拖拽上传</span>
        <span class="upload-add__hint">JPG / PNG / WEBP · 单张 ≤ 5MB</span>
      </button>
    </div>

    <p class="image-uploader__meta">
      已选 {{ items.length }} / {{ MAX_COUNT }} 张 · 图片选填，最多 5 张
    </p>

    <input
      ref="inputRef"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      multiple
      hidden
      @change="onInputChange"
    />
  </div>
</template>

<style lang="scss" scoped>
.image-uploader__grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.upload-item,
.upload-add {
  aspect-ratio: 4 / 3;
  border-radius: var(--radius-control);
  overflow: hidden;
}

.upload-item {
  position: relative;
  border: 1px solid var(--color-border);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.upload-item__mask {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: rgba(255, 255, 255, 0.86);
  color: var(--color-text-secondary);
  font-size: 12px;

  small {
    padding: 0 10px;
    text-align: center;
    font-size: 11px;
    color: var(--color-danger);
  }
}

.upload-item__mask--error {
  color: var(--color-danger);
}

.upload-item__spin {
  animation: uploader-spin 1s linear infinite;
}

@keyframes uploader-spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-item__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 50%;
  background: rgba(31, 42, 39, 0.62);
  color: #fff;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover {
    background: var(--color-danger);
  }
}

.upload-add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 2px dashed var(--color-border-strong);
  background: var(--color-bg);
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, color 0.2s ease;

  &:hover,
  &.is-dragging {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    color: var(--color-primary);
  }
}

.upload-add__text {
  font-size: 13px;
  font-weight: 600;
}

.upload-add__hint {
  font-size: 11px;
  opacity: 0.85;
}

.image-uploader__meta {
  margin-top: 10px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
</style>

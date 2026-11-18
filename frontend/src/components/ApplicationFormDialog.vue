<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { Post } from '@/types'
import { APPLICATION_TYPE_LABEL } from '@/utils/constants'

const props = defineProps<{
  visible: boolean
  post: Post | null
  submitting?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'submit', details: string): void
}>()

const formRef = ref<FormInstance>()
const details = ref('')

/** FOUND 提认领申请，LOST 提线索 */
const typeLabel = computed(() => {
  if (!props.post) return '提交申请'
  return props.post.postType === 'FOUND'
    ? APPLICATION_TYPE_LABEL.CLAIM
    : APPLICATION_TYPE_LABEL.CLUE
})

const guideText = computed(() =>
  props.post?.postType === 'FOUND'
    ? '请描述物品的显著特征、可提供的领取凭证或联系方式，便于发布者核实身份。'
    : '请描述您了解到的线索，例如看到物品的时间、地点和去向，帮助失主尽快找回。'
)

const rules: FormRules = {
  details: [
    { required: true, message: '请填写申请说明', trigger: 'blur' },
    { min: 10, max: 500, message: '申请说明需在 10–500 字之间', trigger: 'blur' }
  ]
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      details.value = ''
      formRef.value?.clearValidate()
    }
  }
)

function close() {
  if (!props.submitting) emit('update:visible', false)
}

async function submit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  emit('submit', details.value.trim())
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="typeLabel"
    width="520px"
    :close-on-click-modal="!submitting"
    :close-on-press-escape="!submitting"
    :show-close="!submitting"
    @update:model-value="close"
  >
    <p class="app-dialog__post">{{ post?.title }}</p>
    <p class="app-dialog__guide">{{ guideText }}</p>
    <el-form ref="formRef" :model="{ details }" :rules="rules">
      <el-form-item prop="details">
        <el-input
          v-model="details"
          type="textarea"
          :rows="5"
          maxlength="500"
          show-word-limit
          placeholder="请详细描述…（10–500 字）"
          :disabled="submitting"
        />
      </el-form-item>
    </el-form>
    <el-alert
      v-if="errorMessage"
      type="error"
      :closable="false"
      class="app-dialog__error"
      :title="errorMessage"
    />
    <template #footer>
      <el-button :disabled="submitting" @click="close">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submit">提交申请</el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.app-dialog__post {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
}

.app-dialog__guide {
  font-size: 13px;
  color: var(--color-text-secondary);
  background: var(--color-primary-light);
  border-radius: var(--radius-control);
  padding: 10px 14px;
  margin-bottom: 14px;
  line-height: 1.7;
}

.app-dialog__error {
  border-radius: var(--radius-control);
}
</style>

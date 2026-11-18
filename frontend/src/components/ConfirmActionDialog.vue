<script setup lang="ts">
import { ref, watch } from 'vue'
import { AlertTriangle } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    visible: boolean
    title: string
    description?: string
    confirmText?: string
    /** 危险操作使用红色按钮 */
    danger?: boolean
    loading?: boolean
    errorMessage?: string
    /** 是否附带处理说明输入（接受/拒绝申请时可选填写） */
    noteEnabled?: boolean
    noteLabel?: string
    notePlaceholder?: string
  }>(),
  {
    confirmText: '确认',
    danger: false,
    loading: false,
    noteEnabled: false,
    noteLabel: '处理说明',
    notePlaceholder: '选填，最多 200 字，对方可在申请详情中看到'
  }
)

const emit = defineEmits<{
  (e: 'update:visible', v: boolean): void
  (e: 'confirm', note: string): void
}>()

const note = ref('')

watch(
  () => props.visible,
  (v) => {
    if (v) note.value = ''
  }
)

function close() {
  if (!props.loading) emit('update:visible', false)
}

function confirm() {
  emit('confirm', note.value.trim())
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    :title="title"
    width="440px"
    :close-on-click-modal="!loading"
    :close-on-press-escape="!loading"
    :show-close="!loading"
    @update:model-value="close"
  >
    <div class="confirm-body">
      <div class="confirm-icon" :class="{ 'is-danger': danger }">
        <AlertTriangle :size="22" />
      </div>
      <p v-if="description" class="confirm-desc">{{ description }}</p>

      <div v-if="noteEnabled" class="confirm-note">
        <label class="confirm-note__label">{{ noteLabel }}</label>
        <el-input
          v-model="note"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          :placeholder="notePlaceholder"
          :disabled="loading"
        />
      </div>

      <el-alert
        v-if="errorMessage"
        type="error"
        :closable="false"
        class="confirm-error"
        :title="errorMessage"
      />
    </div>
    <template #footer>
      <el-button :disabled="loading" @click="close">再想想</el-button>
      <el-button :type="danger ? 'danger' : 'primary'" :loading="loading" @click="confirm">
        {{ confirmText }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.confirm-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.confirm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: var(--color-warning-light);
  color: var(--color-warning);

  &.is-danger {
    background: var(--color-danger-light);
    color: var(--color-danger);
  }
}

.confirm-desc {
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.8;
}

.confirm-note__label {
  display: block;
  font-size: 13px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.confirm-error {
  border-radius: var(--radius-control);
}
</style>

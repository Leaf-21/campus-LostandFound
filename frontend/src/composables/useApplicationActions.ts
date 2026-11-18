import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { completeApplication, decideApplication } from '@/api/applications'
import { errorMessage } from '@/utils/format'
import type { Application } from '@/types'

export type AppAction = 'accept' | 'reject' | 'complete'

const TITLES: Record<AppAction, string> = {
  accept: '接受这条申请？',
  reject: '拒绝这条申请？',
  complete: '确认完成交接？'
}

const CONFIRM_TEXTS: Record<AppAction, string> = {
  accept: '确认接受',
  reject: '确认拒绝',
  complete: '确认完成交接'
}

const SUCCESS_TEXTS: Record<AppAction, string> = {
  accept: '已接受申请，信息进入处理中',
  reject: '已拒绝该申请',
  complete: '交接完成，信息已标记为已找回/已归还'
}

/**
 * 申请处理交互（接受/拒绝/完成）：
 * 二次确认 → 调用接口（提交期间防重复）→ 成功反馈 → 触发父级刷新
 */
export function useApplicationActions(onDone: () => void) {
  const dialogVisible = ref(false)
  const dialogAction = ref<AppAction>('accept')
  const target = ref<Application | null>(null)
  const submitting = ref(false)
  const actionError = ref('')

  const dialogTitle = computed(() => TITLES[dialogAction.value])
  const dialogConfirmText = computed(() => CONFIRM_TEXTS[dialogAction.value])
  const dialogDanger = computed(() => dialogAction.value === 'reject')
  const dialogNoteEnabled = computed(() => dialogAction.value !== 'complete')

  const dialogDescription = computed(() => {
    const title = target.value?.postTitle ?? '该信息'
    switch (dialogAction.value) {
      case 'accept':
        return `接受后「${title}」将进入处理中，其余待处理申请会自动拒绝。此操作不可撤销。`
      case 'reject':
        return `拒绝后，申请人可在该信息重新开放时再次提交申请。`
      case 'complete':
        return '确认后该信息将标记为已找回/已归还，且不可撤销。请确认双方已完成物品交接。'
    }
  })

  function open(action: AppAction, app: Application) {
    dialogAction.value = action
    target.value = app
    actionError.value = ''
    dialogVisible.value = true
  }

  async function confirm(note: string) {
    if (!target.value) return
    submitting.value = true
    actionError.value = ''
    try {
      if (dialogAction.value === 'complete') {
        await completeApplication(target.value.id)
      } else {
        await decideApplication(target.value.id, {
          decision: dialogAction.value === 'accept' ? 'ACCEPTED' : 'REJECTED',
          reviewNote: note || undefined
        })
      }
      ElMessage.success(SUCCESS_TEXTS[dialogAction.value])
      dialogVisible.value = false
      onDone()
    } catch (e) {
      actionError.value = errorMessage(e)
    } finally {
      submitting.value = false
    }
  }

  return {
    dialogVisible,
    dialogAction,
    target,
    submitting,
    actionError,
    dialogTitle,
    dialogDescription,
    dialogConfirmText,
    dialogDanger,
    dialogNoteEnabled,
    open,
    confirm
  }
}

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronDown, ChevronUp, MessageSquareText } from 'lucide-vue-next'
import type { Application } from '@/types'
import { APPLICATION_TYPE_LABEL } from '@/utils/constants'
import { avatarText, formatDateTime } from '@/utils/format'
import StatusBadge from './StatusBadge.vue'

const props = withDefaults(
  defineProps<{
    application: Application
    /** submitted：我提交的申请；received：我收到的申请 */
    context: 'submitted' | 'received'
    showActions?: boolean
    /** submitted 场景下待处理申请显示「撤回申请」按钮 */
    showCancel?: boolean
    busy?: boolean
  }>(),
  { showActions: false, showCancel: false, busy: false }
)

const emit = defineEmits<{
  (e: 'accept', app: Application): void
  (e: 'reject', app: Application): void
  (e: 'complete', app: Application): void
  (e: 'cancel', app: Application): void
}>()

const router = useRouter()
const expanded = ref(false)

const canToggle = computed(() => props.application.details.length > 72)

function goPost() {
  router.push(`/posts/${props.application.postId}`)
}
</script>

<template>
  <div class="app-card">
    <div class="app-card__head">
      <el-avatar :size="40" :src="application.applicant.avatarUrl ?? undefined">
        {{ avatarText(application.applicant.nickname) }}
      </el-avatar>
      <div class="app-card__who">
        <div class="app-card__name-row">
          <strong class="app-card__strong">
            {{ context === 'received' ? application.applicant.nickname : application.postTitle }}
          </strong>
          <span
            class="type-tag"
            :class="application.applicationType === 'CLAIM' ? 'type-tag--found' : 'type-tag--lost'"
          >
            {{ APPLICATION_TYPE_LABEL[application.applicationType] }}
          </span>
        </div>
        <p class="app-card__meta">
          <template v-if="context === 'received'">{{ application.postTitle }} · </template>
          {{ formatDateTime(application.createdAt) }}
        </p>
      </div>
      <StatusBadge
        class="app-card__status"
        :status="application.status"
        variant="application"
      />
    </div>

    <p class="app-card__details" :class="{ 'is-clamped': !expanded }">
      {{ application.details }}
    </p>
    <el-button
      v-if="canToggle"
      link
      type="primary"
      class="app-card__toggle"
      @click="expanded = !expanded"
    >
      {{ expanded ? '收起' : '展开' }}
      <ChevronDown v-if="!expanded" :size="14" />
      <ChevronUp v-else :size="14" />
    </el-button>

    <div v-if="application.reviewNote" class="app-card__note">
      <MessageSquareText :size="15" class="app-card__note-icon" />
      <div>
        <strong>发布者回复：</strong>{{ application.reviewNote }}
      </div>
    </div>

    <div class="app-card__actions">
      <el-button link type="primary" @click="goPost">查看信息</el-button>
      <el-button
        v-if="showCancel && context === 'submitted' && application.status === 'PENDING'"
        type="danger"
        plain
        :disabled="busy"
        @click="emit('cancel', application)"
      >
        撤回申请
      </el-button>
      <template v-if="showActions && context === 'received'">
        <template v-if="application.status === 'PENDING'">
          <el-button type="primary" :disabled="busy" @click="emit('accept', application)">
            接受申请
          </el-button>
          <el-button type="danger" plain :disabled="busy" @click="emit('reject', application)">
            拒绝
          </el-button>
        </template>
        <el-button
          v-else-if="application.status === 'ACCEPTED'"
          type="primary"
          :disabled="busy"
          @click="emit('complete', application)"
        >
          确认完成交接
        </el-button>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.app-card {
  padding: 16px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    border-color: var(--color-border-strong);
    box-shadow: var(--shadow-card);
  }
}

.app-card__head {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.app-card__who {
  flex: 1;
  min-width: 0;
}

.app-card__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.app-card__strong {
  font-size: 15px;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 320px;
}

.app-card__meta {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-card__status {
  flex-shrink: 0;
}

.app-card__details {
  margin-top: 12px;
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;

  &.is-clamped {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    overflow: hidden;
  }
}

.app-card__toggle {
  padding: 2px 0;
  font-size: 13px;
}

.app-card__note {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-control);
  background: var(--color-primary-light);
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.7;

  strong {
    color: var(--color-primary);
  }
}

.app-card__note-icon {
  flex-shrink: 0;
  color: var(--color-primary);
  margin-top: 3px;
}

.app-card__actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--color-border);
  flex-wrap: wrap;

  > :first-child {
    margin-right: auto;
  }
}
</style>

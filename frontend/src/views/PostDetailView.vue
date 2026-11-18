<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Gift,
  MapPin,
  Package,
  Pencil,
  User
} from 'lucide-vue-next'
import ImageGallery from '@/components/ImageGallery.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
import ApplicationCard from '@/components/ApplicationCard.vue'
import ApplicationFormDialog from '@/components/ApplicationFormDialog.vue'
import ConfirmActionDialog from '@/components/ConfirmActionDialog.vue'
import { useApplicationActions } from '@/composables/useApplicationActions'
import { createApplication, getPostApplications } from '@/api/applications'
import { getPostDetail } from '@/api/posts'
import { useAuthStore } from '@/stores/auth'
import { errorMessage, avatarText, formatDateTime } from '@/utils/format'
import { POST_TYPE_LABEL, POST_TYPE_SHORT, postStatusExplanation } from '@/utils/constants'
import type { Application, PostDetail } from '@/types'

const props = defineProps<{ id: string }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const detail = ref<PostDetail | null>(null)
const loading = ref(false)
const error = ref('')

/* ---------- 发布者收到的申请 ---------- */
const apps = ref<Application[]>([])
const appsLoading = ref(false)
const appsError = ref('')

/* ---------- 提交申请弹窗 ---------- */
const applyVisible = ref(false)
const applySubmitting = ref(false)
const applyError = ref('')

/* ---------- 关系与可操作性 ---------- */
const isPublisher = computed(() => detail.value?.currentUserRelation?.isPublisher ?? false)
const myStatus = computed(() => detail.value?.currentUserRelation?.myApplicationStatus ?? null)

/** 状态 OPEN 且未登录/未申请过，或申请已撤回 → 可重新提交 */
const canApply = computed(() => {
  if (!detail.value || detail.value.status !== 'OPEN' || isPublisher.value) return false
  return myStatus.value === null || myStatus.value === 'CANCELLED'
})

const applyLabel = computed(() =>
  detail.value?.postType === 'FOUND' ? '提交认领申请' : '提供线索'
)

const pendingCount = computed(() => apps.value.filter((a) => a.status === 'PENDING').length)

/* ---------- 申请处理（接受/拒绝/完成）二次确认 ---------- */
const {
  dialogVisible: actionDialogVisible,
  dialogTitle: actionDialogTitle,
  dialogDescription: actionDialogDescription,
  dialogConfirmText: actionDialogConfirmText,
  dialogDanger: actionDialogDanger,
  submitting: actionSubmitting,
  actionError,
  dialogNoteEnabled: actionDialogNoteEnabled,
  open: openAction,
  confirm: confirmAction
} = useApplicationActions(() => {
  void loadDetail()
  void loadApps()
})

async function loadDetail() {
  loading.value = true
  error.value = ''
  try {
    detail.value = await getPostDetail(props.id)
    if (detail.value.currentUserRelation?.isPublisher) await loadApps()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

async function loadApps() {
  appsLoading.value = true
  appsError.value = ''
  try {
    apps.value = await getPostApplications(props.id)
  } catch (e) {
    appsError.value = errorMessage(e)
  } finally {
    appsLoading.value = false
  }
}

async function submitApplication(description: string) {
  if (!detail.value) return
  applySubmitting.value = true
  applyError.value = ''
  try {
    await createApplication(detail.value.id, { details: description })
    ElMessage.success('申请已提交，请等待发布者处理')
    applyVisible.value = false
    await loadDetail()
  } catch (e) {
    applyError.value = errorMessage(e)
  } finally {
    applySubmitting.value = false
  }
}

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/posts')
}

function goLogin() {
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

/* 同组件内跳转到另一条信息（如从「收到的申请」进入）时重新加载 */
watch(
  () => props.id,
  () => {
    apps.value = []
    void loadDetail()
  }
)

onMounted(() => {
  void loadDetail()
})
</script>

<template>
  <div class="page-container detail-page">
    <button type="button" class="detail-back" @click="goBack">
      <ArrowLeft :size="16" />返回
    </button>

    <LoadingSkeleton v-if="loading && !detail" variant="detail" />
    <ErrorState v-else-if="error && !detail" :message="error" @retry="loadDetail" />

    <template v-else-if="detail">
      <div class="detail-grid">
        <!-- 左侧：图片 -->
        <div class="detail-media">
          <ImageGallery :images="detail.images" />
        </div>

        <!-- 右侧：信息与操作 -->
        <div class="detail-info">
          <div class="detail-tags">
            <span
              class="type-tag"
              :class="detail.postType === 'LOST' ? 'type-tag--lost' : 'type-tag--found'"
            >
              {{ POST_TYPE_LABEL[detail.postType] }}
            </span>
            <StatusBadge :status="detail.status" variant="post" :post-type="detail.postType" />
          </div>

          <h1 class="detail-title">{{ detail.title }}</h1>

          <ul class="detail-meta">
            <li>
              <Package :size="16" class="detail-meta__icon" />
              <span class="detail-meta__label">分类</span>{{ detail.categoryName }}
            </li>
            <li>
              <MapPin :size="16" class="detail-meta__icon" />
              <span class="detail-meta__label">地点</span>{{ detail.location }}
            </li>
            <li>
              <Calendar :size="16" class="detail-meta__icon" />
              <span class="detail-meta__label">发生时间</span>{{ formatDateTime(detail.occurredAt) }}
            </li>
            <li>
              <Clock :size="16" class="detail-meta__icon" />
              <span class="detail-meta__label">发布时间</span>{{ formatDateTime(detail.createdAt) }}
            </li>
          </ul>

          <div v-if="detail.reward" class="detail-reward">
            <Gift :size="16" class="detail-reward__icon" />
            <span><strong>酬谢说明：</strong>{{ detail.reward }}</span>
          </div>

          <section class="detail-desc">
            <h2>详细描述</h2>
            <p>{{ detail.description }}</p>
          </section>

          <div class="detail-publisher">
            <el-avatar :size="44" :src="detail.publisher.avatarUrl ?? undefined">
              {{ avatarText(detail.publisher.nickname) }}
            </el-avatar>
            <div class="detail-publisher__body">
              <strong>{{ detail.publisher.nickname }}</strong>
              <span>发布者 · 发布于 {{ formatDateTime(detail.createdAt) }}</span>
            </div>
          </div>

          <!-- 主操作区：按登录态 / 身份 / 状态分派 -->
          <div class="detail-actions">
            <template v-if="!auth.isLoggedIn">
              <el-button type="primary" size="large" round @click="goLogin">
                登录后{{ detail.postType === 'FOUND' ? '提交认领申请' : '提供线索' }}
              </el-button>
              <p class="detail-actions__hint">提交申请或提供线索需要先登录，浏览信息不受影响。</p>
            </template>

            <template v-else-if="isPublisher">
              <div class="detail-actions__row">
                <el-button
                  v-if="detail.status === 'OPEN'"
                  type="primary"
                  round
                  @click="router.push(`/posts/${detail.id}/edit`)"
                >
                  <Pencil :size="15" class="detail-actions__btn-icon" />编辑信息
                </el-button>
                <el-alert
                  v-else-if="postStatusExplanation(detail.status, detail.postType)"
                  type="info"
                  :closable="false"
                  :title="postStatusExplanation(detail.status, detail.postType)"
                />
              </div>
              <p class="detail-actions__hint">
                这是你发布的信息{{ detail.status === 'OPEN' ? '，可在下方查看并处理收到的申请。' : '。' }}
              </p>
            </template>

            <template v-else>
              <template v-if="canApply">
                <el-button type="primary" size="large" round @click="applyVisible = true">
                  {{ applyLabel }}
                </el-button>
              </template>

              <template v-else-if="myStatus === 'PENDING'">
                <el-button type="primary" size="large" round disabled>
                  {{ POST_TYPE_SHORT[detail.postType] }}申请已提交，等待处理
                </el-button>
                <p class="detail-actions__hint">
                  你已提交申请，请耐心等待发布者处理。可前往
                  <router-link to="/me">个人中心</router-link>查看进度或撤回申请。
                </p>
              </template>

              <template v-else-if="myStatus === 'REJECTED'">
                <el-alert
                  type="warning"
                  :closable="false"
                  title="你的申请未被接受"
                  description="如仍有需要，可以重新提交申请，并尽量补充更详细的描述。"
                  show-icon
                />
                <el-button type="primary" round @click="applyVisible = true">重新提交申请</el-button>
              </template>

              <template v-else-if="myStatus === 'ACCEPTED'">
                <el-alert
                  type="success"
                  :closable="false"
                  title="你的申请已被接受"
                  description="请与发布者保持联系并约定交接方式，交接完成后由发布者确认完成。"
                  show-icon
                />
              </template>

              <template v-else-if="myStatus === 'COMPLETED'">
                <el-alert
                  type="success"
                  :closable="false"
                  title="交接已完成"
                  :description="
                    detail.postType === 'FOUND'
                      ? '该物品已归还，感谢你与发布者的互信互助。'
                      : '该物品已找回，感谢你提供的线索与帮助。'
                  "
                  show-icon
                />
              </template>

              <template v-else-if="detail.status !== 'OPEN'">
                <el-alert
                  type="info"
                  :closable="false"
                  :title="postStatusExplanation(detail.status, detail.postType)"
                />
              </template>
            </template>
          </div>
        </div>
      </div>

      <!-- 发布者：收到的申请 -->
      <section v-if="isPublisher" class="section detail-apps">
        <div class="section-head">
          <div>
            <h2>收到的申请</h2>
            <p class="section-sub">待处理 {{ pendingCount }} 条 · 共 {{ apps.length }} 条</p>
          </div>
        </div>

        <LoadingSkeleton v-if="appsLoading" variant="list" :count="3" />
        <ErrorState v-else-if="appsError" :message="appsError" @retry="loadApps" />
        <EmptyState
          v-else-if="!apps.length"
          title="还没有收到申请"
          description="信息发布后，其他同学可以在详情页提交认领申请或提供线索。"
        />
        <div v-else class="detail-apps__list">
          <ApplicationCard
            v-for="app in apps"
            :key="app.id"
            :application="app"
            context="received"
            show-actions
            :busy="actionSubmitting"
            @accept="(a) => openAction('accept', a)"
            @reject="(a) => openAction('reject', a)"
            @complete="(a) => openAction('complete', a)"
          />
        </div>
      </section>
    </template>

    <!-- 提交申请弹窗 -->
    <ApplicationFormDialog
      v-model:visible="applyVisible"
      :post="detail"
      :submitting="applySubmitting"
      :error-message="applyError"
      @submit="submitApplication"
    />

    <!-- 申请处理二次确认弹窗 -->
    <ConfirmActionDialog
      v-model:visible="actionDialogVisible"
      :title="actionDialogTitle"
      :description="actionDialogDescription"
      :confirm-text="actionDialogConfirmText"
      :danger="actionDialogDanger"
      :loading="actionSubmitting"
      :error-message="actionError"
      :note-enabled="actionDialogNoteEnabled"
      note-label="处理说明（选填）"
      @confirm="confirmAction"
    />
  </div>
</template>

<style lang="scss" scoped>
.detail-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: none;
  color: var(--color-text-secondary);
  font-size: 14px;
  cursor: pointer;
  padding: 4px 6px;
  margin-bottom: 14px;
  border-radius: var(--radius-control);
  transition: color 0.2s ease, background 0.2s ease;

  &:hover {
    color: var(--color-primary);
    background: var(--color-primary-light);
  }
}

.detail-grid {
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 32px;
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

.detail-media {
  position: sticky;
  top: calc(var(--header-height) + 16px);

  @media (max-width: 900px) {
    position: static;
  }
}

.detail-info {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 24px 26px 28px;

  @media (max-width: 640px) {
    padding: 18px 16px 22px;
  }
}

.detail-tags {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-title {
  margin-top: 12px;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;

  @media (max-width: 640px) {
    font-size: 20px;
  }
}

.detail-meta {
  list-style: none;
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;

  li {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: var(--color-text);
  }
}

.detail-meta__icon {
  color: var(--color-primary);
  flex-shrink: 0;
}

.detail-meta__label {
  color: var(--color-text-secondary);
  min-width: 64px;
}

.detail-reward {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 10px 14px;
  border-radius: var(--radius-control);
  background: var(--color-accent-light);
  font-size: 13px;
  color: #8a4e24;

  strong {
    color: var(--color-accent);
  }
}

.detail-reward__icon {
  flex-shrink: 0;
  color: var(--color-accent);
}

.detail-desc {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px dashed var(--color-border);

  h2 {
    font-size: 15px;
    margin-bottom: 8px;
  }

  p {
    font-size: 14px;
    color: var(--color-text);
    line-height: 1.9;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.detail-publisher {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 14px 16px;
  background: var(--color-bg);
  border-radius: var(--radius-control);

  :deep(.el-avatar) {
    background: var(--color-primary-light);
    color: var(--color-primary);
    font-weight: 700;
  }
}

.detail-publisher__body {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;

  strong {
    font-size: 15px;
  }

  span {
    font-size: 12px;
    color: var(--color-text-secondary);
  }
}

.detail-actions {
  margin-top: 22px;
  padding-top: 20px;
  border-top: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;

  :deep(.el-alert) {
    width: 100%;
    border-radius: var(--radius-control);
  }
}

.detail-actions__row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  width: 100%;

  :deep(.el-alert) {
    flex: 1;
    min-width: 200px;
  }
}

.detail-actions__btn-icon {
  margin-right: 6px;
  vertical-align: -2px;
}

.detail-actions__hint {
  font-size: var(--fs-helper);
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.detail-apps__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { LogOut, Plus } from 'lucide-vue-next'
import PostGrid from '@/components/PostGrid.vue'
import ApplicationCard from '@/components/ApplicationCard.vue'
import ConfirmActionDialog from '@/components/ConfirmActionDialog.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import ErrorState from '@/components/ErrorState.vue'
import EmptyState from '@/components/EmptyState.vue'
import { useApplicationActions } from '@/composables/useApplicationActions'
import { getMyPosts } from '@/api/posts'
import { cancelApplication, getMyApplications } from '@/api/applications'
import { useAuthStore } from '@/stores/auth'
import { errorMessage, avatarText } from '@/utils/format'
import { APPLICATION_STATUS_LABEL } from '@/utils/constants'
import type { Application, ApplicationStatus, Post } from '@/types'

const router = useRouter()
const auth = useAuthStore()

const activeTab = ref('posts')

/* ---------- 我的发布 ---------- */
const POST_STATUS_CHIPS: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  { value: 'OPEN', label: '开放中' },
  { value: 'PROCESSING', label: '处理中' },
  { value: 'RESOLVED', label: '已完成' },
  { value: 'CLOSED', label: '已关闭' }
]

const postsTab = reactive({
  list: [] as Post[],
  page: 1,
  pageSize: 6,
  total: 0,
  totalPages: 0,
  status: '',
  loading: false,
  error: '',
  loaded: false
})

/* ---------- 我提交的 / 我收到的申请 ---------- */
const APP_STATUS_CHIPS: { value: string; label: string }[] = [
  { value: '', label: '全部' },
  ...(Object.keys(APPLICATION_STATUS_LABEL) as ApplicationStatus[]).map((s) => ({
    value: s,
    label: APPLICATION_STATUS_LABEL[s]
  }))
]

function makeAppTab() {
  return {
    list: [] as Application[],
    page: 1,
    pageSize: 5,
    total: 0,
    totalPages: 0,
    status: '',
    loading: false,
    error: '',
    loaded: false
  }
}

const submittedTab = reactive(makeAppTab())
const receivedTab = reactive(makeAppTab())

/* ---------- 申请处理（接受/拒绝/完成） ---------- */
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
} = useApplicationActions(() => void fetchReceived())

/* ---------- 数据加载 ---------- */

async function fetchMyPosts() {
  postsTab.loading = true
  postsTab.error = ''
  try {
    const res = await getMyPosts({
      status: (postsTab.status || undefined) as Post['status'] | undefined,
      page: postsTab.page,
      pageSize: postsTab.pageSize
    })
    postsTab.list = res.items
    postsTab.total = res.total
    postsTab.totalPages = res.totalPages
  } catch (e) {
    postsTab.error = errorMessage(e)
  } finally {
    postsTab.loading = false
    postsTab.loaded = true
  }
}

async function fetchSubmitted() {
  submittedTab.loading = true
  submittedTab.error = ''
  try {
    const res = await getMyApplications({
      role: 'SUBMITTED',
      status: (submittedTab.status || undefined) as ApplicationStatus | undefined,
      page: submittedTab.page,
      pageSize: submittedTab.pageSize
    })
    submittedTab.list = res.items
    submittedTab.total = res.total
    submittedTab.totalPages = res.totalPages
  } catch (e) {
    submittedTab.error = errorMessage(e)
  } finally {
    submittedTab.loading = false
    submittedTab.loaded = true
  }
}

async function fetchReceived() {
  receivedTab.loading = true
  receivedTab.error = ''
  try {
    const res = await getMyApplications({
      role: 'RECEIVED',
      status: (receivedTab.status || undefined) as ApplicationStatus | undefined,
      page: receivedTab.page,
      pageSize: receivedTab.pageSize
    })
    receivedTab.list = res.items
    receivedTab.total = res.total
    receivedTab.totalPages = res.totalPages
  } catch (e) {
    receivedTab.error = errorMessage(e)
  } finally {
    receivedTab.loading = false
    receivedTab.loaded = true
  }
}

/** 切换 Tab 时懒加载：仅首次进入对应 Tab 才请求 */
watch(activeTab, (tab) => {
  if (tab === 'posts' && !postsTab.loaded) void fetchMyPosts()
  else if (tab === 'submitted' && !submittedTab.loaded) void fetchSubmitted()
  else if (tab === 'received' && !receivedTab.loaded) void fetchReceived()
})

/* 分页变化触发重新请求 */
watch(
  () => postsTab.page,
  () => void fetchMyPosts()
)
watch(
  () => submittedTab.page,
  () => void fetchSubmitted()
)
watch(
  () => receivedTab.page,
  () => void fetchReceived()
)

/* 状态筛选变化：页码重置为 1（页码 watcher 触发请求），已是第 1 页则直接请求 */
function setPostsStatus(s: string) {
  if (postsTab.status === s) return
  postsTab.status = s
  if (postsTab.page !== 1) postsTab.page = 1
  else void fetchMyPosts()
}

function setSubmittedStatus(s: string) {
  if (submittedTab.status === s) return
  submittedTab.status = s
  if (submittedTab.page !== 1) submittedTab.page = 1
  else void fetchSubmitted()
}

function setReceivedStatus(s: string) {
  if (receivedTab.status === s) return
  receivedTab.status = s
  if (receivedTab.page !== 1) receivedTab.page = 1
  else void fetchReceived()
}

/* ---------- 撤回申请 ---------- */

async function onCancelApplication(app: Application) {
  try {
    await ElMessageBox.confirm(
      `撤回后「${app.postTitle}」的申请将失效，确定撤回吗？`,
      '撤回申请',
      { type: 'warning', confirmButtonText: '撤回', cancelButtonText: '再想想' }
    )
  } catch {
    return // 用户取消
  }
  try {
    await cancelApplication(app.id)
    ElMessage.success('申请已撤回')
    await fetchSubmitted()
  } catch (e) {
    ElMessage.error(errorMessage(e))
  }
}

/* ---------- 退出登录 ---------- */

async function onLogout() {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '退出登录', {
      type: 'warning',
      confirmButtonText: '退出',
      cancelButtonText: '再想想'
    })
  } catch {
    return
  }
  auth.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

const roleLabel = computed(() => (auth.user?.role === 'ADMIN' ? '管理员' : '同学'))

onMounted(() => {
  void auth.fetchMe()
  if (activeTab.value === 'posts') void fetchMyPosts()
})
</script>

<template>
  <div class="page-container me-page">
    <!-- 用户卡片 -->
    <div class="me-profile">
      <el-avatar :size="64" :src="auth.user?.avatarUrl ?? undefined" class="me-profile__avatar">
        {{ avatarText(auth.user?.nickname) }}
      </el-avatar>
      <div class="me-profile__body">
        <div class="me-profile__name-row">
          <h1>{{ auth.user?.nickname ?? '加载中…' }}</h1>
          <span v-if="auth.user" class="type-tag type-tag--lost">{{ roleLabel }}</span>
        </div>
        <p class="me-profile__meta">
          账号：{{ auth.user?.account ?? '—' }}
          <template v-if="auth.user?.email"> · {{ auth.user.email }}</template>
        </p>
      </div>
      <div class="me-profile__actions">
        <el-button type="primary" round @click="router.push('/publish')">
          <Plus :size="15" class="me-profile__btn-icon" />发布信息
        </el-button>
        <el-button plain round @click="onLogout">
          <LogOut :size="15" class="me-profile__btn-icon" />退出登录
        </el-button>
      </div>
    </div>

    <!-- 三个 Tab -->
    <el-tabs v-model="activeTab" class="me-tabs">
      <!-- 我的发布 -->
      <el-tab-pane label="我的发布" name="posts">
        <div class="me-chips">
          <button
            v-for="chip in POST_STATUS_CHIPS"
            :key="chip.value"
            type="button"
            class="me-chip"
            :class="{ 'is-active': postsTab.status === chip.value }"
            @click="setPostsStatus(chip.value)"
          >
            {{ chip.label }}
          </button>
        </div>

        <LoadingSkeleton v-if="postsTab.loading && !postsTab.list.length" variant="cards" :count="3" />
        <ErrorState v-else-if="postsTab.error" :message="postsTab.error" @retry="fetchMyPosts" />
        <EmptyState
          v-else-if="!postsTab.list.length"
          :title="postsTab.status ? '该状态下没有发布的信息' : '还没有发布过信息'"
          description="发布寻物启事或失物招领，让更多同学看到，提高找回几率。"
          action-text="发布信息"
          @action="router.push('/publish')"
        />
        <template v-else>
          <div class="me-grid" :class="{ 'is-refreshing': postsTab.loading }">
            <PostGrid :posts="postsTab.list" />
          </div>
          <el-pagination
            v-if="postsTab.totalPages > 1"
            v-model:current-page="postsTab.page"
            :page-size="postsTab.pageSize"
            :total="postsTab.total"
            layout="prev, pager, next, total"
            background
          />
        </template>
      </el-tab-pane>

      <!-- 我提交的申请 -->
      <el-tab-pane label="我提交的申请" name="submitted">
        <div class="me-chips">
          <button
            v-for="chip in APP_STATUS_CHIPS"
            :key="chip.value"
            type="button"
            class="me-chip"
            :class="{ 'is-active': submittedTab.status === chip.value }"
            @click="setSubmittedStatus(chip.value)"
          >
            {{ chip.label }}
          </button>
        </div>

        <LoadingSkeleton v-if="submittedTab.loading && !submittedTab.list.length" variant="list" :count="3" />
        <ErrorState v-else-if="submittedTab.error" :message="submittedTab.error" @retry="fetchSubmitted" />
        <EmptyState
          v-else-if="!submittedTab.list.length"
          :title="submittedTab.status ? '该状态下没有申请记录' : '还没有提交过申请'"
          description="在信息详情页可以提交认领申请或提供线索，进度会展示在这里。"
          action-text="去信息广场"
          @action="router.push('/posts')"
        />
        <template v-else>
          <div class="me-list" :class="{ 'is-refreshing': submittedTab.loading }">
            <ApplicationCard
              v-for="app in submittedTab.list"
              :key="app.id"
              :application="app"
              context="submitted"
              show-cancel
              @cancel="onCancelApplication"
            />
          </div>
          <el-pagination
            v-if="submittedTab.totalPages > 1"
            v-model:current-page="submittedTab.page"
            :page-size="submittedTab.pageSize"
            :total="submittedTab.total"
            layout="prev, pager, next, total"
            background
          />
        </template>
      </el-tab-pane>

      <!-- 我收到的申请 -->
      <el-tab-pane label="我收到的申请" name="received">
        <div class="me-chips">
          <button
            v-for="chip in APP_STATUS_CHIPS"
            :key="chip.value"
            type="button"
            class="me-chip"
            :class="{ 'is-active': receivedTab.status === chip.value }"
            @click="setReceivedStatus(chip.value)"
          >
            {{ chip.label }}
          </button>
        </div>

        <LoadingSkeleton v-if="receivedTab.loading && !receivedTab.list.length" variant="list" :count="3" />
        <ErrorState v-else-if="receivedTab.error" :message="receivedTab.error" @retry="fetchReceived" />
        <EmptyState
          v-else-if="!receivedTab.list.length"
          :title="receivedTab.status ? '该状态下没有申请记录' : '还没有收到申请'"
          description="你发布的信息被其他同学申请后，会按待处理优先展示在这里。"
          action-text="发布信息"
          @action="router.push('/publish')"
        />
        <template v-else>
          <div class="me-list" :class="{ 'is-refreshing': receivedTab.loading }">
            <ApplicationCard
              v-for="app in receivedTab.list"
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
          <el-pagination
            v-if="receivedTab.totalPages > 1"
            v-model:current-page="receivedTab.page"
            :page-size="receivedTab.pageSize"
            :total="receivedTab.total"
            layout="prev, pager, next, total"
            background
          />
        </template>
      </el-tab-pane>
    </el-tabs>

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
.me-profile {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 24px 26px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card);

  @media (max-width: 640px) {
    flex-wrap: wrap;
    padding: 18px 16px;
  }
}

.me-profile__avatar {
  flex-shrink: 0;
  --el-avatar-background-color: var(--color-primary-light);
  color: var(--color-primary);
  font-size: 24px;
  font-weight: 700;
}

.me-profile__body {
  flex: 1;
  min-width: 0;
}

.me-profile__name-row {
  display: flex;
  align-items: center;
  gap: 10px;

  h1 {
    font-size: 22px;
  }
}

.me-profile__meta {
  margin-top: 4px;
  font-size: var(--fs-helper);
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.me-profile__actions {
  display: flex;
  gap: 10px;
  flex-shrink: 0;

  @media (max-width: 640px) {
    width: 100%;
  }
}

.me-profile__btn-icon {
  margin-right: 6px;
  vertical-align: -2px;
}

.me-tabs {
  margin-top: 8px;

  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}

.me-chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.me-chip {
  padding: 5px 14px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  background: #fff;
  color: var(--color-text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  &.is-active {
    border-color: var(--color-primary);
    background: var(--color-primary-light);
    color: var(--color-primary);
    font-weight: 600;
  }
}

.me-grid,
.me-list {
  transition: opacity 0.2s ease;

  &.is-refreshing {
    opacity: 0.55;
    pointer-events: none;
  }
}

.me-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
</style>

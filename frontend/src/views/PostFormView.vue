<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import PostTypeTabs from '@/components/PostTypeTabs.vue'
import ImageUploader from '@/components/ImageUploader.vue'
import LoadingSkeleton from '@/components/LoadingSkeleton.vue'
import ErrorState from '@/components/ErrorState.vue'
import { createPost, getPostDetail, updatePost } from '@/api/posts'
import { useCategoryStore } from '@/stores/categories'
import { errorMessage } from '@/utils/format'
import { POST_TYPE_LABEL, postStatusLabel } from '@/utils/constants'
import type { PostStatus, PostType } from '@/types'

const route = useRoute()
const router = useRouter()
const categoryStore = useCategoryStore()

/** 发布与编辑共用本视图：/publish 发布，/posts/:id/edit 编辑 */
const isEdit = computed(() => route.name === 'post-edit')
const pageTitle = computed(() => (isEdit.value ? '编辑信息' : '发布信息'))
const pageSub = computed(() =>
  isEdit.value
    ? '修改信息内容后保存，信息类型不可更改。'
    : '填写物品信息，让更多同学看到，提高找回几率。'
)

const formRef = ref<FormInstance>()
const form = reactive({
  postType: 'LOST' as PostType,
  title: '',
  description: '',
  categoryId: '',
  location: '',
  occurredAt: dayjs().format('YYYY-MM-DDTHH:mm:ss+08:00'),
  reward: '',
  images: [] as string[]
})

/* 编辑模式：加载原信息 */
const editStatus = ref<PostStatus | ''>('')
const loading = ref(false)
const loadError = ref('')
const submitting = ref(false)
const submitError = ref('')

/** 编辑模式下仅 OPEN 状态允许编辑（服务端同样校验） */
const isEditOpen = computed(() => !isEdit.value || editStatus.value === 'OPEN')

const rules: FormRules = {
  title: [
    { required: true, message: '请填写标题', trigger: 'blur' },
    { min: 2, max: 30, message: '标题需在 2–30 字之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请填写详细描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述需在 10–500 字之间', trigger: 'blur' }
  ],
  categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
  location: [
    { required: true, message: '请填写地点', trigger: 'blur' },
    { min: 2, max: 50, message: '地点需在 2–50 字之间', trigger: 'blur' }
  ],
  occurredAt: [{ required: true, message: '请选择发生时间', trigger: 'change' }],
  reward: [{ max: 50, message: '酬谢说明不超过 50 字', trigger: 'blur' }]
}

const disabledDate = (d: Date) => d.getTime() > Date.now()

async function loadForEdit() {
  if (!isEdit.value) return
  loading.value = true
  loadError.value = ''
  try {
    const detail = await getPostDetail(String(route.params.id))
    form.postType = detail.postType
    form.title = detail.title
    form.description = detail.description
    form.categoryId = detail.categoryId
    form.location = detail.location
    form.occurredAt = detail.occurredAt
    form.reward = detail.reward ?? ''
    form.images = [...detail.images]
    editStatus.value = detail.status
  } catch (e) {
    loadError.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

async function submit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  submitError.value = ''
  try {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      categoryId: form.categoryId,
      location: form.location.trim(),
      occurredAt: form.occurredAt,
      reward: form.reward.trim() || null,
      images: form.images
    }
    if (isEdit.value) {
      await updatePost(String(route.params.id), payload)
      ElMessage.success('信息已更新')
      router.replace(`/posts/${String(route.params.id)}`)
    } else {
      const post = await createPost({ ...payload, postType: form.postType })
      ElMessage.success('发布成功')
      router.replace(`/posts/${post.id}`)
    }
  } catch (e) {
    submitError.value = errorMessage(e)
  } finally {
    submitting.value = false
  }
}

function cancel() {
  if (window.history.length > 1) router.back()
  else router.push('/posts')
}

onMounted(() => {
  void categoryStore.fetch()
  void loadForEdit()
})
</script>

<template>
  <div class="page-container form-page">
    <div class="form-head">
      <h1>{{ pageTitle }}</h1>
      <p>{{ pageSub }}</p>
    </div>

    <LoadingSkeleton v-if="loading" variant="detail" />
    <ErrorState v-else-if="loadError" :message="loadError" @retry="loadForEdit" />

    <el-alert
      v-else-if="isEdit && !isEditOpen"
      type="warning"
      :closable="false"
      show-icon
      :title="`当前状态为「${postStatusLabel(editStatus as PostStatus, form.postType)}」，不可编辑`"
      description="仅「正在寻找 / 等待认领」状态的信息可以编辑。若信息有误，可联系平台管理员处理。"
      class="form-lock-alert"
    />

    <div v-else class="form-card">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <!-- 类型：发布可选，编辑锁定 -->
        <template v-if="!isEdit">
          <el-form-item label="信息类型">
            <PostTypeTabs v-model="form.postType" class="form-type-tabs" />
          </el-form-item>
        </template>
        <div v-else class="form-type-lock">
          <span
            class="type-tag"
            :class="form.postType === 'LOST' ? 'type-tag--lost' : 'type-tag--found'"
          >
            {{ POST_TYPE_LABEL[form.postType] }}
          </span>
          <span class="form-type-lock__note">编辑模式下信息类型不可更改</span>
        </div>

        <el-form-item label="标题" prop="title">
          <el-input
            v-model="form.title"
            maxlength="30"
            show-word-limit
            placeholder="一句话描述，如：寻找黑色双肩包（图书馆）"
            :disabled="submitting"
          />
        </el-form-item>

        <div class="form-grid">
          <el-form-item label="分类" prop="categoryId">
            <el-select
              v-model="form.categoryId"
              placeholder="选择物品分类"
              :disabled="submitting"
              class="form-grid__item"
            >
              <el-option v-for="c in categoryStore.items" :key="c.id" :label="c.name" :value="c.id" />
            </el-select>
          </el-form-item>

          <el-form-item label="地点" prop="location">
            <el-input
              v-model="form.location"
              maxlength="50"
              show-word-limit
              placeholder="如：图书馆二楼自习区"
              :disabled="submitting"
            />
          </el-form-item>
        </div>

        <el-form-item label="发生时间" prop="occurredAt">
          <el-date-picker
            v-model="form.occurredAt"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss+08:00"
            placeholder="选择丢失 / 捡到物品的时间"
            :disabled-date="disabledDate"
            :disabled="submitting"
            class="form-date"
          />
        </el-form-item>

        <el-form-item label="详细描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="6"
            maxlength="500"
            show-word-limit
            placeholder="描述物品的品牌、颜色、显著特征，以及丢失/捡到的经过…（10–500 字）"
            :disabled="submitting"
          />
        </el-form-item>

        <el-form-item label="酬谢说明（选填）" prop="reward">
          <el-input
            v-model="form.reward"
            maxlength="50"
            show-word-limit
            placeholder="如：捡到归还者酬谢一杯奶茶（50 字以内）"
            :disabled="submitting"
          />
        </el-form-item>

        <el-form-item label="物品图片（选填）">
          <ImageUploader v-model="form.images" />
        </el-form-item>

        <el-alert
          v-if="submitError"
          type="error"
          :closable="false"
          :title="submitError"
          class="form-submit-error"
        />

        <div class="form-actions">
          <el-button size="large" round :disabled="submitting" @click="cancel">取消</el-button>
          <el-button type="primary" size="large" round :loading="submitting" @click="submit">
            {{ isEdit ? '保存修改' : '发布信息' }}
          </el-button>
        </div>
      </el-form>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.form-head {
  margin-bottom: 20px;

  h1 {
    font-size: var(--fs-page-title);
    font-weight: 700;
  }

  p {
    margin-top: 6px;
    font-size: var(--fs-helper);
    color: var(--color-text-secondary);
  }
}

.form-card {
  max-width: 760px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  padding: 28px 30px 30px;

  @media (max-width: 640px) {
    padding: 20px 16px 24px;
  }
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--color-text);
}

.form-type-tabs {
  max-width: 100%;
}

.form-type-lock {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 4px 0 20px;
}

.form-type-lock__note {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0 16px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
}

.form-grid__item {
  width: 100%;
}

.form-date {
  width: 100%;
}

.form-submit-error {
  margin-bottom: 16px;
  border-radius: var(--radius-control);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 6px;
}

.form-lock-alert {
  max-width: 760px;
  border-radius: var(--radius-card);
}
</style>

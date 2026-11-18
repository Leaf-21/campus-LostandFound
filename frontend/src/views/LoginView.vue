<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Lock, PackageSearch, User } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { MOCK_LOGIN_HINT } from '@/mock'
import { errorMessage, safeRedirect } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const form = reactive({ account: '', password: '' })
const submitting = ref(false)
const error = ref('')

const rules: FormRules = {
  account: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

onMounted(() => {
  // 注册成功后跳转过来时自动填充账号
  if (typeof route.query.account === 'string') form.account = route.query.account
})

async function submit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  error.value = ''
  try {
    await auth.login({ account: form.account.trim(), password: form.password })
    ElMessage.success('登录成功，欢迎回来')
    router.replace(safeRedirect(route.query.redirect))
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <router-link to="/" class="auth-logo">
        <span class="auth-logo__icon"><PackageSearch :size="26" /></span>
        <span class="auth-logo__text">校园失物招领</span>
      </router-link>

      <h1 class="auth-title">欢迎回来</h1>
      <p class="auth-sub">登录后可发布信息、提交申请、跟踪处理进度</p>

      <el-alert
        v-if="MOCK_LOGIN_HINT"
        type="info"
        :closable="false"
        class="auth-hint"
        :title="MOCK_LOGIN_HINT"
      />

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
        <el-form-item label="账号" prop="account">
          <el-input
            v-model="form.account"
            size="large"
            placeholder="请输入账号"
            :prefix-icon="User"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            size="large"
            type="password"
            show-password
            placeholder="请输入密码"
            :prefix-icon="Lock"
            autocomplete="current-password"
          />
        </el-form-item>
      </el-form>

      <el-alert v-if="error" type="error" :closable="false" class="auth-error" :title="error" />

      <el-button
        type="primary"
        size="large"
        class="auth-submit"
        :loading="submitting"
        @click="submit"
      >
        {{ submitting ? '登录中…' : '登 录' }}
      </el-button>

      <p class="auth-footer">
        还没有账号？<router-link to="/register">立即注册</router-link>
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 16px;
  background: linear-gradient(160deg, var(--color-primary-light) 0%, var(--color-bg) 55%);
}

.auth-card {
  width: 100%;
  max-width: 420px;
  padding: 36px 34px 30px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-card);
  box-shadow: var(--shadow-card-hover);
}

.auth-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--color-text);

  &:hover {
    color: var(--color-primary);
  }
}

.auth-logo__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--color-primary);
  color: #fff;
}

.auth-logo__text {
  font-size: 17px;
  font-weight: 700;
}

.auth-title {
  margin-top: 22px;
  font-size: 24px;
}

.auth-sub {
  margin-top: 6px;
  font-size: var(--fs-helper);
  color: var(--color-text-secondary);
}

.auth-hint {
  margin-top: 16px;
  border-radius: var(--radius-control);
}

:deep(.el-form) {
  margin-top: 22px;
}

:deep(.el-form-item__label) {
  font-weight: 600;
  color: var(--color-text);
}

.auth-error {
  border-radius: var(--radius-control);
}

.auth-submit {
  width: 100%;
  margin-top: 4px;
  font-size: 16px;
  letter-spacing: 4px;
}

.auth-footer {
  margin-top: 20px;
  text-align: center;
  font-size: var(--fs-helper);
  color: var(--color-text-secondary);
}

@media (max-width: 480px) {
  .auth-card {
    padding: 28px 20px 24px;
  }
}
</style>

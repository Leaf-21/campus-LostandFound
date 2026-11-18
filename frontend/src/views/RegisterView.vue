<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { AtSign, Lock, PackageSearch, User } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/utils/format'

const router = useRouter()
const auth = useAuthStore()

const formRef = ref<FormInstance>()
const form = reactive({
  account: '',
  nickname: '',
  email: '',
  password: '',
  confirm: ''
})
const submitting = ref(false)
const error = ref('')

const rules: FormRules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9_]{4,30}$/,
      message: '账号需为 4–30 位字母、数字或下划线',
      trigger: 'blur'
    }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称需在 2–20 字之间', trigger: 'blur' }
  ],
  email: [{ type: 'email', message: '邮箱格式不正确', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 32, message: '密码需在 8–32 位之间', trigger: 'blur' }
  ],
  confirm: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== form.password) callback(new Error('两次输入的密码不一致'))
        else callback()
      },
      trigger: 'blur'
    }
  ]
}

async function submit() {
  if (!formRef.value) return
  const ok = await formRef.value.validate().catch(() => false)
  if (!ok) return
  submitting.value = true
  error.value = ''
  try {
    await auth.register({
      account: form.account.trim(),
      password: form.password,
      nickname: form.nickname.trim(),
      email: form.email.trim() || undefined
    })
    ElMessage.success('注册成功，请登录')
    router.replace({ path: '/login', query: { account: form.account.trim() } })
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

      <h1 class="auth-title">创建账号</h1>
      <p class="auth-sub">注册后即可发布寻物/招领信息，也能提交认领申请与线索</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @keyup.enter="submit">
        <el-form-item label="账号" prop="account">
          <el-input
            v-model="form.account"
            size="large"
            placeholder="4–30 位字母、数字或下划线"
            :prefix-icon="AtSign"
            autocomplete="username"
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="form.nickname"
            size="large"
            placeholder="将展示给其他同学"
            :prefix-icon="User"
          />
        </el-form-item>
        <el-form-item label="邮箱（选填）" prop="email">
          <el-input
            v-model="form.email"
            size="large"
            placeholder="用于接收信息进展通知"
            :prefix-icon="AtSign"
            autocomplete="email"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            size="large"
            type="password"
            show-password
            placeholder="8–32 位密码"
            :prefix-icon="Lock"
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm">
          <el-input
            v-model="form.confirm"
            size="large"
            type="password"
            show-password
            placeholder="再次输入密码"
            :prefix-icon="Lock"
            autocomplete="new-password"
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
        {{ submitting ? '注册中…' : '注 册' }}
      </el-button>

      <p class="auth-footer">
        已有账号？<router-link to="/login">直接登录</router-link>
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
  max-width: 440px;
  padding: 32px 34px 28px;
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
  margin-top: 18px;
  font-size: 24px;
}

.auth-sub {
  margin-top: 6px;
  font-size: var(--fs-helper);
  color: var(--color-text-secondary);
}

:deep(.el-form) {
  margin-top: 18px;
}

:deep(.el-form-item) {
  margin-bottom: 16px;
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
  margin-top: 2px;
  font-size: 16px;
  letter-spacing: 4px;
}

.auth-footer {
  margin-top: 18px;
  text-align: center;
  font-size: var(--fs-helper);
  color: var(--color-text-secondary);
}

@media (max-width: 480px) {
  .auth-card {
    padding: 26px 20px 22px;
  }
}
</style>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { updateCurrentUserPassword } from '../api/users'
import { ApiError } from '../api/errors'
import { authStore, updateAuthUser } from '../stores/auth'

const route = useRoute()
const router = useRouter()

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const message = ref('')

const hasPassword = computed(() => authStore.user?.hasPassword === true)
const redirectPath = computed(() => route.query.redirect || '/')
const title = computed(() => (hasPassword.value ? '修改登录密码' : '设置登录密码'))
const subtitle = computed(() => (hasPassword.value
  ? '如果你是密码登录，需要输入当前密码；如果刚通过邮箱验证码登录，可直接设置新密码。'
  : '首次使用邮箱验证码登录后，请先设置密码，之后就可以直接用邮箱和密码登录。'))

async function handleSubmit() {
  message.value = ''
  if (newPassword.value.length < 8 || newPassword.value.length > 64) {
    message.value = '新密码长度必须为 8-64 位'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    message.value = '两次输入的新密码不一致'
    return
  }

  submitting.value = true
  try {
    const user = await updateCurrentUserPassword({
      currentPassword: hasPassword.value ? currentPassword.value : undefined,
      newPassword: newPassword.value,
    })
    updateAuthUser(user)
    await router.replace(redirectPath.value)
  } catch (error) {
    message.value = error instanceof ApiError ? error.message : '密码保存失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <section class="craft-card-solid rounded-[2rem] p-8">
      <div class="space-y-6">
        <div>
          <div class="section-title">账号安全</div>
          <h1 class="mt-2 text-3xl font-bold tracking-tight text-slate-950">{{ title }}</h1>
          <p class="section-subtitle mt-2">{{ subtitle }}</p>
        </div>

        <label v-if="hasPassword" class="block space-y-2">
          <span class="text-sm font-medium text-slate-600">当前密码（验证码登录后可不填）</span>
          <input v-model="currentPassword" class="craft-input" type="password" autocomplete="current-password" maxlength="64" />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-medium text-slate-600">新密码</span>
          <input v-model="newPassword" class="craft-input" type="password" autocomplete="new-password" maxlength="64" @keyup.enter="handleSubmit" />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-medium text-slate-600">确认新密码</span>
          <input v-model="confirmPassword" class="craft-input" type="password" autocomplete="new-password" maxlength="64" @keyup.enter="handleSubmit" />
        </label>

        <button class="craft-btn craft-btn-primary w-full" :disabled="submitting" @click="handleSubmit">
          {{ submitting ? '保存中...' : '保存密码' }}
        </button>

        <div v-if="message" class="rounded-[1.25rem] bg-rose-50 p-4 text-sm leading-7 text-rose-600">
          {{ message }}
        </div>
      </div>
    </section>
  </div>
</template>

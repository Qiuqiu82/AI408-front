<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginWithCode, sendLoginCode } from '../api/auth'
import { ApiError } from '../api/errors'

const route = useRoute()
const router = useRouter()

const mobile = ref('13800138000')
const code = ref('123456')
const sending = ref(false)
const submitting = ref(false)
const tip = ref('开发期默认验证码是 123456。')

const redirectPath = computed(() => route.query.redirect || '/')

async function handleSendCode() {
  sending.value = true
  tip.value = ''
  try {
    const result = await sendLoginCode(mobile.value)
    tip.value = `验证码已发送，有效期 ${result.expireSeconds} 秒。开发期可直接输入 123456。`
  } catch (error) {
    tip.value = error instanceof ApiError ? error.message : '发送验证码失败'
  } finally {
    sending.value = false
  }
}

async function handleLogin() {
  submitting.value = true
  tip.value = ''
  try {
    await loginWithCode({ mobile: mobile.value, code: code.value })
    await router.replace(redirectPath.value)
  } catch (error) {
    tip.value = error instanceof ApiError ? error.message : '登录失败'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
    <section class="craft-card overflow-hidden rounded-[2rem] p-8">
      <div class="max-w-xl space-y-5">
        <div class="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">AI408 MVP</div>
        <h1 class="text-4xl font-semibold tracking-tight text-slate-900">登录后开始刷题、导题和 AI 讲解</h1>
        <p class="text-base leading-8 text-slate-600">
          这个版本已经接入真实后端，登录后就能创建练习会话、导入题库，并用 Qwen 做流式讲解。
        </p>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-[1.25rem] bg-slate-50 p-4">
            <div class="text-sm text-slate-500">登录方式</div>
            <div class="mt-2 font-semibold text-slate-900">手机号 + 验证码</div>
          </div>
          <div class="rounded-[1.25rem] bg-slate-50 p-4">
            <div class="text-sm text-slate-500">开发验证码</div>
            <div class="mt-2 font-semibold text-slate-900">123456</div>
          </div>
          <div class="rounded-[1.25rem] bg-slate-50 p-4">
            <div class="text-sm text-slate-500">管理员</div>
            <div class="mt-2 font-semibold text-slate-900">13800138000</div>
          </div>
        </div>
      </div>
    </section>

    <section class="craft-card-solid rounded-[2rem] p-8">
      <div class="space-y-4">
        <div>
          <div class="section-title">登录</div>
          <p class="section-subtitle mt-1">输入手机号和验证码后进入系统。</p>
        </div>

        <label class="block space-y-2">
          <span class="text-sm font-medium text-slate-600">手机号</span>
          <input v-model="mobile" class="craft-input" maxlength="11" placeholder="13800138000" />
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-medium text-slate-600">验证码</span>
          <div class="flex gap-3">
            <input v-model="code" class="craft-input flex-1" maxlength="6" placeholder="123456" />
            <button class="craft-btn craft-btn-soft shrink-0" :disabled="sending" @click="handleSendCode">
              {{ sending ? '发送中...' : '发送验证码' }}
            </button>
          </div>
        </label>

        <button class="craft-btn craft-btn-primary w-full" :disabled="submitting" @click="handleLogin">
          {{ submitting ? '登录中...' : '进入系统' }}
        </button>

        <div v-if="tip" class="rounded-[1.25rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
          {{ tip }}
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { loginWithCode, loginWithPassword, sendLoginCode } from '../api/auth'
import { ApiError } from '../api/errors'

const route = useRoute()
const router = useRouter()

const loginMode = ref('password')
const email = ref('')
const password = ref('')
const code = ref('')
const sending = ref(false)
const submitting = ref(false)
const countdown = ref(0)
const tip = ref('日常使用推荐密码登录；首次登录或忘记密码时，可使用邮箱验证码登录后重设密码。')
let timerId = null

const redirectPath = computed(() => route.query.redirect || '/')
const canSendCode = computed(() => !sending.value && countdown.value <= 0 && email.value.trim())
const isPasswordMode = computed(() => loginMode.value === 'password')

function switchMode(mode) {
  loginMode.value = mode
  tip.value = mode === 'password'
    ? '日常使用推荐密码登录；如果忘记密码，请切换到验证码登录。'
    : '验证码登录可用于首次登录和忘记密码，登录后会引导你设置新密码。'
}

function startCountdown(seconds = 60) {
  countdown.value = seconds
  if (timerId) {
    window.clearInterval(timerId)
  }
  timerId = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) {
      window.clearInterval(timerId)
      timerId = null
    }
  }, 1000)
}

async function handleSendCode() {
  if (!canSendCode.value) {
    return
  }
  sending.value = true
  tip.value = ''
  try {
    const result = await sendLoginCode(email.value.trim())
    tip.value = `验证码已发送到 ${email.value.trim()}，有效期 ${result.expireSeconds} 秒。`
    startCountdown(60)
  } catch (error) {
    tip.value = error instanceof ApiError ? error.message : '验证码发送失败'
  } finally {
    sending.value = false
  }
}

async function handleLogin() {
  submitting.value = true
  tip.value = ''
  try {
    if (isPasswordMode.value) {
      await loginWithPassword({ email: email.value.trim(), password: password.value })
    } else {
      await loginWithCode({ email: email.value.trim(), code: code.value.trim() })
    }
    await router.replace(redirectPath.value)
  } catch (error) {
    tip.value = error instanceof ApiError ? error.message : '登录失败'
  } finally {
    submitting.value = false
  }
}

onBeforeUnmount(() => {
  if (timerId) {
    window.clearInterval(timerId)
  }
})
</script>

<template>
  <div class="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
    <section class="craft-card overflow-hidden rounded-[2rem] p-8">
      <div class="max-w-xl space-y-5">
        <div class="inline-flex rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">AI408</div>
        <h1 class="text-4xl font-semibold tracking-tight text-slate-900">登录后开始刷题、复盘和 AI 讲解</h1>
        <p class="text-base leading-8 text-slate-600">
          使用邮箱账号进入系统。首次登录或忘记密码时使用验证码，设置密码后即可用邮箱和密码快速登录。
        </p>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-[1.25rem] bg-slate-50 p-4">
            <div class="text-sm text-slate-500">日常登录</div>
            <div class="mt-2 font-semibold text-slate-900">邮箱密码</div>
          </div>
          <div class="rounded-[1.25rem] bg-slate-50 p-4">
            <div class="text-sm text-slate-500">首次登录</div>
            <div class="mt-2 font-semibold text-slate-900">邮箱验证码</div>
          </div>
          <div class="rounded-[1.25rem] bg-slate-50 p-4">
            <div class="text-sm text-slate-500">适用范围</div>
            <div class="mt-2 font-semibold text-slate-900">邀请用户</div>
          </div>
        </div>
      </div>
    </section>

    <section class="craft-card-solid rounded-[2rem] p-8">
      <div class="space-y-4">
        <div>
          <div class="section-title">登录</div>
          <p class="section-subtitle mt-1">请选择登录方式。</p>
        </div>

        <div class="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            class="rounded-lg px-3 py-2 text-sm font-semibold transition"
            :class="isPasswordMode ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            @click="switchMode('password')"
          >
            密码登录
          </button>
          <button
            class="rounded-lg px-3 py-2 text-sm font-semibold transition"
            :class="!isPasswordMode ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-900'"
            @click="switchMode('code')"
          >
            验证码登录
          </button>
        </div>

        <label class="block space-y-2">
          <span class="text-sm font-medium text-slate-600">邮箱</span>
          <input v-model="email" class="craft-input" type="email" maxlength="120" placeholder="you@example.com" />
        </label>

        <label v-if="isPasswordMode" class="block space-y-2">
          <span class="text-sm font-medium text-slate-600">密码</span>
          <input v-model="password" class="craft-input" type="password" maxlength="64" autocomplete="current-password" @keyup.enter="handleLogin" />
        </label>

        <label v-else class="block space-y-2">
          <span class="text-sm font-medium text-slate-600">验证码</span>
          <div class="flex gap-3">
            <input v-model="code" class="craft-input flex-1" maxlength="6" placeholder="6 位验证码" @keyup.enter="handleLogin" />
            <button class="craft-btn craft-btn-soft shrink-0" :disabled="!canSendCode" @click="handleSendCode">
              {{ sending ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码' }}
            </button>
          </div>
        </label>

        <button class="craft-btn craft-btn-primary w-full" :disabled="submitting" @click="handleLogin">
          {{ submitting ? '登录中...' : '进入系统' }}
        </button>

        <button v-if="isPasswordMode" class="w-full text-center text-sm font-semibold text-teal-700" @click="switchMode('code')">
          忘记密码？用邮箱验证码登录后重设
        </button>

        <div v-if="tip" class="rounded-[1.25rem] bg-slate-50 p-4 text-sm leading-7 text-slate-600">
          {{ tip }}
        </div>
      </div>
    </section>
  </div>
</template>

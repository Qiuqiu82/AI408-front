<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { getImportJob, getImportTemplate, importQuestions } from '../api/admin'
import { ApiError } from '../api/errors'

const templateUrl = ref('')
const templateVersion = ref('')
const file = ref(null)
const importType = ref('append')
const job = ref(null)
const loadingTemplate = ref(false)
const uploading = ref(false)
const polling = ref(null)
const message = ref('')

const canDownload = computed(() => Boolean(templateUrl.value))

async function loadTemplate() {
  loadingTemplate.value = true
  message.value = ''
  try {
    const result = await getImportTemplate()
    templateUrl.value = result.templateUrl
    templateVersion.value = result.version
  } catch (error) {
    message.value = error instanceof ApiError ? error.message : '模板加载失败'
  } finally {
    loadingTemplate.value = false
  }
}

function stopPolling() {
  if (polling.value) {
    clearInterval(polling.value)
    polling.value = null
  }
}

async function refreshJob(jobId) {
  const result = await getImportJob(jobId)
  job.value = result
  if (['success', 'failed'].includes(result.status)) {
    stopPolling()
  }
}

function startPolling(jobId) {
  stopPolling()
  polling.value = setInterval(() => {
    refreshJob(jobId).catch((error) => {
      message.value = error instanceof ApiError ? error.message : '查询任务失败'
    })
  }, 2000)
}

function onFileChange(event) {
  file.value = event.target.files?.[0] || null
}

async function submitImport() {
  if (!file.value) {
    message.value = '请选择文件'
    return
  }
  uploading.value = true
  message.value = ''
  try {
    const result = await importQuestions(file.value, importType.value)
    job.value = result
    startPolling(result.jobId)
    await refreshJob(result.jobId)
  } catch (error) {
    message.value = error instanceof ApiError ? error.message : '导入失败'
  } finally {
    uploading.value = false
  }
}

onBeforeUnmount(() => {
  stopPolling()
})

loadTemplate()
</script>

<template>
  <div class="space-y-8">
    <section class="craft-card-solid rounded-[2rem] p-8">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="section-title">题库导入</div>
          <p class="section-subtitle mt-1">管理员上传 Excel 或 CSV，后端异步导入并生成错误文件。</p>
        </div>
        <a v-if="canDownload" :href="templateUrl" class="craft-btn craft-btn-soft" target="_blank" rel="noreferrer">
          下载模板
        </a>
        <span v-else class="text-sm text-slate-400">{{ loadingTemplate ? '模板加载中...' : '模板不可用' }}</span>
      </div>

      <div class="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div class="space-y-4 rounded-[1.5rem] bg-slate-50 p-5">
          <label class="block space-y-2">
            <span class="text-sm font-medium text-slate-600">导入文件</span>
            <input type="file" class="block w-full text-sm text-slate-600" @change="onFileChange" />
          </label>

          <label class="block space-y-2">
            <span class="text-sm font-medium text-slate-600">导入方式</span>
            <select v-model="importType" class="craft-input">
              <option value="append">append</option>
              <option value="replace">replace</option>
            </select>
          </label>

          <button class="craft-btn craft-btn-primary w-full" :disabled="uploading" @click="submitImport">
            {{ uploading ? '导入中...' : '开始导入' }}
          </button>
        </div>

        <div class="space-y-4 rounded-[1.5rem] bg-slate-50 p-5">
          <div class="text-sm font-medium text-slate-500">任务状态</div>
          <div v-if="job" class="space-y-2 text-sm leading-7 text-slate-700">
            <div>jobId: {{ job.jobId }}</div>
            <div>status: {{ job.status }}</div>
            <div>total: {{ job.totalCount ?? 0 }} / success: {{ job.successCount ?? 0 }} / failed: {{ job.failedCount ?? 0 }}</div>
            <div>updatedAt: {{ job.updatedAt }}</div>
            <a v-if="job.errorFileUrl" :href="job.errorFileUrl" class="text-sky-600 underline" target="_blank" rel="noreferrer">
              下载错误文件
            </a>
          </div>
          <div v-else class="text-sm text-slate-400">暂无任务</div>
        </div>
      </div>

      <div v-if="message" class="mt-4 rounded-[1.25rem] bg-rose-50 p-4 text-sm leading-7 text-rose-600">
        {{ message }}
      </div>
      <div v-if="templateVersion" class="mt-4 text-xs text-slate-400">模板版本：{{ templateVersion }}</div>
    </section>
  </div>
</template>

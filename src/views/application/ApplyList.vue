<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useApplicationStore } from '@/stores/application'
import { useProductFormStore } from '@/stores/productForm'
import { APPLY_STATUS, APPLY_STATUS_META, DECISION } from '@/constants'
import DynamicForm from '@/components/DynamicForm.vue'

const auth = useAuthStore()
const appStore = useApplicationStore()
const formStore = useProductFormStore()

const statusFilter = ref('')
const myList = computed(() => {
  const list = appStore.byApplicant(auth.currentUserId)
  return statusFilter.value ? list.filter((a) => a.status === statusFilter.value) : list
})

const meta = (s) => APPLY_STATUS_META[s] || { label: s, type: 'info' }
const formOf = (a) => formStore.byId(a.productFormId)
function fieldLabel(form, key) {
  return form?.fields?.find((f) => f.key === key)?.label || key
}
function supFieldLabel(form, key) {
  return form?.supplementFields?.find((f) => f.key === key)?.label || key
}
const decisionText = (d) => (d === DECISION.AGREE ? '同意' : '驳回')

// 详情
const detailVisible = ref(false)
const current = ref(null)
function openDetail(row) {
  current.value = row
  detailVisible.value = true
}
function stepStatus(app, index) {
  if (app.status === APPLY_STATUS.REJECTED) {
    const rejected = app.records.find((r) => r.decision === DECISION.REJECT)
    if (rejected && rejected.step === index) return 'error'
  }
  if (index < app.currentStep) return 'success'
  if (index === app.currentStep && app.status !== APPLY_STATUS.APPROVED) return 'process'
  if (app.status === APPLY_STATUS.APPROVED) return 'success'
  return 'wait'
}

// 信息补充
const supVisible = ref(false)
const supModel = reactive({})
const supApp = ref(null)
const supFields = computed(() => formOf(supApp.value)?.supplementFields || [])
function openSupplement(row) {
  supApp.value = row
  Object.keys(supModel).forEach((k) => delete supModel[k])
  supFields.value.forEach((f) => (supModel[f.key] = f.type === 'number' ? null : ''))
  supVisible.value = true
}
function submitSupplement() {
  for (const f of supFields.value) {
    if (f.required && (supModel[f.key] === '' || supModel[f.key] == null)) return ElMessage.warning(`请填写「${f.label}」`)
  }
  appStore.submitSupplement(supApp.value.id, { ...supModel })
  ElMessage.success('信息补充完成，流程已继续')
  supVisible.value = false
}
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">签单申请列表</h2>
    <p class="page-desc">查看我发起的签单申请。状态为「审核中」时「去补充」不可点击；财务通过后变「待补充」，可点击补充信息。</p>

    <el-card shadow="never">
      <div class="toolbar">
        <el-radio-group v-model="statusFilter">
          <el-radio-button value="">全部</el-radio-button>
          <el-radio-button :value="APPLY_STATUS.PENDING_FINANCE">审核中</el-radio-button>
          <el-radio-button :value="APPLY_STATUS.PENDING_SUPPLEMENT">待补充</el-radio-button>
          <el-radio-button :value="APPLY_STATUS.PENDING_REVIEW">审核中(审核人)</el-radio-button>
          <el-radio-button :value="APPLY_STATUS.APPROVED">已通过</el-radio-button>
          <el-radio-button :value="APPLY_STATUS.REJECTED">已驳回</el-radio-button>
        </el-radio-group>
      </div>

      <el-table :data="myList" border>
        <el-table-column prop="code" label="单号" width="150" />
        <el-table-column prop="companyName" label="客户公司" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.companyName }}
            <el-tag v-if="row.isNewCustomer" size="small" type="success" effect="plain">新客户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="productType" label="产品类型" width="110" />
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">¥{{ row.amount.toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="状态" width="130">
          <template #default="{ row }">
            <el-tag :type="meta(row.status).type" effect="dark">{{ meta(row.status).label }}</el-tag>
            <div v-if="meta(row.status).sub" class="text-muted" style="font-size:12px">{{ meta(row.status).sub }}</div>
          </template>
        </el-table-column>
        <el-table-column label="当前节点" width="130">
          <template #default="{ row }">
            <span v-if="row.status === 'approved'" class="text-muted">已完成</span>
            <span v-else-if="row.status === 'rejected'" class="text-muted">已结束</span>
            <span v-else-if="row.status === 'pending_supplement'">等待补充信息</span>
            <span v-else>{{ row.flow[row.currentStep]?.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="提交时间" width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openDetail(row)">详情</el-button>
            <el-tooltip :disabled="row.status !== APPLY_STATUS.PENDING_FINANCE" content="财务通过后才能补充" placement="top">
              <span>
                <el-button
                  link
                  type="warning"
                  size="small"
                  :disabled="row.status !== APPLY_STATUS.PENDING_SUPPLEMENT"
                  @click="openSupplement(row)"
                >去补充</el-button>
              </span>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 详情 -->
    <el-dialog v-model="detailVisible" title="签单申请详情" width="680px">
      <template v-if="current">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="单号">{{ current.code }}</el-descriptions-item>
          <el-descriptions-item label="状态"><el-tag :type="meta(current.status).type" size="small">{{ meta(current.status).label }}</el-tag></el-descriptions-item>
          <el-descriptions-item label="客户公司">{{ current.companyName }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ current.amount.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="产品表单">{{ current.productFormName }}</el-descriptions-item>
          <el-descriptions-item label="提交人">{{ current.applicantName }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">申请信息</el-divider>
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item v-for="(v, k) in current.formData" :key="k" :label="fieldLabel(formOf(current), k)">{{ v || '-' }}</el-descriptions-item>
        </el-descriptions>

        <template v-if="current.supplemented">
          <el-divider content-position="left">补充信息</el-divider>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item v-for="(v, k) in current.supplementData" :key="k" :label="supFieldLabel(formOf(current), k)">{{ v || '-' }}</el-descriptions-item>
          </el-descriptions>
        </template>

        <el-divider content-position="left">审批进度</el-divider>
        <el-steps :active="current.currentStep" finish-status="success" align-center>
          <el-step v-for="(s, i) in current.flow" :key="i" :title="s.name" :status="stepStatus(current, i)" :description="s.kind === 'finance' ? '财务' : '审核人'" />
        </el-steps>

        <el-divider content-position="left">审批记录</el-divider>
        <el-empty v-if="!current.records.length" description="暂无审批记录" :image-size="60" />
        <el-timeline v-else>
          <el-timeline-item
            v-for="r in current.records"
            :key="r.id"
            :type="r.decision === 'agree' ? 'success' : 'danger'"
            :timestamp="r.time"
          >
            <b>{{ r.reviewerName }}</b>（{{ r.kind === 'finance' ? '财务' : '审核人' }}）
            <el-tag size="small" :type="r.decision === 'agree' ? 'success' : 'danger'">{{ decisionText(r.decision) }}</el-tag>
            <div v-if="r.comment" class="text-muted">意见：{{ r.comment }}</div>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-dialog>

    <!-- 信息补充 -->
    <el-dialog v-model="supVisible" title="信息补充" width="560px">
      <div class="flow-tip mb-16">财务已通过，请补充以下信息。补充完成后流程将进入「其他审核人」逐级审核。</div>
      <DynamicForm :fields="supFields" :model="supModel" />
      <template #footer>
        <el-button @click="supVisible = false">取消</el-button>
        <el-button type="primary" @click="submitSupplement">提交补充</el-button>
      </template>
    </el-dialog>
  </div>
</template>

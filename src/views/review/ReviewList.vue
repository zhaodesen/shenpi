<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useApplicationStore } from '@/stores/application'
import { useProductFormStore } from '@/stores/productForm'
import { APPLY_STATUS, APPLY_STATUS_META, DECISION } from '@/constants'

const auth = useAuthStore()
const appStore = useApplicationStore()
const formStore = useProductFormStore()

const tab = ref('pending')

const pending = computed(() => {
  const id = auth.currentUserId
  const fin = appStore.financePending(id).map((a) => ({ ...a, _role: 'finance' }))
  const rev = appStore.reviewerPending(id).map((a) => ({ ...a, _role: 'reviewer' }))
  return [...fin, ...rev].sort((a, b) => a.createTime.localeCompare(b.createTime))
})
const history = computed(() => appStore.reviewedByMe(auth.currentUserId))

const meta = (s) => APPLY_STATUS_META[s] || { label: s, type: 'info' }
const formOf = (a) => formStore.byId(a?.productFormId)
const fieldLabel = (form, key) => form?.fields?.find((f) => f.key === key)?.label || key
const supFieldLabel = (form, key) => form?.supplementFields?.find((f) => f.key === key)?.label || key
const decisionText = (d) => (d === DECISION.AGREE ? '同意' : '驳回')
const myRecord = (a) => a.records.find((r) => r.reviewerId === auth.currentUserId)

// 审核弹窗
const visible = ref(false)
const current = ref(null)
const decision = reactive({ value: DECISION.AGREE, comment: '' })
function openReview(row) {
  current.value = row
  decision.value = DECISION.AGREE
  decision.comment = ''
  visible.value = true
}
function submit() {
  const app = current.value
  const payload = { decision: decision.value, comment: decision.comment, reviewer: auth.currentUser }
  if (app.status === APPLY_STATUS.PENDING_FINANCE) {
    appStore.financeReview(app.id, payload)
    ElMessage.success(decision.value === DECISION.AGREE ? '已同意，申请变为「待补充」，等待申请人补充信息' : '已驳回')
  } else {
    appStore.reviewerReview(app.id, payload)
    const fresh = appStore.byId(app.id)
    if (decision.value === DECISION.REJECT) ElMessage.success('已驳回')
    else if (fresh.status === APPLY_STATUS.APPROVED) ElMessage.success('已同意，审核走完，已写入客户库')
    else ElMessage.success('已同意，流转至下一审核人')
  }
  visible.value = false
}
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">审核</h2>
    <p class="page-desc">第一审核人（财务）同意后申请变「待补充」；申请人补充完，其他审核人逐级审核；审核走完写入客户库。</p>

    <el-card shadow="never">
      <el-tabs v-model="tab">
        <el-tab-pane name="pending">
          <template #label>待我审核 <el-badge v-if="pending.length" :value="pending.length" type="danger" /></template>
          <el-table :data="pending" border>
            <el-table-column prop="code" label="单号" width="150" />
            <el-table-column prop="companyName" label="客户公司" min-width="180" show-overflow-tooltip />
            <el-table-column prop="productFormName" label="申请表单" min-width="160" show-overflow-tooltip />
            <el-table-column label="金额" width="120" align="right">
              <template #default="{ row }">¥{{ row.amount.toLocaleString() }}</template>
            </el-table-column>
            <el-table-column prop="applicantName" label="提交人" width="110" />
            <el-table-column label="我的角色" width="140">
              <template #default="{ row }">
                <el-tag :type="row._role === 'finance' ? 'warning' : 'primary'" effect="plain">
                  {{ row._role === 'finance' ? '财务·第一审核人' : `审核人(第${row.currentStep + 1}级)` }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createTime" label="提交时间" width="160" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="openReview(row)">审核</el-button>
              </template>
            </el-table-column>
            <template #empty><el-empty description="暂无待办" /></template>
          </el-table>
        </el-tab-pane>

        <el-tab-pane name="history" label="我已审核">
          <el-table :data="history" border>
            <el-table-column prop="code" label="单号" width="150" />
            <el-table-column prop="companyName" label="客户公司" min-width="180" show-overflow-tooltip />
            <el-table-column prop="applicantName" label="提交人" width="110" />
            <el-table-column label="我的决定" width="110">
              <template #default="{ row }">
                <el-tag :type="myRecord(row)?.decision === 'agree' ? 'success' : 'danger'" size="small">{{ decisionText(myRecord(row)?.decision) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="当前状态" width="120">
              <template #default="{ row }"><el-tag :type="meta(row.status).type" size="small">{{ meta(row.status).label }}</el-tag></template>
            </el-table-column>
            <el-table-column label="审核时间" width="170">
              <template #default="{ row }">{{ myRecord(row)?.time }}</template>
            </el-table-column>
            <template #empty><el-empty description="暂无记录" /></template>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 审核弹窗 -->
    <el-dialog v-model="visible" title="签单审核" width="680px">
      <template v-if="current">
        <el-descriptions :column="2" border size="small">
          <el-descriptions-item label="单号">{{ current.code }}</el-descriptions-item>
          <el-descriptions-item label="提交人">{{ current.applicantName }}</el-descriptions-item>
          <el-descriptions-item label="客户公司">{{ current.companyName }}<el-tag v-if="current.isNewCustomer" size="small" type="success" effect="plain" style="margin-left:4px">新客户</el-tag></el-descriptions-item>
          <el-descriptions-item label="金额">¥{{ current.amount.toLocaleString() }}</el-descriptions-item>
          <el-descriptions-item label="产品表单" :span="2">{{ current.productFormName }}</el-descriptions-item>
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

        <template v-if="current.records.length">
          <el-divider content-position="left">已有审批记录</el-divider>
          <el-timeline>
            <el-timeline-item v-for="r in current.records" :key="r.id" :type="r.decision === 'agree' ? 'success' : 'danger'" :timestamp="r.time">
              <b>{{ r.reviewerName }}</b>（{{ r.kind === 'finance' ? '财务' : '审核人' }}）
              <el-tag size="small" :type="r.decision === 'agree' ? 'success' : 'danger'">{{ decisionText(r.decision) }}</el-tag>
              <span v-if="r.comment" class="text-muted"> · {{ r.comment }}</span>
            </el-timeline-item>
          </el-timeline>
        </template>

        <el-divider content-position="left">审核意见</el-divider>
        <el-radio-group v-model="decision.value" class="mb-16">
          <el-radio-button :value="DECISION.AGREE">同意</el-radio-button>
          <el-radio-button :value="DECISION.REJECT">驳回</el-radio-button>
        </el-radio-group>
        <el-input v-model="decision.comment" type="textarea" :rows="3" placeholder="填写审核意见（选填）" />
        <div v-if="current.status === APPLY_STATUS.PENDING_FINANCE" class="flow-tip" style="margin-top:12px">
          财务同意后，申请将变为「待补充」，需申请人补充信息后流程才会流转到下一审核人。
        </div>
      </template>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button :type="decision.value === DECISION.AGREE ? 'primary' : 'danger'" @click="submit">提交审核</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { useProductFormStore } from '@/stores/productForm'
import { useCustomerStore } from '@/stores/customer'
import { useApplicationStore } from '@/stores/application'
import DynamicForm from '@/components/DynamicForm.vue'

const router = useRouter()
const auth = useAuthStore()
const formStore = useProductFormStore()
const customer = useCustomerStore()
const appStore = useApplicationStore()

const state = reactive({
  customerMode: 'exist', // exist | new
  companyId: null,
  companyName: '',
  productType: '',
  productFormId: null,
  amount: null,
})
const formData = reactive({})

const productTypes = computed(() => [...new Set(formStore.list.map((f) => f.productType))])

// 选择产品类型 → 默认自动匹配产品申请表单
watch(
  () => state.productType,
  (t) => {
    const matched = formStore.matchByType(t)
    state.productFormId = matched?.id || null
    resetFormData()
  },
)
watch(() => state.productFormId, resetFormData)

const currentForm = computed(() => formStore.byId(state.productFormId))

function resetFormData() {
  Object.keys(formData).forEach((k) => delete formData[k])
  ;(currentForm.value?.fields || []).forEach((f) => {
    formData[f.key] = f.type === 'number' ? null : ''
  })
}

function validate() {
  if (state.customerMode === 'exist' && !state.companyId) return '请选择已有公司'
  if (state.customerMode === 'new' && !state.companyName.trim()) return '请填写新客户公司名称'
  if (!state.productFormId) return '请选择产品类型 / 申请表单'
  if (!state.amount && state.amount !== 0) return '请填写签单金额'
  for (const f of currentForm.value.fields) {
    if (f.required && (formData[f.key] === '' || formData[f.key] == null)) return `请填写「${f.label}」`
  }
  return null
}

function submit() {
  const err = validate()
  if (err) return ElMessage.warning(err)

  // 公司：已有则用所选；新客户则登记
  let companyId = state.companyId
  let companyName = ''
  if (state.customerMode === 'exist') {
    companyName = customer.companyName(state.companyId)
  } else {
    const c = customer.ensureCompany({ companyName: state.companyName.trim(), isNew: true })
    companyId = c.id
    companyName = c.name
  }

  const form = currentForm.value
  const app = appStore.createApplication({
    companyId,
    companyName,
    isNewCustomer: state.customerMode === 'new',
    productFormId: form.id,
    productFormName: form.name,
    productType: form.productType,
    amount: state.amount,
    applicantId: auth.currentUserId,
    applicantName: auth.currentUser.name,
    formData: { ...formData },
    flow: form.approvalFlow,
  })
  ElMessage.success(`签单申请已提交：${app.code}`)
  router.push('/apply-list')
}
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">签单申请</h2>
    <p class="page-desc">若公司已存在则选择该公司，不存在则作为新客户填写；选择产品申请表单（默认按产品类型自动匹配）后提交。</p>

    <el-row :gutter="16">
      <el-col :span="15">
        <el-card shadow="never">
          <el-form label-width="110px">
            <el-divider content-position="left">① 客户公司</el-divider>
            <el-form-item label="客户类型">
              <el-radio-group v-model="state.customerMode">
                <el-radio-button value="exist">已有公司</el-radio-button>
                <el-radio-button value="new">新客户</el-radio-button>
              </el-radio-group>
            </el-form-item>
            <el-form-item v-if="state.customerMode === 'exist'" label="选择公司" required>
              <el-select v-model="state.companyId" filterable placeholder="搜索并选择已有公司" style="width:100%">
                <el-option v-for="c in customer.companies" :key="c.id" :label="c.name" :value="c.id" />
              </el-select>
            </el-form-item>
            <el-form-item v-else label="公司名称" required>
              <el-input v-model="state.companyName" placeholder="输入新客户公司全称" />
            </el-form-item>

            <el-divider content-position="left">② 产品申请表单</el-divider>
            <el-form-item label="产品类型" required>
              <el-select v-model="state.productType" placeholder="选择产品类型，自动匹配表单" style="width:100%">
                <el-option v-for="t in productTypes" :key="t" :label="t" :value="t" />
              </el-select>
            </el-form-item>
            <el-form-item label="申请表单" required>
              <el-select v-model="state.productFormId" placeholder="可手动调整匹配的表单" style="width:100%">
                <el-option v-for="f in formStore.list" :key="f.id" :label="`${f.name}（${f.productType}）`" :value="f.id" />
              </el-select>
              <div v-if="currentForm" class="text-muted" style="font-size:12px;margin-top:4px">
                已匹配：{{ currentForm.name }}
              </div>
            </el-form-item>
            <el-form-item label="签单金额(元)" required>
              <el-input-number v-model="state.amount" :min="0" :controls="false" style="width:100%" placeholder="请输入金额" />
            </el-form-item>

            <template v-if="currentForm">
              <el-divider content-position="left">③ 申请信息</el-divider>
              <DynamicForm :fields="currentForm.fields" :model="formData" />
            </template>

            <el-form-item>
              <el-button type="primary" :icon="'Promotion'" @click="submit">提交申请</el-button>
              <el-button @click="router.push('/apply-list')">查看我的申请</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="9">
        <el-card shadow="never" header="审批流预览">
          <template #header><b>审批流预览</b></template>
          <el-empty v-if="!currentForm" description="选择表单后显示审批流" :image-size="80" />
          <el-timeline v-else>
            <el-timeline-item
              v-for="(s, i) in currentForm.approvalFlow"
              :key="i"
              :type="s.kind === 'finance' ? 'warning' : 'primary'"
              :hollow="i !== 0"
            >
              <div><b>{{ s.name }}</b> <el-tag size="small" :type="s.kind === 'finance' ? 'warning' : 'info'" effect="plain">{{ s.kind === 'finance' ? '财务·第一审核人' : '审核人' }}</el-tag></div>
              <div v-if="s.kind === 'finance'" class="text-muted" style="font-size:12px">同意后申请变「待补充」，需申请人补充信息</div>
            </el-timeline-item>
          </el-timeline>
          <div class="flow-tip" style="margin-top:8px">
            提交后状态为「审核中」，<b>「去补充」不可点击</b>；财务通过后变「待补充」，可补充信息，流程继续。
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

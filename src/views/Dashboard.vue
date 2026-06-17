<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useApplicationStore } from '@/stores/application'
import { useCustomerStore } from '@/stores/customer'
import { PERMISSION_MAP } from '@/constants'

const router = useRouter()
const auth = useAuthStore()
const appStore = useApplicationStore()
const customer = useCustomerStore()

const uid = computed(() => auth.currentUserId)
const pendingReview = computed(
  () => appStore.financePending(uid.value).length + appStore.reviewerPending(uid.value).length,
)
const myApplies = computed(() => appStore.byApplicant(uid.value).length)
const myPendingSupplement = computed(
  () => appStore.byApplicant(uid.value).filter((a) => a.status === 'pending_supplement').length,
)
const customerCount = computed(() => new Set(customer.products.map((p) => p.companyId)).size)

const stats = computed(() => [
  { label: '待我审核', value: pendingReview.value, icon: 'Stamp', color: '#e6a23c', perm: 'review', to: '/review' },
  { label: '我发起的签单', value: myApplies.value, icon: 'Tickets', color: '#409eff', perm: 'applyList', to: '/apply-list' },
  { label: '待补充信息', value: myPendingSupplement.value, icon: 'EditPen', color: '#f56c6c', perm: 'applyList', to: '/apply-list' },
  { label: '客户库（公司）', value: customerCount.value, icon: 'OfficeBuilding', color: '#67c23a', perm: 'customer', to: '/customer' },
])
const visibleStats = computed(() => stats.value.filter((s) => auth.can(s.perm)))

const flowSteps = [
  { title: '签单申请', desc: '提交人选择公司/新客户、填写信息、选择产品申请表单（默认自动匹配）后提交', icon: 'EditPen' },
  { title: '财务审核', desc: '第一审核人（财务）审核；同意后申请状态变为「待补充」', icon: 'Money' },
  { title: '信息补充', desc: '财务通过后「去补充」可点击，提交人补充完信息流程继续', icon: 'DocumentAdd' },
  { title: '逐级审核', desc: '其他审核人按顺序逐级审核并生成审核记录', icon: 'Stamp' },
  { title: '进入客户库', desc: '审核走完后客户与产品进入客户库，按可见性规则展示', icon: 'OfficeBuilding' },
]

const myPerms = computed(() => auth.permissions.map((k) => PERMISSION_MAP[k]?.name).filter(Boolean))
</script>

<template>
  <div class="page-container">
    <el-card class="page-card" shadow="never">
      <div class="welcome">
        <el-avatar :size="52" style="background:#409eff;font-size:22px">{{ auth.currentUser?.name?.[0] }}</el-avatar>
        <div>
          <div class="hello">你好，{{ auth.currentUser?.name }} 👋</div>
          <div class="text-muted">
            当前角色：
            <el-tag v-for="r in auth.roleNames" :key="r" size="small" effect="plain" style="margin-right:4px">{{ r }}</el-tag>
            <span style="margin-left:8px">可用功能：{{ myPerms.join(' / ') }}</span>
          </div>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16" class="mb-16">
      <el-col v-for="s in visibleStats" :key="s.label" :span="6">
        <el-card shadow="hover" class="stat-card" @click="router.push(s.to)">
          <div class="stat-icon" :style="{ background: s.color }">
            <el-icon :size="22"><component :is="s.icon" /></el-icon>
          </div>
          <div>
            <div class="stat-value">{{ s.value }}</div>
            <div class="text-muted">{{ s.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="page-card" shadow="never">
      <template #header><b>签单审批流程</b></template>
      <el-steps :active="5" align-center finish-status="success">
        <el-step v-for="s in flowSteps" :key="s.title" :title="s.title" :description="s.desc">
          <template #icon><el-icon><component :is="s.icon" /></el-icon></template>
        </el-step>
      </el-steps>
    </el-card>

    <el-card class="page-card" shadow="never">
      <template #header><b>关键规则说明</b></template>
      <div class="flow-tip">
        1. <b>进入下一审核人需同时满足两个条件</b>：① 财务（第一审核人）同意；② 申请人完成信息补充。<br />
        2. <b>「去补充」按钮</b>：提交后状态为「审核中」时不可点击；财务通过后状态变为「待补充」，按钮可点击。<br />
        3. <b>客户库可见性</b>：审核人只看「经我审核」客户的产品；提交人只看「我签的」客户的产品；上级可查看下级签单/维护/经办的相关产品。
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.welcome {
  display: flex;
  align-items: center;
  gap: 16px;
}
.hello {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}
.stat-card {
  cursor: pointer;
}
.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 14px;
}
.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  line-height: 1;
}
</style>

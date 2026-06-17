<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCustomerStore } from '@/stores/customer'
import { usePersonnelStore } from '@/stores/personnel'

const auth = useAuthStore()
const customer = useCustomerStore()
const personnel = usePersonnelStore()

// 管理员（拥有权限配置）可见全部
const isAdmin = computed(() => auth.can('org'))
const me = computed(() => auth.currentUserId)

function relatedIds(p) {
  return [p.applicantId, p.financeId, ...(p.reviewerIds || [])].filter(Boolean)
}
function visibleToMe(p) {
  if (isAdmin.value) return true
  const related = relatedIds(p)
  // 我签的 / 经我审核的
  if (related.includes(me.value)) return true
  // 上级可见下级（签单/维护/经办）
  if (related.some((uid) => personnel.isAncestor(me.value, uid))) return true
  return false
}

const visibleProducts = computed(() => customer.products.filter(visibleToMe))

const companies = computed(() => {
  const map = new Map()
  for (const p of visibleProducts.value) {
    if (!map.has(p.companyId)) {
      map.set(p.companyId, { companyId: p.companyId, companyName: p.companyName, products: [], total: 0 })
    }
    const c = map.get(p.companyId)
    c.products.push(p)
    c.total += p.amount
  }
  return [...map.values()]
})

const reviewerNames = (p) => (p.reviewerIds || []).map((id) => personnel.name(id)).join('、') || '-'
const minedByMe = (p) => relatedIds(p).includes(me.value)
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">客户库</h2>
    <p class="page-desc">审核走完后的签单形成客户-产品记录，并按可见性规则展示。</p>

    <el-alert :closable="false" type="info" show-icon class="mb-16">
      <template #title>
        <span v-if="isAdmin">管理员视角：可见<b>全部</b>客户与产品。</span>
        <span v-else>
          当前为「<b>{{ auth.currentUser?.name }}</b>」视角：只显示<b>我签单 / 经我审核</b>的客户产品；作为上级还可见<b>下级</b>签单/维护/经办的产品。
        </span>
      </template>
    </el-alert>

    <el-row :gutter="16" class="mb-16">
      <el-col :span="8"><el-statistic title="可见客户数" :value="companies.length" /></el-col>
      <el-col :span="8"><el-statistic title="可见产品记录" :value="visibleProducts.length" /></el-col>
      <el-col :span="8"><el-statistic title="可见签单总额(元)" :value="visibleProducts.reduce((s, p) => s + p.amount, 0)" /></el-col>
    </el-row>

    <el-card shadow="never">
      <el-table :data="companies" border>
        <el-table-column type="expand">
          <template #default="{ row }">
            <el-table :data="row.products" size="small" style="margin:8px 16px">
              <el-table-column prop="applicationCode" label="单号" width="150" />
              <el-table-column prop="productFormName" label="产品表单" min-width="160" />
              <el-table-column prop="productType" label="类型" width="110" />
              <el-table-column label="金额" width="120" align="right">
                <template #default="{ row: p }">¥{{ p.amount.toLocaleString() }}</template>
              </el-table-column>
              <el-table-column prop="applicantName" label="签单人" width="110" />
              <el-table-column label="经手审核人" min-width="160">
                <template #default="{ row: p }">{{ reviewerNames(p) }}</template>
              </el-table-column>
              <el-table-column label="可见原因" width="120">
                <template #default="{ row: p }">
                  <el-tag v-if="minedByMe(p)" size="small" type="success">本人相关</el-tag>
                  <el-tag v-else size="small" type="info">下级相关</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="approvedTime" label="入库时间" width="170" />
            </el-table>
          </template>
        </el-table-column>
        <el-table-column label="客户公司" min-width="220">
          <template #default="{ row }">
            <el-icon><OfficeBuilding /></el-icon>
            <b style="margin-left:6px">{{ row.companyName }}</b>
          </template>
        </el-table-column>
        <el-table-column label="产品记录数" width="120" align="center">
          <template #default="{ row }">{{ row.products.length }}</template>
        </el-table-column>
        <el-table-column label="累计签单额" width="160" align="right">
          <template #default="{ row }">¥{{ row.total.toLocaleString() }}</template>
        </el-table-column>
        <template #empty>
          <el-empty description="暂无可见客户。完成一笔签单审批后，客户将进入此处" />
        </template>
      </el-table>
    </el-card>
  </div>
</template>

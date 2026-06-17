<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProductFormStore } from '@/stores/productForm'
import { usePersonnelStore } from '@/stores/personnel'
import { FIELD_TYPES } from '@/constants'
import FieldRows from '@/components/FieldRows.vue'

const formStore = useProductFormStore()
const personnel = usePersonnelStore()

const drawer = ref(false)
const editingId = ref(null)
const model = reactive({
  name: '', productType: '', desc: '',
  fields: [], supplementFields: [], approvalFlow: [],
})

const financeUsers = computed(() => personnel.financeUsers)
const reviewerUsers = computed(() => personnel.activeList)

function blankFlow() {
  const f = financeUsers.value[0]
  return [{ order: 1, kind: 'finance', userId: f?.id || null, name: f?.name || '' }]
}

function openAdd() {
  editingId.value = null
  Object.assign(model, {
    name: '', productType: '', desc: '',
    fields: [], supplementFields: [], approvalFlow: blankFlow(),
  })
  drawer.value = true
}
function openEdit(row) {
  editingId.value = row.id
  const copy = JSON.parse(JSON.stringify(row))
  Object.assign(model, {
    name: copy.name, productType: copy.productType, desc: copy.desc,
    fields: copy.fields || [], supplementFields: copy.supplementFields || [],
    approvalFlow: copy.approvalFlow?.length ? copy.approvalFlow : blankFlow(),
  })
  drawer.value = true
}

function addField(list) {
  list.push({ key: '', label: '', type: 'text', required: false, options: [] })
}
function removeField(list, i) {
  list.splice(i, 1)
}

function addReviewer() {
  const u = reviewerUsers.value[0]
  model.approvalFlow.push({ order: model.approvalFlow.length + 1, kind: 'reviewer', userId: u?.id || null, name: u?.name || '' })
}
function removeStep(i) {
  if (model.approvalFlow[i].kind === 'finance') return
  model.approvalFlow.splice(i, 1)
}
function moveStep(i, dir) {
  const j = i + dir
  if (j < 1 || j >= model.approvalFlow.length) return // 第 1 个（财务）固定
  const arr = model.approvalFlow
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
}
function userName(id) {
  return personnel.name(id)
}

function save() {
  if (!model.name.trim()) return ElMessage.warning('请填写表单名称')
  if (!model.productType.trim()) return ElMessage.warning('请填写产品类型（用于签单自动匹配）')
  if (model.fields.some((f) => !f.key || !f.label)) return ElMessage.warning('申请字段的字段名/标题不能为空')
  if (!model.approvalFlow[0]?.userId) return ElMessage.warning('请指定第一审核人（财务）')

  // 规范化审批流：重排 order，回填姓名
  const flow = model.approvalFlow.map((s, idx) => ({
    order: idx + 1,
    kind: idx === 0 ? 'finance' : 'reviewer',
    userId: s.userId,
    name: userName(s.userId),
  }))

  const payload = {
    name: model.name.trim(),
    productType: model.productType.trim(),
    desc: model.desc,
    fields: JSON.parse(JSON.stringify(model.fields)),
    supplementFields: JSON.parse(JSON.stringify(model.supplementFields)),
    approvalFlow: flow,
  }
  if (editingId.value) {
    formStore.updateForm(editingId.value, payload)
    ElMessage.success('已保存')
  } else {
    formStore.addForm(payload)
    ElMessage.success('已新增产品申请表单')
  }
  drawer.value = false
}

function remove(row) {
  ElMessageBox.confirm(`确定删除表单「${row.name}」？`, '提示', { type: 'warning' })
    .then(() => {
      formStore.removeForm(row.id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
const typeLabel = (t) => FIELD_TYPES.find((x) => x.value === t)?.label || t
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">产品申请表单</h2>
    <p class="page-desc">配置产品申请表单：申请字段、补充字段，以及审批流（第一审核人固定为财务）。</p>

    <el-card shadow="never">
      <div class="toolbar">
        <span class="text-muted">共 {{ formStore.list.length }} 个表单</span>
        <el-button type="primary" :icon="'Plus'" @click="openAdd">新增表单</el-button>
      </div>
      <el-table :data="formStore.list" border>
        <el-table-column prop="name" label="表单名称" min-width="180" />
        <el-table-column prop="productType" label="产品类型" width="130">
          <template #default="{ row }"><el-tag effect="plain">{{ row.productType }}</el-tag></template>
        </el-table-column>
        <el-table-column label="申请字段" width="100" align="center">
          <template #default="{ row }">{{ row.fields.length }} 项</template>
        </el-table-column>
        <el-table-column label="补充字段" width="100" align="center">
          <template #default="{ row }">{{ row.supplementFields.length }} 项</template>
        </el-table-column>
        <el-table-column label="审批流" min-width="240">
          <template #default="{ row }">
            <el-tag v-for="(s, i) in row.approvalFlow" :key="i" :type="s.kind === 'finance' ? 'warning' : 'info'" size="small" effect="plain" style="margin:2px">
              {{ i + 1 }}.{{ s.name }}{{ s.kind === 'finance' ? '(财务)' : '' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="drawer" :title="editingId ? '编辑产品申请表单' : '新增产品申请表单'" size="760px">
      <el-form label-width="92px">
        <el-divider content-position="left">基本信息</el-divider>
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="表单名称" required><el-input v-model="model.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="产品类型" required><el-input v-model="model.productType" placeholder="用于签单自动匹配" /></el-form-item></el-col>
        </el-row>
        <el-form-item label="说明"><el-input v-model="model.desc" type="textarea" :rows="2" /></el-form-item>

        <el-divider content-position="left">申请字段（提交人填写）</el-divider>
        <FieldRows :list="model.fields" @add="addField(model.fields)" @remove="(i) => removeField(model.fields, i)" />

        <el-divider content-position="left">补充字段（财务通过后补充）</el-divider>
        <FieldRows :list="model.supplementFields" @add="addField(model.supplementFields)" @remove="(i) => removeField(model.supplementFields, i)" />

        <el-divider content-position="left">审批流</el-divider>
        <div class="flow-tip mb-16">第 1 个节点固定为<b>财务（第一审核人）</b>；其后为其他审核人，按顺序逐级审核。</div>
        <div v-for="(s, i) in model.approvalFlow" :key="i" class="flow-row">
          <el-tag :type="s.kind === 'finance' ? 'warning' : 'info'" effect="dark">{{ i + 1 }}</el-tag>
          <span class="flow-kind">{{ s.kind === 'finance' ? '财务' : '审核人' }}</span>
          <el-select v-if="s.kind === 'finance'" v-model="s.userId" style="width:220px" placeholder="选择财务">
            <el-option v-for="u in financeUsers" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
          <el-select v-else v-model="s.userId" style="width:220px" placeholder="选择审核人">
            <el-option v-for="u in reviewerUsers" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
          <span class="flow-ops">
            <el-button v-if="s.kind !== 'finance'" link size="small" :icon="'Top'" @click="moveStep(i, -1)" />
            <el-button v-if="s.kind !== 'finance'" link size="small" :icon="'Bottom'" @click="moveStep(i, 1)" />
            <el-button v-if="s.kind !== 'finance'" link type="danger" size="small" :icon="'Delete'" @click="removeStep(i)" />
          </span>
        </div>
        <el-button class="mb-16" :icon="'Plus'" @click="addReviewer">添加审核人</el-button>
      </el-form>

      <template #footer>
        <el-button @click="drawer = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.flow-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}
.flow-kind {
  width: 56px;
  color: #606266;
}
.flow-ops {
  margin-left: 8px;
}
</style>

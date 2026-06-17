<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePersonnelStore } from '@/stores/personnel'
import { useOrgStore } from '@/stores/org'

const personnel = usePersonnelStore()
const org = useOrgStore()

const keyword = ref('')
const filtered = computed(() =>
  personnel.list.filter((u) => !keyword.value || u.name.includes(keyword.value) || u.account.includes(keyword.value)),
)

const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({
  name: '', account: '', deptId: 'd1', groupId: null, roleIds: [], supervisorId: null, isFinance: false,
})

const groupOptions = computed(() => org.groupsByDept(form.deptId))
const supervisorOptions = computed(() => personnel.list.filter((u) => u.id !== editingId.value))

function openAdd() {
  editingId.value = null
  Object.assign(form, { name: '', account: '', deptId: 'd1', groupId: null, roleIds: [], supervisorId: null, isFinance: false })
  dialogVisible.value = true
}
function openEdit(row) {
  editingId.value = row.id
  Object.assign(form, {
    name: row.name, account: row.account, deptId: row.deptId, groupId: row.groupId,
    roleIds: [...row.roleIds], supervisorId: row.supervisorId, isFinance: row.isFinance,
  })
  dialogVisible.value = true
}
function save() {
  if (!form.name.trim() || !form.account.trim()) return ElMessage.warning('请填写姓名与账号')
  if (editingId.value) {
    personnel.updatePerson(editingId.value, { ...form })
    ElMessage.success('已保存')
  } else {
    personnel.addPerson({ ...form })
    ElMessage.success('已新增人员')
  }
  dialogVisible.value = false
}
function toggleStatus(row) {
  personnel.toggleStatus(row.id)
}
function remove(row) {
  ElMessageBox.confirm(`确定删除人员「${row.name}」？`, '提示', { type: 'warning' })
    .then(() => {
      personnel.removePerson(row.id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">人员管理</h2>
    <p class="page-desc">配置人员所属部门 / 组、角色权限、上级关系，以及是否为财务（第一审核人）。</p>

    <el-card shadow="never">
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索姓名 / 账号" :prefix-icon="'Search'" style="width:240px" clearable />
        <el-button type="primary" :icon="'Plus'" @click="openAdd">新增人员</el-button>
      </div>

      <el-table :data="filtered" border>
        <el-table-column type="index" label="#" width="50" />
        <el-table-column prop="name" label="姓名" width="140" />
        <el-table-column prop="account" label="账号" width="120" />
        <el-table-column label="部门 / 组" width="180">
          <template #default="{ row }">
            {{ org.deptName(row.deptId) }}
            <span v-if="row.groupId" class="text-muted"> / {{ org.groups.find((g) => g.id === row.groupId)?.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="角色" min-width="160">
          <template #default="{ row }">
            <el-tag v-for="rid in row.roleIds" :key="rid" size="small" effect="plain" style="margin:2px">{{ org.roleName(rid) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="上级" width="140">
          <template #default="{ row }">{{ row.supervisorId ? personnel.name(row.supervisorId) : '-' }}</template>
        </el-table-column>
        <el-table-column label="财务" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.isFinance" type="warning" size="small">财务</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small">{{ row.status === 'active' ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link size="small" @click="toggleStatus(row)">{{ row.status === 'active' ? '停用' : '启用' }}</el-button>
            <el-button link type="danger" size="small" @click="remove(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑人员' : '新增人员'" width="560px">
      <el-form label-width="100px">
        <el-row :gutter="12">
          <el-col :span="12"><el-form-item label="姓名" required><el-input v-model="form.name" /></el-form-item></el-col>
          <el-col :span="12"><el-form-item label="账号" required><el-input v-model="form.account" /></el-form-item></el-col>
        </el-row>
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="部门">
              <el-select v-model="form.deptId" style="width:100%" @change="form.groupId = null">
                <el-option v-for="d in org.departments" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="组">
              <el-select v-model="form.groupId" clearable placeholder="可选" style="width:100%">
                <el-option v-for="g in groupOptions" :key="g.id" :label="g.name" :value="g.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="角色权限">
          <el-select v-model="form.roleIds" multiple placeholder="选择角色" style="width:100%">
            <el-option v-for="r in org.roles" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="直属上级">
          <el-select v-model="form.supervisorId" clearable placeholder="可选，用于客户库上下级可见" style="width:100%">
            <el-option v-for="u in supervisorOptions" :key="u.id" :label="u.name" :value="u.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="财务标识">
          <el-switch v-model="form.isFinance" active-text="是财务（第一审核人）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

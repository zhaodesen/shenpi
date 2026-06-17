<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useOrgStore } from '@/stores/org'
import { PERMISSIONS } from '@/constants'

const org = useOrgStore()

// ===== 组织架构 + 组（树）=====
const treeProps = { children: 'children', label: 'name' }
const treeData = computed(() => {
  const build = (parentId) =>
    org.departments
      .filter((d) => d.parentId === parentId)
      .map((d) => ({
        id: d.id,
        name: d.name,
        type: 'dept',
        children: [
          ...build(d.id),
          ...org.groupsByDept(d.id).map((g) => ({ id: g.id, name: g.name, type: 'group', children: [] })),
        ],
      }))
  return build(null)
})

function addSubDept(node) {
  ElMessageBox.prompt('请输入子部门名称', '新增子部门', { inputPattern: /\S/, inputErrorMessage: '名称不能为空' })
    .then(({ value }) => {
      org.addDepartment(value.trim(), node.id)
      ElMessage.success('已新增子部门')
    })
    .catch(() => {})
}
function addRootDept() {
  ElMessageBox.prompt('请输入部门名称', '新增一级部门', { inputPattern: /\S/, inputErrorMessage: '名称不能为空' })
    .then(({ value }) => {
      org.addDepartment(value.trim(), null)
      ElMessage.success('已新增部门')
    })
    .catch(() => {})
}
function addGroup(node) {
  ElMessageBox.prompt(`在「${node.name}」下新增组`, '新增组', { inputPattern: /\S/, inputErrorMessage: '名称不能为空' })
    .then(({ value }) => {
      org.addGroup(value.trim(), node.id)
      ElMessage.success('已新增组')
    })
    .catch(() => {})
}
function renameDept(node) {
  ElMessageBox.prompt('请输入新名称', '重命名', { inputValue: node.name, inputPattern: /\S/ })
    .then(({ value }) => org.updateDepartment(node.id, value.trim()))
    .catch(() => {})
}
function removeNode(node) {
  ElMessageBox.confirm(`确定删除「${node.name}」？`, '提示', { type: 'warning' })
    .then(() => {
      try {
        if (node.type === 'dept') org.removeDepartment(node.id)
        else org.removeGroup(node.id)
        ElMessage.success('已删除')
      } catch (e) {
        ElMessage.error(e.message)
      }
    })
    .catch(() => {})
}

// ===== 角色与权限 =====
const dialogVisible = ref(false)
const editingId = ref(null)
const form = reactive({ name: '', desc: '', permissions: [] })

function openAdd() {
  editingId.value = null
  Object.assign(form, { name: '', desc: '', permissions: [] })
  dialogVisible.value = true
}
function openEdit(role) {
  editingId.value = role.id
  Object.assign(form, { name: role.name, desc: role.desc, permissions: [...role.permissions] })
  dialogVisible.value = true
}
function saveRole() {
  if (!form.name.trim()) return ElMessage.warning('请填写角色名称')
  if (editingId.value) {
    org.updateRole(editingId.value, { ...form })
    ElMessage.success('已保存')
  } else {
    org.addRole({ ...form })
    ElMessage.success('已新增角色')
  }
  dialogVisible.value = false
}
function removeRole(role) {
  ElMessageBox.confirm(`确定删除角色「${role.name}」？`, '提示', { type: 'warning' })
    .then(() => {
      org.removeRole(role.id)
      ElMessage.success('已删除')
    })
    .catch(() => {})
}
const permName = (key) => PERMISSIONS.find((p) => p.key === key)?.name || key
</script>

<template>
  <div class="page-container">
    <h2 class="page-title">权限配置</h2>
    <p class="page-desc">配置组织架构、组、角色基础权限（功能权限点）。</p>

    <el-row :gutter="16">
      <el-col :span="10">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span><el-icon><Setting /></el-icon> 组织架构 / 组</span>
              <el-button type="primary" size="small" :icon="'Plus'" @click="addRootDept">一级部门</el-button>
            </div>
          </template>
          <el-tree :data="treeData" :props="treeProps" node-key="id" default-expand-all :expand-on-click-node="false">
            <template #default="{ node, data }">
              <span class="tree-node">
                <span>
                  <el-icon v-if="data.type === 'dept'"><Folder /></el-icon>
                  <el-icon v-else color="#67c23a"><UserFilled /></el-icon>
                  <span style="margin-left:6px">{{ data.name }}</span>
                  <el-tag v-if="data.type === 'group'" size="small" type="success" effect="plain" style="margin-left:6px">组</el-tag>
                </span>
                <span class="tree-actions">
                  <template v-if="data.type === 'dept'">
                    <el-button link type="primary" size="small" @click.stop="addSubDept(data)">子部门</el-button>
                    <el-button link type="success" size="small" @click.stop="addGroup(data)">加组</el-button>
                    <el-button link size="small" @click.stop="renameDept(data)">改名</el-button>
                  </template>
                  <el-button link type="danger" size="small" @click.stop="removeNode(data)">删除</el-button>
                </span>
              </span>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card shadow="never">
          <template #header>
            <div class="card-header">
              <span><el-icon><Avatar /></el-icon> 角色与基础权限</span>
              <el-button type="primary" size="small" :icon="'Plus'" @click="openAdd">新增角色</el-button>
            </div>
          </template>
          <el-table :data="org.roles" border>
            <el-table-column prop="name" label="角色名称" width="160" />
            <el-table-column prop="desc" label="说明" show-overflow-tooltip />
            <el-table-column label="功能权限" min-width="220">
              <template #default="{ row }">
                <el-tag v-for="p in row.permissions" :key="p" size="small" effect="plain" style="margin:2px">{{ permName(p) }}</el-tag>
                <span v-if="!row.permissions.length" class="text-muted">无</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="removeRole(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑角色' : '新增角色'" width="520px">
      <el-form label-width="90px">
        <el-form-item label="角色名称" required>
          <el-input v-model="form.name" placeholder="如：销售主管" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="form.desc" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="功能权限">
          <el-checkbox-group v-model="form.permissions">
            <el-checkbox v-for="p in PERMISSIONS" :key="p.key" :value="p.key" border style="margin:4px 8px 4px 0">{{ p.name }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRole">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}
.tree-actions {
  opacity: 0;
  transition: opacity 0.15s;
}
.tree-node:hover .tree-actions {
  opacity: 1;
}
</style>

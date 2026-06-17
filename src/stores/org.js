import { defineStore } from 'pinia'
import { seedDepartments, seedGroups, seedRoles } from '@/mock/seed'

let _id = Date.now()
const uid = (p) => `${p}_${(_id++).toString(36)}`

// 权限配置：组织架构（部门树）、组、角色基础权限
export const useOrgStore = defineStore('org', {
  state: () => ({
    departments: seedDepartments(),
    groups: seedGroups(),
    roles: seedRoles(),
  }),
  getters: {
    // 部门树
    departmentTree(state) {
      const map = {}
      state.departments.forEach((d) => (map[d.id] = { ...d, children: [] }))
      const roots = []
      state.departments.forEach((d) => {
        if (d.parentId && map[d.parentId]) map[d.parentId].children.push(map[d.id])
        else roots.push(map[d.id])
      })
      return roots
    },
    deptName: (state) => (id) => state.departments.find((d) => d.id === id)?.name || '-',
    groupsByDept: (state) => (deptId) => state.groups.filter((g) => g.deptId === deptId),
    roleName: (state) => (id) => state.roles.find((r) => r.id === id)?.name || '-',
  },
  actions: {
    // 部门
    addDepartment(name, parentId = null) {
      this.departments.push({ id: uid('d'), name, parentId })
    },
    updateDepartment(id, name) {
      const d = this.departments.find((x) => x.id === id)
      if (d) d.name = name
    },
    removeDepartment(id) {
      const hasChild = this.departments.some((d) => d.parentId === id)
      if (hasChild) throw new Error('请先删除子部门')
      this.departments = this.departments.filter((d) => d.id !== id)
      this.groups = this.groups.filter((g) => g.deptId !== id)
    },
    // 组
    addGroup(name, deptId) {
      this.groups.push({ id: uid('g'), name, deptId })
    },
    removeGroup(id) {
      this.groups = this.groups.filter((g) => g.id !== id)
    },
    // 角色
    addRole(role) {
      this.roles.push({ id: uid('r'), permissions: [], ...role })
    },
    updateRole(id, patch) {
      const r = this.roles.find((x) => x.id === id)
      if (r) Object.assign(r, patch)
    },
    removeRole(id) {
      this.roles = this.roles.filter((r) => r.id !== id)
    },
  },
})

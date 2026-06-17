import { defineStore } from 'pinia'
import { seedPersonnel } from '@/mock/seed'

let _id = Date.now()
const uid = () => `u_${(_id++).toString(36)}`

// 人员管理：配置人员的部门/组/角色权限
export const usePersonnelStore = defineStore('personnel', {
  state: () => ({
    list: seedPersonnel(),
  }),
  getters: {
    activeList: (state) => state.list.filter((u) => u.status === 'active'),
    byId: (state) => (id) => state.list.find((u) => u.id === id),
    name: (state) => (id) => state.list.find((u) => u.id === id)?.name || '-',
    // 财务人员（第一审核人候选）
    financeUsers: (state) => state.list.filter((u) => u.isFinance),
    // 直接下属
    subordinates: (state) => (id) => state.list.filter((u) => u.supervisorId === id),
  },
  actions: {
    addPerson(person) {
      this.list.push({
        id: uid(),
        groupId: null,
        roleIds: [],
        supervisorId: null,
        isFinance: false,
        status: 'active',
        ...person,
      })
    },
    updatePerson(id, patch) {
      const u = this.list.find((x) => x.id === id)
      if (u) Object.assign(u, patch)
    },
    toggleStatus(id) {
      const u = this.list.find((x) => x.id === id)
      if (u) u.status = u.status === 'active' ? 'disabled' : 'active'
    },
    removePerson(id) {
      this.list = this.list.filter((u) => u.id !== id)
    },
    // 计算某人是否为另一人的上级（含多级）
    isAncestor(ancestorId, userId) {
      let cur = this.byId(userId)
      const guard = new Set()
      while (cur && cur.supervisorId && !guard.has(cur.id)) {
        guard.add(cur.id)
        if (cur.supervisorId === ancestorId) return true
        cur = this.byId(cur.supervisorId)
      }
      return false
    },
  },
})

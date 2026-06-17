import { defineStore } from 'pinia'
import { usePersonnelStore } from './personnel'
import { useOrgStore } from './org'

// 当前登录态。演示版支持「切换身份」以体验完整审批链路
export const useAuthStore = defineStore('auth', {
  state: () => ({
    currentUserId: 'u_admin',
  }),
  getters: {
    currentUser() {
      return usePersonnelStore().byId(this.currentUserId) || null
    },
    // 当前用户拥有的功能权限点（多角色取并集）
    permissions() {
      const org = useOrgStore()
      const user = this.currentUser
      if (!user) return []
      const set = new Set()
      ;(user.roleIds || []).forEach((rid) => {
        const role = org.roles.find((r) => r.id === rid)
        ;(role?.permissions || []).forEach((p) => set.add(p))
      })
      return [...set]
    },
    roleNames() {
      const org = useOrgStore()
      const user = this.currentUser
      if (!user) return []
      return (user.roleIds || []).map((rid) => org.roles.find((r) => r.id === rid)?.name).filter(Boolean)
    },
  },
  actions: {
    can(permKey) {
      return this.permissions.includes(permKey)
    },
    switchUser(userId) {
      this.currentUserId = userId
    },
  },
})

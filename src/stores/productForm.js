import { defineStore } from 'pinia'
import { seedProductForms } from '@/mock/seed'

let _id = Date.now()
const uid = () => `pf_${(_id++).toString(36)}`

// 产品申请表单模块：配置产品申请表单（字段 + 补充字段 + 审批流）
export const useProductFormStore = defineStore('productForm', {
  state: () => ({
    list: seedProductForms(),
  }),
  getters: {
    byId: (state) => (id) => state.list.find((f) => f.id === id),
    name: (state) => (id) => state.list.find((f) => f.id === id)?.name || '-',
    // 根据产品类型自动匹配表单（签单申请默认自动匹配）
    matchByType: (state) => (productType) =>
      state.list.find((f) => f.productType === productType) || null,
  },
  actions: {
    addForm(form) {
      this.list.push({
        id: uid(),
        fields: [],
        supplementFields: [],
        approvalFlow: [],
        ...form,
      })
    },
    updateForm(id, patch) {
      const f = this.list.find((x) => x.id === id)
      if (f) Object.assign(f, patch)
    },
    removeForm(id) {
      this.list = this.list.filter((f) => f.id !== id)
    },
  },
})

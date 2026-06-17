import { defineStore } from 'pinia'
import { seedCompanies } from '@/mock/seed'
import { DECISION, STEP_KIND } from '@/constants'

let _id = Date.now()
const uid = (p) => `${p}_${(_id++).toString(36)}`

// 客户库：审核通过的签单形成「客户-产品」记录，并按可见性规则展示
export const useCustomerStore = defineStore('customer', {
  state: () => ({
    companies: seedCompanies(), // 公司主数据
    products: [], // 客户产品记录（审核通过后写入）
  }),
  getters: {
    companyName: (state) => (id) => state.companies.find((c) => c.id === id)?.name || '-',
    findCompanyByName: (state) => (name) => state.companies.find((c) => c.name === name),
  },
  actions: {
    // 签单申请中：若公司不存在则登记为新客户
    ensureCompany({ companyId, companyName, isNew }) {
      if (companyId) {
        const exist = this.companies.find((c) => c.id === companyId)
        if (exist) return exist
      }
      const byName = this.companies.find((c) => c.name === companyName)
      if (byName) return byName
      const c = { id: uid('c'), name: companyName, isNew: !!isNew }
      this.companies.push(c)
      return c
    },

    // 审核走完后写入客户库
    addApprovedProduct(app) {
      const company = this.ensureCompany({
        companyId: app.companyId,
        companyName: app.companyName,
        isNew: app.isNewCustomer,
      })
      // 同意过该单的审核人（经我审核 → 客户库可见）
      const reviewerIds = app.records
        .filter((r) => r.kind === STEP_KIND.REVIEWER && r.decision === DECISION.AGREE)
        .map((r) => r.reviewerId)
      const financeId = app.records.find((r) => r.kind === STEP_KIND.FINANCE)?.reviewerId || null
      this.products.push({
        id: uid('cp'),
        applicationId: app.id,
        applicationCode: app.code,
        companyId: company.id,
        companyName: company.name,
        productFormName: app.productFormName,
        productType: app.productType,
        amount: app.amount,
        applicantId: app.applicantId, // 签单人
        applicantName: app.applicantName,
        financeId,
        reviewerIds, // 经手审核人
        approvedTime: app.updateTime,
      })
    },
  },
})

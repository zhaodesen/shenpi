import { defineStore } from 'pinia'
import { seedApplications } from '@/mock/seed'
import { APPLY_STATUS, STEP_KIND, DECISION } from '@/constants'
import { useCustomerStore } from './customer'

let _id = Date.now()
const uid = () => `a_${(_id++).toString(36)}`

function now() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}

function genCode() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  const rnd = String(Math.floor(Math.random() * 900) + 100)
  return `QD${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${rnd}`
}

// 签单申请 + 审批工作流
export const useApplicationStore = defineStore('application', {
  state: () => ({
    list: seedApplications(),
  }),
  getters: {
    byId: (state) => (id) => state.list.find((a) => a.id === id),

    // 某申请人发起的申请（签单申请列表）
    byApplicant: (state) => (userId) =>
      state.list.filter((a) => a.applicantId === userId).sort((a, b) => b.createTime.localeCompare(a.createTime)),

    // 财务（第一审核人）待办：状态为待财务审核，且第一节点指派给我
    financePending: (state) => (userId) =>
      state.list.filter(
        (a) => a.status === APPLY_STATUS.PENDING_FINANCE && a.flow[0]?.userId === userId,
      ),

    // 其他审核人待办：状态为审核中，且当前节点指派给我
    reviewerPending: (state) => (userId) =>
      state.list.filter(
        (a) => a.status === APPLY_STATUS.PENDING_REVIEW && a.flow[a.currentStep]?.userId === userId,
      ),

    // 我经手过（已审批留痕）的全部申请
    reviewedByMe: (state) => (userId) =>
      state.list.filter((a) => a.records.some((r) => r.reviewerId === userId)),
  },
  actions: {
    // ===== 提交人：发起签单申请 =====
    createApplication(payload) {
      const item = {
        id: uid(),
        code: genCode(),
        companyId: payload.companyId || null,
        companyName: payload.companyName,
        isNewCustomer: !!payload.isNewCustomer,
        productFormId: payload.productFormId,
        productFormName: payload.productFormName,
        productType: payload.productType,
        amount: Number(payload.amount) || 0,
        applicantId: payload.applicantId,
        applicantName: payload.applicantName,
        formData: payload.formData || {},
        supplementData: {},
        supplemented: false,
        status: APPLY_STATUS.PENDING_FINANCE,
        // 提交时对审批流做快照，避免后续表单改动影响在途单据
        flow: JSON.parse(JSON.stringify(payload.flow || [])),
        currentStep: 0,
        records: [],
        createTime: now(),
        updateTime: now(),
      }
      this.list.unshift(item)
      return item
    },

    // ===== 第一审核人（财务）审核 =====
    financeReview(appId, { decision, comment, reviewer }) {
      const app = this.byId(appId)
      if (!app || app.status !== APPLY_STATUS.PENDING_FINANCE) return
      app.records.push({
        id: uid(),
        step: 0,
        kind: STEP_KIND.FINANCE,
        reviewerId: reviewer.id,
        reviewerName: reviewer.name,
        decision,
        comment,
        time: now(),
      })
      if (decision === DECISION.REJECT) {
        app.status = APPLY_STATUS.REJECTED
      } else {
        // 财务同意 → 匹配产品申请表单、申请显示「待补充」
        // 进入下一审核人需同时满足：1.财务同意 2.申请人补充完
        app.status = APPLY_STATUS.PENDING_SUPPLEMENT
      }
      app.updateTime = now()
    },

    // ===== 提交人：信息补充（财务通过后「去补充」可点击）=====
    submitSupplement(appId, supplementData) {
      const app = this.byId(appId)
      if (!app || app.status !== APPLY_STATUS.PENDING_SUPPLEMENT) return
      app.supplementData = supplementData || {}
      app.supplemented = true
      // 两个条件均满足，流程往下走到其他审核人
      app.currentStep = 1
      if (app.flow.length > 1) {
        app.status = APPLY_STATUS.PENDING_REVIEW
      } else {
        this._approve(app)
      }
      app.updateTime = now()
    },

    // ===== 其他审核人审核 =====
    reviewerReview(appId, { decision, comment, reviewer }) {
      const app = this.byId(appId)
      if (!app || app.status !== APPLY_STATUS.PENDING_REVIEW) return
      if (app.flow[app.currentStep]?.userId !== reviewer.id) return
      app.records.push({
        id: uid(),
        step: app.currentStep,
        kind: STEP_KIND.REVIEWER,
        reviewerId: reviewer.id,
        reviewerName: reviewer.name,
        decision,
        comment,
        time: now(),
      })
      if (decision === DECISION.REJECT) {
        app.status = APPLY_STATUS.REJECTED
      } else {
        app.currentStep += 1
        if (app.currentStep >= app.flow.length) {
          this._approve(app)
        }
      }
      app.updateTime = now()
    },

    // ===== 审核走完：通过并写入客户库 =====
    _approve(app) {
      app.status = APPLY_STATUS.APPROVED
      app.updateTime = now()
      useCustomerStore().addApprovedProduct(app)
    },

    removeApplication(id) {
      this.list = this.list.filter((a) => a.id !== id)
    },
  },
})

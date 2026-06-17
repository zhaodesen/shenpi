// 功能权限点（与左侧菜单 / 路由一一对应）
export const PERMISSIONS = [
  { key: 'org', name: '权限配置', icon: 'Setting' },
  { key: 'personnel', name: '人员管理', icon: 'UserFilled' },
  { key: 'productForm', name: '产品申请表单', icon: 'Document' },
  { key: 'applyCreate', name: '签单申请', icon: 'EditPen' },
  { key: 'applyList', name: '签单申请列表', icon: 'Tickets' },
  { key: 'review', name: '审核', icon: 'Stamp' },
  { key: 'customer', name: '客户库', icon: 'OfficeBuilding' },
]

export const PERMISSION_MAP = PERMISSIONS.reduce((acc, p) => {
  acc[p.key] = p
  return acc
}, {})

// 签单申请流程状态
export const APPLY_STATUS = {
  PENDING_FINANCE: 'pending_finance', // 审核中（财务-第一审核人待审）
  PENDING_SUPPLEMENT: 'pending_supplement', // 待补充（财务已同意，等申请人补充）
  PENDING_REVIEW: 'pending_review', // 审核中（其他审核人逐级审核）
  APPROVED: 'approved', // 审核通过（进入客户库）
  REJECTED: 'rejected', // 已驳回
}

export const APPLY_STATUS_META = {
  [APPLY_STATUS.PENDING_FINANCE]: { label: '审核中', sub: '财务审核', type: 'warning' },
  [APPLY_STATUS.PENDING_SUPPLEMENT]: { label: '待补充', sub: '财务已通过', type: 'primary' },
  [APPLY_STATUS.PENDING_REVIEW]: { label: '审核中', sub: '审核人审核', type: 'warning' },
  [APPLY_STATUS.APPROVED]: { label: '已通过', sub: '已入客户库', type: 'success' },
  [APPLY_STATUS.REJECTED]: { label: '已驳回', sub: '', type: 'danger' },
}

// 审批节点类型
export const STEP_KIND = {
  FINANCE: 'finance', // 第一审核人：财务
  REVIEWER: 'reviewer', // 其他审核人
}

// 产品申请表单字段类型
export const FIELD_TYPES = [
  { value: 'text', label: '单行文本' },
  { value: 'textarea', label: '多行文本' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '下拉选择' },
  { value: 'date', label: '日期' },
]

// 审批决策
export const DECISION = {
  AGREE: 'agree',
  REJECT: 'reject',
}

// 演示用种子数据。所有 store 首次加载时使用这里的默认值。
// 角色权限点 key 见 src/constants/index.js PERMISSIONS

// ===== 组织架构（部门树）=====
export const seedDepartments = () => [
  { id: 'd1', name: '总公司', parentId: null },
  { id: 'd2', name: '华东大区', parentId: 'd1' },
  { id: 'd3', name: '华南大区', parentId: 'd1' },
]

// ===== 组 =====
export const seedGroups = () => [
  { id: 'g1', name: '华东一组', deptId: 'd2' },
  { id: 'g2', name: '华东二组', deptId: 'd2' },
  { id: 'g3', name: '华南一组', deptId: 'd3' },
]

// ===== 角色（含功能权限点）=====
export const seedRoles = () => [
  {
    id: 'r_admin',
    name: '系统管理员',
    desc: '配置组织架构、组、角色、人员与产品表单',
    permissions: ['org', 'personnel', 'productForm', 'applyCreate', 'applyList', 'review', 'customer'],
  },
  {
    id: 'r_sales',
    name: '销售',
    desc: '发起签单申请、补充信息、查看自己的客户',
    permissions: ['applyCreate', 'applyList', 'customer'],
  },
  {
    id: 'r_finance',
    name: '财务（第一审核人）',
    desc: '对签单申请进行第一道审核',
    permissions: ['review', 'customer'],
  },
  {
    id: 'r_reviewer',
    name: '审核人',
    desc: '财务通过且申请人补充完后逐级审核',
    permissions: ['review', 'customer'],
  },
]

// ===== 人员 =====
export const seedPersonnel = () => [
  {
    id: 'u_admin',
    name: '超级管理员',
    account: 'admin',
    deptId: 'd1',
    groupId: null,
    roleIds: ['r_admin'],
    supervisorId: null,
    isFinance: false,
    status: 'active',
  },
  {
    id: 'u_sales1',
    name: '张伟',
    account: 'zhangwei',
    deptId: 'd2',
    groupId: 'g1',
    roleIds: ['r_sales'],
    supervisorId: 'u_director',
    isFinance: false,
    status: 'active',
  },
  {
    id: 'u_sales2',
    name: '李娜',
    account: 'lina',
    deptId: 'd3',
    groupId: 'g3',
    roleIds: ['r_sales'],
    supervisorId: 'u_director',
    isFinance: false,
    status: 'active',
  },
  {
    id: 'u_finance',
    name: '王芳',
    account: 'wangfang',
    deptId: 'd1',
    groupId: null,
    roleIds: ['r_finance'],
    supervisorId: null,
    isFinance: true,
    status: 'active',
  },
  {
    id: 'u_review1',
    name: '刘强',
    account: 'liuqiang',
    deptId: 'd2',
    groupId: 'g1',
    roleIds: ['r_reviewer'],
    supervisorId: 'u_director',
    isFinance: false,
    status: 'active',
  },
  {
    id: 'u_director',
    name: '陈明（大区总监）',
    account: 'chenming',
    deptId: 'd2',
    groupId: null,
    roleIds: ['r_reviewer'],
    supervisorId: null,
    isFinance: false,
    status: 'active',
  },
]

// ===== 产品申请表单（含自定义字段 + 审批流）=====
export const seedProductForms = () => [
  {
    id: 'pf1',
    name: '标准广告投放申请单',
    productType: '广告投放',
    desc: '适用于常规广告投放类签单',
    fields: [
      { key: 'channel', label: '投放渠道', type: 'select', required: true, options: ['抖音', '微信', '百度'] },
      { key: 'budget', label: '投放预算(元)', type: 'number', required: true, options: [] },
      { key: 'period', label: '投放周期', type: 'text', required: false, options: [] },
    ],
    // 补充信息字段（财务通过后由申请人补充）
    supplementFields: [
      { key: 'contractNo', label: '合同编号', type: 'text', required: true, options: [] },
      { key: 'invoice', label: '发票信息', type: 'textarea', required: false, options: [] },
    ],
    // 审批流：第一节点必须为财务（finance），其后为审核人
    approvalFlow: [
      { order: 1, kind: 'finance', userId: 'u_finance', name: '王芳' },
      { order: 2, kind: 'reviewer', userId: 'u_review1', name: '刘强' },
      { order: 3, kind: 'reviewer', userId: 'u_director', name: '陈明（大区总监）' },
    ],
  },
  {
    id: 'pf2',
    name: 'SaaS 软件订阅申请单',
    productType: 'SaaS订阅',
    desc: '适用于软件订阅类签单',
    fields: [
      { key: 'plan', label: '订阅套餐', type: 'select', required: true, options: ['基础版', '专业版', '旗舰版'] },
      { key: 'seats', label: '席位数', type: 'number', required: true, options: [] },
      { key: 'months', label: '订阅时长(月)', type: 'number', required: true, options: [] },
    ],
    supplementFields: [
      { key: 'contractNo', label: '合同编号', type: 'text', required: true, options: [] },
    ],
    approvalFlow: [
      { order: 1, kind: 'finance', userId: 'u_finance', name: '王芳' },
      { order: 2, kind: 'reviewer', userId: 'u_director', name: '陈明（大区总监）' },
    ],
  },
]

// ===== 已有客户（公司）=====
export const seedCompanies = () => [
  { id: 'c1', name: '阿里巴巴（中国）有限公司', isNew: false },
  { id: 'c2', name: '腾讯科技（深圳）有限公司', isNew: false },
]

// ===== 已有签单申请示例 =====
export const seedApplications = () => [
  {
    id: 'a1001',
    code: 'QD20260601001',
    companyId: 'c1',
    companyName: '阿里巴巴（中国）有限公司',
    isNewCustomer: false,
    productFormId: 'pf1',
    productFormName: '标准广告投放申请单',
    productType: '广告投放',
    amount: 120000,
    applicantId: 'u_sales1',
    applicantName: '张伟',
    formData: { channel: '抖音', budget: 120000, period: '2026Q3' },
    supplementData: {},
    supplemented: false,
    status: 'pending_finance',
    flow: [
      { order: 1, kind: 'finance', userId: 'u_finance', name: '王芳' },
      { order: 2, kind: 'reviewer', userId: 'u_review1', name: '刘强' },
      { order: 3, kind: 'reviewer', userId: 'u_director', name: '陈明（大区总监）' },
    ],
    currentStep: 0,
    records: [],
    createTime: '2026-06-01 09:30:00',
    updateTime: '2026-06-01 09:30:00',
  },
]

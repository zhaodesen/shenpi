import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('@/views/Dashboard.vue'), meta: { title: '工作台', icon: 'HomeFilled' } },
      { path: 'org', name: 'org', component: () => import('@/views/permission/OrgRole.vue'), meta: { title: '权限配置', perm: 'org' } },
      { path: 'personnel', name: 'personnel', component: () => import('@/views/personnel/PersonnelList.vue'), meta: { title: '人员管理', perm: 'personnel' } },
      { path: 'product-form', name: 'productForm', component: () => import('@/views/productForm/ProductFormList.vue'), meta: { title: '产品申请表单', perm: 'productForm' } },
      { path: 'apply-create', name: 'applyCreate', component: () => import('@/views/application/ApplyCreate.vue'), meta: { title: '签单申请', perm: 'applyCreate' } },
      { path: 'apply-list', name: 'applyList', component: () => import('@/views/application/ApplyList.vue'), meta: { title: '签单申请列表', perm: 'applyList' } },
      { path: 'review', name: 'review', component: () => import('@/views/review/ReviewList.vue'), meta: { title: '审核', perm: 'review' } },
      { path: 'customer', name: 'customer', component: () => import('@/views/customer/CustomerLibrary.vue'), meta: { title: '客户库', perm: 'customer' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 权限守卫：无对应功能权限点时回退到工作台
router.beforeEach((to) => {
  if (to.meta?.public) return true
  const auth = useAuthStore()
  if (!auth.currentUser) return { name: 'login' }
  if (to.meta?.perm && !auth.can(to.meta.perm)) {
    return { name: 'dashboard' }
  }
  return true
})

export default router

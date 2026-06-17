<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { usePersonnelStore } from '@/stores/personnel'
import { useApplicationStore } from '@/stores/application'
import { useOrgStore } from '@/stores/org'
import { clearAllPersist } from '@/stores/persist'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const personnel = usePersonnelStore()
const appStore = useApplicationStore()
const org = useOrgStore()

const roleLabel = (u) => (u.roleIds || []).map((r) => org.roleName(r)).join('、')

const menus = computed(() =>
  [
    { path: '/dashboard', title: '工作台', icon: 'HomeFilled' },
    { path: '/org', title: '权限配置', icon: 'Setting', perm: 'org' },
    { path: '/personnel', title: '人员管理', icon: 'UserFilled', perm: 'personnel' },
    { path: '/product-form', title: '产品申请表单', icon: 'Document', perm: 'productForm' },
    { path: '/apply-create', title: '签单申请', icon: 'EditPen', perm: 'applyCreate' },
    { path: '/apply-list', title: '签单申请列表', icon: 'Tickets', perm: 'applyList' },
    { path: '/review', title: '审核', icon: 'Stamp', perm: 'review', badge: pendingCount.value },
    { path: '/customer', title: '客户库', icon: 'OfficeBuilding', perm: 'customer' },
  ].filter((m) => !m.perm || auth.can(m.perm)),
)

const pendingCount = computed(() => {
  const id = auth.currentUserId
  return appStore.financePending(id).length + appStore.reviewerPending(id).length
})

const currentTitle = computed(() => route.meta?.title || '工作台')

function onSwitchUser(userId) {
  auth.switchUser(userId)
  ElMessage.success(`已切换身份：${personnel.name(userId)}`)
  router.push('/dashboard')
}

function resetDemo() {
  ElMessageBox.confirm('将清空本地演示数据并恢复初始状态，确定继续？', '重置演示数据', {
    type: 'warning',
    confirmButtonText: '重置',
    cancelButtonText: '取消',
  })
    .then(() => {
      clearAllPersist()
      location.reload()
    })
    .catch(() => {})
}
</script>

<template>
  <el-container class="layout">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <el-icon><Tickets /></el-icon>
        <span>CRM 签单审批</span>
      </div>
      <el-menu :default-active="route.path" router class="menu" background-color="#1f2d3d" text-color="#bfcbd9" active-text-color="#409eff">
        <el-menu-item v-for="m in menus" :key="m.path" :index="m.path">
          <el-icon><component :is="m.icon" /></el-icon>
          <span>{{ m.title }}</span>
          <el-badge v-if="m.badge" :value="m.badge" class="menu-badge" />
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <span class="crumb">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <el-button text :icon="'RefreshLeft'" @click="resetDemo">重置演示数据</el-button>
          <el-divider direction="vertical" />
          <span class="text-muted">当前身份</span>
          <el-dropdown trigger="click" @command="onSwitchUser">
            <span class="user-chip">
              <el-avatar :size="26" style="background:#409eff">{{ auth.currentUser?.name?.[0] }}</el-avatar>
              <span class="user-name">{{ auth.currentUser?.name }}</span>
              <el-tag v-for="r in auth.roleNames" :key="r" size="small" type="info" effect="plain">{{ r }}</el-tag>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item v-for="u in personnel.activeList" :key="u.id" :command="u.id" :disabled="u.id === auth.currentUserId">
                  <span style="min-width:72px;display:inline-block">{{ u.name }}</span>
                  <span class="text-muted" style="font-size:12px">{{ roleLabel(u) }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped>
.layout {
  height: 100%;
}
.aside {
  background: #1f2d3d;
  overflow-y: auto;
}
.logo {
  height: 56px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  padding: 0 18px;
  background: #18222e;
}
.menu {
  border-right: none;
}
.menu-badge {
  margin-left: auto;
}
.header {
  background: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.crumb {
  font-size: 16px;
  font-weight: 600;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  outline: none;
}
.user-name {
  font-weight: 600;
}
.main {
  background: #f0f2f5;
  padding: 0;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

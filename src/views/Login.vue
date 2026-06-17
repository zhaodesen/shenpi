<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePersonnelStore } from '@/stores/personnel'
import { useOrgStore } from '@/stores/org'

const router = useRouter()
const auth = useAuthStore()
const personnel = usePersonnelStore()
const org = useOrgStore()

const selected = ref(auth.currentUserId)
const users = computed(() => personnel.activeList)
const roleLabel = (u) => (u.roleIds || []).map((r) => org.roleName(r)).join('、')

function enter() {
  auth.switchUser(selected.value)
  router.push('/dashboard')
}
</script>

<template>
  <div class="login-wrap">
    <div class="login-card">
      <div class="brand">
        <el-icon :size="30" color="#409eff"><Tickets /></el-icon>
        <h1>CRM 签单审批系统</h1>
        <p class="text-muted">演示环境 · 选择一个身份进入，体验「申请 → 财务审核 → 补充 → 多级审核 → 客户库」完整链路</p>
      </div>

      <div class="user-grid">
        <div
          v-for="u in users"
          :key="u.id"
          class="user-tile"
          :class="{ active: selected === u.id }"
          @click="selected = u.id"
        >
          <el-avatar :size="40" style="background:#409eff">{{ u.name[0] }}</el-avatar>
          <div class="info">
            <div class="name">{{ u.name }}</div>
            <div class="role text-muted">{{ roleLabel(u) }}</div>
          </div>
          <el-icon v-if="selected === u.id" class="check" color="#409eff"><CircleCheckFilled /></el-icon>
        </div>
      </div>

      <el-button type="primary" size="large" style="width:100%" @click="enter">进入系统</el-button>
    </div>
  </div>
</template>

<style scoped>
.login-wrap {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1f2d3d 0%, #2c5364 100%);
}
.login-card {
  width: 560px;
  background: #fff;
  border-radius: 12px;
  padding: 36px 40px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.25);
}
.brand {
  text-align: center;
  margin-bottom: 24px;
}
.brand h1 {
  font-size: 22px;
  margin: 10px 0 6px;
}
.user-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}
.user-tile {
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.15s;
  position: relative;
}
.user-tile:hover {
  border-color: #409eff;
}
.user-tile.active {
  border-color: #409eff;
  background: #ecf5ff;
}
.info .name {
  font-weight: 600;
}
.info .role {
  font-size: 12px;
}
.check {
  position: absolute;
  right: 10px;
  top: 10px;
  font-size: 18px;
}
</style>

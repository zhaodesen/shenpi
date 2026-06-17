<script setup>
import { FIELD_TYPES } from '@/constants'

defineProps({ list: { type: Array, default: () => [] } })
const emit = defineEmits(['add', 'remove'])
</script>

<template>
  <div>
    <el-table v-if="list.length" :data="list" border size="small">
      <el-table-column label="字段名(key)" width="150">
        <template #default="{ row }"><el-input v-model="row.key" size="small" placeholder="如 budget" /></template>
      </el-table-column>
      <el-table-column label="标题" width="150">
        <template #default="{ row }"><el-input v-model="row.label" size="small" placeholder="如 投放预算" /></template>
      </el-table-column>
      <el-table-column label="类型" width="130">
        <template #default="{ row }">
          <el-select v-model="row.type" size="small">
            <el-option v-for="t in FIELD_TYPES" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </template>
      </el-table-column>
      <el-table-column label="选项(逗号分隔)" min-width="160">
        <template #default="{ row }">
          <el-input
            v-if="row.type === 'select'"
            :model-value="row.options.join('，')"
            size="small"
            @update:model-value="(v) => (row.options = v.split(/[，,]/).map((s) => s.trim()).filter(Boolean))"
          />
          <span v-else class="text-muted">-</span>
        </template>
      </el-table-column>
      <el-table-column label="必填" width="70" align="center">
        <template #default="{ row }"><el-switch v-model="row.required" size="small" /></template>
      </el-table-column>
      <el-table-column label="操作" width="60" align="center">
        <template #default="{ $index }">
          <el-button link type="danger" size="small" @click="emit('remove', $index)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-button size="small" style="margin-top:8px" :icon="'Plus'" @click="emit('add')">添加字段</el-button>
  </div>
</template>

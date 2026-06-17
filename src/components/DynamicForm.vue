<script setup>
// 根据字段定义动态渲染表单，直接读写传入的 reactive model 对象
defineProps({
  fields: { type: Array, default: () => [] },
  model: { type: Object, required: true },
  labelWidth: { type: String, default: '110px' },
})
</script>

<template>
  <el-form :label-width="labelWidth">
    <el-form-item v-for="f in fields" :key="f.key" :label="f.label" :required="f.required">
      <el-input v-if="f.type === 'text'" v-model="model[f.key]" :placeholder="`请输入${f.label}`" />
      <el-input v-else-if="f.type === 'textarea'" v-model="model[f.key]" type="textarea" :rows="2" :placeholder="`请输入${f.label}`" />
      <el-input-number v-else-if="f.type === 'number'" v-model="model[f.key]" :controls="false" style="width:100%" :placeholder="`请输入${f.label}`" />
      <el-date-picker v-else-if="f.type === 'date'" v-model="model[f.key]" type="date" value-format="YYYY-MM-DD" style="width:100%" :placeholder="`请选择${f.label}`" />
      <el-select v-else-if="f.type === 'select'" v-model="model[f.key]" :placeholder="`请选择${f.label}`" style="width:100%">
        <el-option v-for="o in f.options" :key="o" :label="o" :value="o" />
      </el-select>
      <el-input v-else v-model="model[f.key]" />
    </el-form-item>
    <el-empty v-if="!fields.length" description="无字段" :image-size="60" />
  </el-form>
</template>

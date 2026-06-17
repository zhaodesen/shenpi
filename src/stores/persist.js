// 简易 Pinia 持久化插件：把每个 store 的 state 存到 localStorage
// 首次加载（无缓存）时使用 store 中 state() 定义的种子数据
const PREFIX = 'crm_shenpi_'

export function persistPlugin({ store }) {
  const key = PREFIX + store.$id
  const saved = localStorage.getItem(key)
  if (saved) {
    try {
      store.$patch(JSON.parse(saved))
    } catch (e) {
      console.warn('[persist] 读取缓存失败', store.$id, e)
    }
  }
  store.$subscribe((_mutation, state) => {
    localStorage.setItem(key, JSON.stringify(state))
  })
}

// 清空所有演示数据
export function clearAllPersist() {
  Object.keys(localStorage)
    .filter((k) => k.startsWith(PREFIX))
    .forEach((k) => localStorage.removeItem(k))
}

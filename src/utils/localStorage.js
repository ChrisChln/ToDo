// 本地存储工具函数 - 支持按用户隔离数据

// 获取用户特定的 key
const getUserKey = (key, userId) => {
  return userId ? `${key}_${userId}` : key
}

export const saveToLocalStorage = (key, data, userId = null) => {
  try {
    const userKey = getUserKey(key, userId)
    const jsonData = JSON.stringify(data)
    localStorage.setItem(userKey, jsonData)
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export const loadFromLocalStorage = (key, defaultValue = null, userId = null) => {
  try {
    const userKey = getUserKey(key, userId)
    const jsonData = localStorage.getItem(userKey)
    const result = jsonData ? JSON.parse(jsonData) : defaultValue
    
    return result
  } catch (error) {
    console.error('Error loading from localStorage:', error)
    return defaultValue
  }
}

export const clearLocalStorage = (key, userId = null) => {
  try {
    const userKey = getUserKey(key, userId)
    localStorage.removeItem(userKey)
  } catch (error) {
    console.error('Error clearing localStorage:', error)
  }
}

// 清空特定用户的所有数据
export const clearUserData = (userId) => {
  try {
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.endsWith(`_${userId}`)) {
        localStorage.removeItem(key)
      }
    })
    console.log(`Cleared all data for user: ${userId}`)
  } catch (error) {
    console.error('Error clearing user data:', error)
  }
}

// 获取所有用户 ID 列表
export const getAllUserIds = () => {
  try {
    const keys = Object.keys(localStorage)
    const userIds = new Set()
    
    keys.forEach(key => {
      // 查找格式为 "key_userId" 的键
      const match = key.match(/^(todos|calendar|theme|share|home|auth)_(.+)$/)
      if (match && match[2] && match[2] !== 'null') {
        userIds.add(match[2])
      }
    })
    
    return Array.from(userIds)
  } catch (error) {
    console.error('Error getting user IDs:', error)
    return []
  }
}

const createId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `icon_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

const toDataArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter(item => typeof item === 'string' && item)
  }
  if (typeof value === 'string' && value) {
    return [value]
  }
  return []
}

const toMetaArray = (value, length) => {
  const source = Array.isArray(value)
    ? value.filter(item => typeof item === 'string')
    : typeof value === 'string' && value
      ? [value]
      : []

  return Array.from({ length }, (_, index) => source[index] || '')
}

const withDefaults = (icon, index = 0) => {
  const safeRow = Number.isFinite(icon?.row) ? icon.row : Math.floor(index / 6) + 1
  const safeColumn = Number.isFinite(icon?.column) ? icon.column : (index % 6) + 1
  const validActionTypes = ['link', 'text', 'image', 'barcode']
  let actionType = typeof icon?.actionType === 'string' ? icon.actionType : ''
  if (!validActionTypes.includes(actionType)) {
    if (icon?.url) {
      actionType = 'link'
    } else if (icon?.actionValue) {
      actionType = 'text'
    } else {
      actionType = 'text'
    }
  }

  let actionValue = typeof icon?.actionValue === 'string' ? icon.actionValue : ''
  let actionMeta = typeof icon?.actionMeta === 'string' ? icon.actionMeta : ''

  if (actionType === 'link') {
    actionValue = actionValue || (typeof icon?.url === 'string' ? icon.url : '')
    actionMeta = ''
  } else if (actionType === 'text') {
    actionValue = actionValue || ''
    actionMeta = ''
  } else if (actionType === 'image') {
    const values = toDataArray(icon?.actionValue || actionValue)
    const metas = toMetaArray(icon?.actionMeta || actionMeta || icon?.imageName, values.length)
    if (!values.length) {
      actionType = icon?.url ? 'link' : 'text'
      if (actionType === 'link') {
        actionValue = typeof icon?.url === 'string' ? icon.url : ''
        actionMeta = ''
      } else {
        actionValue = ''
        actionMeta = ''
      }
    } else {
      actionValue = values
      actionMeta = metas
      actionMeta.length = actionValue.length
    }
  } else if (actionType === 'barcode') {
    const values = toDataArray(icon?.actionValue || actionValue)
    const metas = toMetaArray(icon?.actionMeta || actionMeta, values.length)
    if (!values.length) {
      actionType = icon?.url ? 'link' : 'text'
      if (actionType === 'link') {
        actionValue = typeof icon?.url === 'string' ? icon.url : ''
        actionMeta = ''
      } else {
        actionValue = ''
        actionMeta = ''
      }
    } else {
      actionValue = values
      actionMeta = metas
      actionMeta.length = actionValue.length
    }
  }

  return {
    id: icon?.id || createId(),
    title: (icon?.title || '未命名').slice(0, 40),
    url: actionType === 'link' ? actionValue : '',
    actionType,
    actionValue,
    actionMeta,
    iconType: icon?.iconType === 'custom' ? 'custom' : 'builtin',
    iconName: icon?.iconName || 'Folder',
    customData: icon?.customData || '',
    row: safeRow,
    column: safeColumn,
    background: icon?.background || '#3B82F6',
    createdAt: icon?.createdAt || new Date().toISOString(),
  }
}

export const createDefaultHomeState = () => ({
  icons: [
    withDefaults({
      id: 'home-icon-calendar',
      title: '日历',
      url: 'app:calendar',
      iconType: 'builtin',
      iconName: 'Calendar',
      row: 1,
      column: 1,
      background: '#6366F1',
    }),
    withDefaults({
      id: 'home-icon-tasks',
      title: '任务列表',
      url: 'app:tools',
      iconType: 'builtin',
      iconName: 'ListTodo',
      row: 1,
      column: 2,
      background: '#22C55E',
    }),
    withDefaults({
      id: 'home-icon-help',
      title: '使用说明',
      url: 'https://focusboard.example.com/docs',
      iconType: 'builtin',
      iconName: 'BookOpen',
      row: 1,
      column: 3,
      background: '#F97316',
    }),
  ],
})

export const normalizeHomeData = (raw) => {
  if (!raw || typeof raw !== 'object') {
    return createDefaultHomeState()
  }

  if (Array.isArray(raw.icons)) {
    const icons = raw.icons
      .map((icon, index) => withDefaults(icon, index))
      .sort((a, b) => (a.row - b.row) || (a.column - b.column))

    return {
      icons,
    }
  }

  if (Array.isArray(raw)) {
    const icons = raw
      .map((icon, index) => withDefaults(icon, index))
      .sort((a, b) => (a.row - b.row) || (a.column - b.column))

    return {
      icons,
    }
  }

  return createDefaultHomeState()
}

export const createHomeIconId = () => createId()

const DEFAULT_CATEGORY_CONFIG = [
  { id: 'thisWeek', name: '本周任务' },
  { id: 'thisMonth', name: '本月计划' },
  { id: 'personal', name: '个人安排' },
  { id: 'booksToRead', name: '阅读清单' },
]

const categoryMetaMap = DEFAULT_CATEGORY_CONFIG.reduce((acc, category) => {
  acc[category.id] = category
  return acc
}, {})

export const createDefaultCategories = () =>
  DEFAULT_CATEGORY_CONFIG.map(category => ({
    id: category.id,
    name: category.name,
    collapsed: false,
    todos: [],
  }))

export const createDefaultTodoState = () => ({
  categories: createDefaultCategories(),
})

const sanitizeTodosArray = (todos) => {
  if (!Array.isArray(todos)) {
    return []
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

  return todos.map((todo, index) => {
    const id = todo?.id || `t${Date.now()}_${index}`
    const rawLink = typeof todo?.link === 'string' ? todo.link : ''
    const rawContentValue = typeof todo?.contentValue === 'string' ? todo.contentValue : ''
    const rawContentMeta = typeof todo?.contentMeta === 'string' ? todo.contentMeta : ''
    const candidateType = typeof todo?.contentType === 'string' ? todo.contentType : ''
    const validTypes = ['link', 'text', 'image', 'barcode']

    let contentType = validTypes.includes(candidateType) ? candidateType : ''
    let contentValue = rawContentValue
    let contentMeta = rawContentMeta
    let link = rawLink

    if (!contentType) {
      contentType = link ? 'link' : (contentValue ? 'text' : 'text')
    }

    if (contentType === 'link') {
      const resolved = rawContentValue || rawLink
      contentValue = typeof resolved === 'string' ? resolved : ''
      link = contentValue
      contentMeta = ''
    } else if (contentType === 'text') {
      contentValue = rawContentValue || ''
      link = ''
      contentMeta = ''
    } else if (contentType === 'image') {
      const values = toDataArray(todo?.contentValue || todo?.images || rawContentValue)
      const metas = toMetaArray(todo?.contentMeta || todo?.imageName || rawContentMeta, values.length)
      if (!values.length) {
        contentType = link ? 'link' : 'text'
        if (contentType === 'link') {
          contentValue = link
          contentMeta = ''
        } else {
          contentValue = ''
          contentMeta = ''
        }
      } else {
        contentValue = values
        contentMeta = metas
        link = ''
      }
    } else if (contentType === 'barcode') {
      const values = toDataArray(todo?.contentValue || rawContentValue)
      const metas = toMetaArray(todo?.contentMeta || rawContentMeta || todo?.barcodeSource, values.length)
      if (!values.length) {
        contentType = link ? 'link' : 'text'
        if (contentType === 'link') {
          contentValue = link
          contentMeta = ''
        } else {
          contentValue = ''
          contentMeta = ''
        }
      } else {
        contentValue = values
        contentMeta = metas
        link = ''
      }
    }

    const createdAt = todo?.createdAt || new Date().toISOString().split('T')[0]

    return {
      ...todo,
      id,
      title: todo?.title || '未命名子列表',
      status: todo?.status === 'complete' ? 'complete' : 'incomplete',
      createdAt,
      iconName: todo?.iconName || 'ListTodo',
      link,
      contentType,
      contentValue,
      contentMeta,
      url: undefined, // legacy cleanup
    }
  })
}

const buildCategory = ({ id, name, collapsed, todos }, fallbackIdIndex = 0) => {
  const meta = categoryMetaMap[id] || {}
  const resolvedId = id || `category_${Date.now()}_${fallbackIdIndex}`

  return {
    id: resolvedId,
    name: name || meta.name || '未命名分类',
    collapsed: typeof collapsed === 'boolean' ? collapsed : false,
    todos: sanitizeTodosArray(todos),
  }
}

export const normalizeTodosData = (rawTodos) => {
  if (!rawTodos) {
    return createDefaultTodoState()
  }

  if (Array.isArray(rawTodos.categories)) {
    const normalizedCategories = rawTodos.categories
      .map((category, index) =>
        buildCategory(
          {
            id: category.id,
            name: category.name,
            collapsed: category.collapsed,
            todos: category.todos,
          },
          index
        )
      )
      .filter(Boolean)

    if (normalizedCategories.length === 0) {
      return createDefaultTodoState()
    }

    return {
      categories: normalizedCategories,
    }
  }

  if (typeof rawTodos === 'object') {
    const entries = Object.entries(rawTodos)
      .filter(([key, todos]) => {
        return Array.isArray(todos) && key !== 'categories'
      })

    if (entries.length === 0) {
      return createDefaultTodoState()
    }

    const normalizedCategories = entries.map(([key, todos], index) =>
      buildCategory(
        {
          id: key,
          name: categoryMetaMap[key]?.name,
          collapsed: false,
          todos,
        },
        index
      )
    )

    return {
      categories: normalizedCategories,
    }
  }

  return createDefaultTodoState()
}

export const getCategoryMetaMap = () => ({ ...categoryMetaMap })

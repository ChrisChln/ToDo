import { useEffect, useMemo, useState } from 'react'
import {
  Plus,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import {
  addTodo,
  toggleTodo,
  updateTodo,
  deleteTodo,
  addCategory,
  updateCategory,
  deleteCategory,
  toggleCategoryCollapse,
  reorderCategories,
  reorderTodos,
} from '../store/slices/todoSlice'
import TodoModal from './TodoModal'
import ContentPreviewModal from './ContentPreviewModal'
import { icons as lucideIcons } from 'lucide-react'

const DEFAULT_TODO_ACCENT = '#8B5CF6'

const normalizeHexColor = (value) => {
  if (typeof value === 'string') {
    const hex = value.trim().replace(/^#/, '')
    if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
      return `#${hex.toUpperCase()}`
    }
  }
  return DEFAULT_TODO_ACCENT
}

const hexToRgba = (hex, alpha = 1) => {
  const normalized = normalizeHexColor(hex).slice(1)
  const int = parseInt(normalized, 16)
  const r = (int >> 16) & 255
  const g = (int >> 8) & 255
  const b = int & 255
  const a = Math.min(Math.max(alpha, 0), 1)
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

const getTodoAccentStyles = (rawColor, isDark) => {
  const base = normalizeHexColor(rawColor)
  const containerBg = hexToRgba(base, isDark ? 0.24 : 0.12)
  const borderColor = hexToRgba(base, isDark ? 0.55 : 0.35)
  const actionBg = hexToRgba(base, isDark ? 0.55 : 0.18)
  const actionBorder = hexToRgba(base, isDark ? 0.7 : 0.32)
  const actionText = isDark ? '#F8FAFC' : base
  const addButtonBorder = hexToRgba(base, isDark ? 0.45 : 0.3)
  const addButtonBg = hexToRgba(base, isDark ? 0.22 : 0.08)
  const addButtonText = isDark ? '#E2E8F0' : base

  return {
    container: { borderColor, backgroundColor: containerBg },
    icon: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: isDark ? '#F8FAFC' : base,
    },
    action: {
      backgroundColor: actionBg,
      borderColor: actionBorder,
      color: actionText,
    },
    addButton: {
      borderColor: addButtonBorder,
      backgroundColor: addButtonBg,
      color: addButtonText,
    },
  }
}

function Sidebar() {
  const dispatch = useDispatch()
  const storeCategories = useSelector(state => state.todos?.categories || [])
  const isDark = useSelector(state => state.theme?.isDark || false)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [orderedCategories, setOrderedCategories] = useState(storeCategories)
  const [activeCategory, setActiveCategory] = useState(storeCategories[0]?.id || null)
  const [modalCategoryId, setModalCategoryId] = useState(storeCategories[0]?.id || null)
  const [editingTodo, setEditingTodo] = useState(null)
  const [previewState, setPreviewState] = useState({ open: false, type: null, value: '', title: '', meta: '' })
  const [draggedCategoryId, setDraggedCategoryId] = useState(null)
  const [dropIndicator, setDropIndicator] = useState(null)
  const [draggedTodoId, setDraggedTodoId] = useState(null)
  const [todoDropIndicator, setTodoDropIndicator] = useState(null)
  const [renamingCategoryId, setRenamingCategoryId] = useState(null)

  useEffect(() => {
    setOrderedCategories(storeCategories)
  }, [storeCategories])

  useEffect(() => {
    if (!orderedCategories.length) {
      setActiveCategory(null)
      setModalCategoryId(null)
      return
    }

    if (!orderedCategories.some(category => category.id === activeCategory)) {
      setActiveCategory(orderedCategories[0]?.id || null)
    }

    if (!orderedCategories.some(category => category.id === modalCategoryId)) {
      setModalCategoryId(orderedCategories[0]?.id || null)
    }
  }, [orderedCategories, activeCategory, modalCategoryId])

  const activeCategoryName = useMemo(() => {
    return orderedCategories.find(category => category.id === (modalCategoryId || activeCategory))?.name || ''
  }, [orderedCategories, modalCategoryId, activeCategory])

  const handleSaveTodo = (todo, mode) => {
    const targetCategoryId = todo.categoryId || modalCategoryId || activeCategory
    if (!targetCategoryId) return

    if (mode === 'edit') {
      dispatch(updateTodo({ categoryId: targetCategoryId, id: todo.id, updates: todo }))
    } else {
      dispatch(addTodo({ categoryId: targetCategoryId, todo }))
    }
  }

  const handleToggleTodo = (categoryId, todoId) => {
    if (isEditing) return
    dispatch(toggleTodo({ categoryId, id: todoId }))
  }

  const handleDeleteTodo = (todo) => {
    const targetCategoryId = todo.categoryId || modalCategoryId || activeCategory
    if (!targetCategoryId) return
    dispatch(deleteTodo({ categoryId: targetCategoryId, id: todo.id }))
  }

  const handleCategorySelect = (categoryId) => {
    setActiveCategory(categoryId)
    setModalCategoryId(categoryId)
  }

  const openTodoModalForCategory = (categoryId, todoItem = null) => {
    handleCategorySelect(categoryId)
    setEditingTodo(todoItem)
    setIsModalOpen(true)
  }

  const closeTodoModal = () => {
    setIsModalOpen(false)
    setEditingTodo(null)
  }

  const handleTodoModalSubmit = (todoItem, mode) => {
    handleSaveTodo(todoItem, mode)
    closeTodoModal()
  }

  const handleTodoModalDelete = (todoItem) => {
    handleDeleteTodo(todoItem)
    closeTodoModal()
  }

  const openPreviewForTodo = (todoItem) => {
    if (!todoItem) return
    const type = todoItem.contentType || (todoItem.link ? 'link' : 'text')
    if (type === 'text') {
      const textValue =
        typeof todoItem.contentValue === 'string'
          ? todoItem.contentValue
          : Array.isArray(todoItem.contentValue)
            ? todoItem.contentValue.join('\n')
            : todoItem.link || ''

      if (!textValue) return
      setPreviewState({
        open: true,
        type: 'text',
        value: textValue,
        title: todoItem.title,
        meta: '',
      })
    } else if (type === 'image') {
      const images = Array.isArray(todoItem.contentValue)
        ? todoItem.contentValue.filter(item => typeof item === 'string' && item)
        : typeof todoItem.contentValue === 'string' && todoItem.contentValue
          ? [todoItem.contentValue]
          : []
      if (!images.length) return
      const metas = Array.isArray(todoItem.contentMeta)
        ? todoItem.contentMeta
        : typeof todoItem.contentMeta === 'string' && todoItem.contentMeta
          ? [todoItem.contentMeta]
          : []
      setPreviewState({
        open: true,
        type: 'image',
        value: images,
        title: todoItem.title,
        meta: metas,
      })
    } else if (type === 'barcode') {
      const images = Array.isArray(todoItem.contentValue)
        ? todoItem.contentValue.filter(item => typeof item === 'string' && item)
        : typeof todoItem.contentValue === 'string' && todoItem.contentValue
          ? [todoItem.contentValue]
          : []
      if (!images.length) return
      const metas = Array.isArray(todoItem.contentMeta)
        ? todoItem.contentMeta
        : typeof todoItem.contentMeta === 'string' && todoItem.contentMeta
          ? [todoItem.contentMeta]
          : []
      setPreviewState({
        open: true,
        type: 'barcode',
        value: images,
        title: todoItem.title,
        meta: metas,
      })
    }
  }

  const closePreview = () => {
    setPreviewState({ open: false, type: null, value: '', title: '', meta: '' })
  }

  const handleAddCategory = () => {
    const newId = `category_${Date.now()}`
    dispatch(addCategory({ id: newId, name: '新建分类' }))
    setActiveCategory(newId)
    setModalCategoryId(newId)
  }

  const handleDeleteCategory = (categoryId) => {
    if (modalCategoryId === categoryId) {
      setIsModalOpen(false)
      setModalCategoryId(null)
    }
    if (activeCategory === categoryId) {
      setActiveCategory(null)
    }
    dispatch(deleteCategory({ categoryId }))
  }

  const handleCategoryNameChange = (categoryId, name) => {
    dispatch(updateCategory({ categoryId, name }))
  }

  const handleCategoryNameBlur = (categoryId, name) => {
    dispatch(updateCategory({ categoryId, name, finalizeName: true }))
  }

  const handleCategoryNameKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.currentTarget.blur()
    }
  }

  const handleCategoryDragStart = (event, categoryId) => {
    if (!isEditing) return
    event.stopPropagation()
    setDraggedCategoryId(categoryId)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', categoryId)
    }
  }

  const handleCategoryDragOver = (event, targetId) => {
    if (!isEditing) return
    event.preventDefault()
    event.stopPropagation()
    if (!targetId) return

    const rect = event.currentTarget.getBoundingClientRect()
    const offsetY = event.clientY - rect.top
    const position = offsetY < rect.height / 2 ? 'before' : 'after'
    setDropIndicator({ id: targetId, position })
  }

  const handleCategoryDragLeave = (event, targetId) => {
    if (!isEditing || !dropIndicator) return
    if (!event.currentTarget.contains(event.relatedTarget)) {
      if (dropIndicator.id === targetId) {
        setDropIndicator(null)
      }
    }
  }

  const reorderCategoriesLocally = (sourceId, targetId, position) => {
    const current = [...orderedCategories]
    const sourceIndex = current.findIndex(category => category.id === sourceId)
    let targetIndex = current.findIndex(category => category.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return current

    const [moved] = current.splice(sourceIndex, 1)
    if (position === 'after') {
      targetIndex = Math.min(targetIndex, current.length)
      current.splice(targetIndex + (sourceIndex < targetIndex ? 0 : 1), 0, moved)
    } else {
      targetIndex = Math.max(0, targetIndex)
      current.splice(targetIndex + (sourceIndex < targetIndex ? -1 : 0), 0, moved)
    }
    return current.filter(Boolean)
  }

  const handleCategoryDrop = (event, targetId) => {
    if (!isEditing) return
    event.preventDefault()
    event.stopPropagation()

    const sourceId = draggedCategoryId || event.dataTransfer?.getData('text/plain')
    if (!sourceId || !targetId || sourceId === targetId) {
      setDraggedCategoryId(null)
      setDropIndicator(null)
      return
    }

    const position = dropIndicator?.id === targetId ? dropIndicator.position : 'after'
    const reordered = reorderCategoriesLocally(sourceId, targetId, position)

    setOrderedCategories(reordered)
    dispatch(reorderCategories({ orderedIds: reordered.map(category => category.id) }))
    setDraggedCategoryId(null)
    setDropIndicator(null)
  }

  const handleCategoryDragEnd = () => {
    setDraggedCategoryId(null)
    setDropIndicator(null)
  }

  const toggleEditing = () => {
    setIsEditing(prev => !prev)
    setDraggedCategoryId(null)
    setDropIndicator(null)
    setDraggedTodoId(null)
    setTodoDropIndicator(null)
    setRenamingCategoryId(null)
    setEditingTodo(null)
    setIsModalOpen(false)
  }
  
  const handleCategoryDoubleClick = (categoryId) => {
    if (isEditing) {
      setRenamingCategoryId(categoryId)
    }
  }
  
  const handleCategoryRename = (categoryId, name) => {
    dispatch(updateCategory({ categoryId, name: name.trim() || '未命名分类', finalizeName: true }))
    setRenamingCategoryId(null)
  }
  
  // 子列表拖拽功能
  const handleTodoDragStart = (event, todoId, categoryId) => {
    if (!isEditing) return
    event.stopPropagation()
    setDraggedTodoId({ todoId, categoryId })
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', todoId)
    }
  }

  const handleTodoDragOver = (event, targetTodoId, categoryId) => {
    if (!isEditing) return
    event.preventDefault()
    event.stopPropagation()
    if (!targetTodoId || !draggedTodoId || draggedTodoId.todoId === targetTodoId) return
    if (draggedTodoId.categoryId !== categoryId) return

    const rect = event.currentTarget.getBoundingClientRect()
    const offsetY = event.clientY - rect.top
    
    // 使用更精确的位置判断，与日历事件类似
    const relativePosition = offsetY / rect.height
    const position = relativePosition < 0.3 ? 'before' : (relativePosition > 0.7 ? 'after' : (offsetY < rect.height / 2 ? 'before' : 'after'))
    
    setTodoDropIndicator({ todoId: targetTodoId, categoryId, position })
  }

  const handleTodoDragLeave = (event, targetTodoId) => {
    if (!isEditing || !todoDropIndicator) return
    if (!event.currentTarget.contains(event.relatedTarget)) {
      if (todoDropIndicator.todoId === targetTodoId) {
        setTodoDropIndicator(null)
      }
    }
  }

  const reorderTodosLocally = (categoryId, sourceId, targetId, position) => {
    const category = orderedCategories.find(cat => cat.id === categoryId)
    if (!category) return []
    
    const todos = [...(category.todos || [])]
    const sourceIndex = todos.findIndex(todo => todo.id === sourceId)
    let targetIndex = todos.findIndex(todo => todo.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return todos

    const [moved] = todos.splice(sourceIndex, 1)
    if (position === 'after') {
      targetIndex = Math.min(targetIndex, todos.length)
      todos.splice(targetIndex + (sourceIndex < targetIndex ? 0 : 1), 0, moved)
    } else {
      targetIndex = Math.max(0, targetIndex)
      todos.splice(targetIndex + (sourceIndex < targetIndex ? -1 : 0), 0, moved)
    }
    return todos.filter(Boolean)
  }

  const handleTodoDrop = (event, targetTodoId, categoryId) => {
    if (!isEditing) return
    event.preventDefault()
    event.stopPropagation()

    const sourceId = draggedTodoId?.todoId || event.dataTransfer?.getData('text/plain')
    if (!sourceId || !targetTodoId || sourceId === targetTodoId) {
      setDraggedTodoId(null)
      setTodoDropIndicator(null)
      return
    }

    if (!draggedTodoId || draggedTodoId.categoryId !== categoryId) {
      setDraggedTodoId(null)
      setTodoDropIndicator(null)
      return
    }

    const position = todoDropIndicator?.todoId === targetTodoId ? todoDropIndicator.position : 'after'
    const reordered = reorderTodosLocally(categoryId, sourceId, targetTodoId, position)

    // 更新本地状态
    setOrderedCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, todos: reordered } : cat
    ))
    
    dispatch(reorderTodos({ categoryId, orderedIds: reordered.map(todo => todo.id) }))
    setDraggedTodoId(null)
    setTodoDropIndicator(null)
  }

  const handleTodoDragEnd = () => {
    setDraggedTodoId(null)
    setTodoDropIndicator(null)
  }

  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')

  return (
    <aside className={`w-72 flex-shrink-0 border-r transition-colors overflow-hidden ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <div className="h-full flex flex-col min-w-0">
        {orderedCategories.length > 0 && (
          <>
            <div className="px-4 pt-4 pb-4 flex items-center justify-between">
              <div className="flex items-center">
                <img src="/Logo.png" alt="ToDo" className="h-12 w-auto" />
              </div>
              <button
                onClick={toggleEditing}
                className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors text-white"
                style={{ backgroundColor: primaryColor }}
                onMouseEnter={(e) => {
                  const hex = primaryColor.replace('#', '')
                  const r = parseInt(hex.substr(0, 2), 16)
                  const g = parseInt(hex.substr(2, 2), 16)
                  const b = parseInt(hex.substr(4, 2), 16)
                  const darken = (val) => Math.max(0, val - 20)
                  e.currentTarget.style.backgroundColor = `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = primaryColor
                }}
              >
                <Settings size={16} />
                {isEditing ? '完成' : '管理'}
              </button>
            </div>


            <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 pt-5 min-w-0">
              {/* 删除“拖动分类以调整顺序”提示 */}

              <div className="space-y-4 min-w-0">

              {orderedCategories.map((category, categoryIndex) => {
                const indicator = dropIndicator?.id === category.id ? dropIndicator.position : null
                const isLastCategory = categoryIndex === orderedCategories.length - 1
                return (
                  <div key={category.id}>
                    {indicator === 'before' && (
                      <div 
                        className="mb-2 h-1 rounded-full transition-all"
                        style={{
                          backgroundColor: isDark ? `${primaryColor}B3` : primaryColor
                        }}
                      />
                    )}

                    <div
                      draggable={isEditing}
                      onDragStart={(event) => handleCategoryDragStart(event, category.id)}
                      onDragOver={(event) => handleCategoryDragOver(event, category.id)}
                      onDrop={(event) => handleCategoryDrop(event, category.id)}
                      onDragLeave={(event) => handleCategoryDragLeave(event, category.id)}
                      onDragEnd={handleCategoryDragEnd}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-colors min-w-0 ${
                        activeCategory === category.id
                          ? 'font-semibold'
                          : isDark
                            ? 'border-transparent bg-gray-900/40 text-gray-200'
                            : 'border-transparent bg-gray-50 text-gray-700'
                      } ${isEditing ? 'cursor-move ios-wiggle-slow' : 'cursor-pointer'}`}
                      style={(() => {
                        const hex = primaryColor.replace('#', '')
                        const r = parseInt(hex.substr(0, 2), 16)
                        const g = parseInt(hex.substr(2, 2), 16)
                        const b = parseInt(hex.substr(4, 2), 16)
                        if (activeCategory === category.id) {
                          return {
                            borderColor: `rgba(${r}, ${g}, ${b}, ${isDark ? 0.9 : 0.9})`,
                            backgroundColor: `rgba(${r}, ${g}, ${b}, ${isDark ? 0.28 : 0.2})`,
                            color: isDark ? '#F3F4F6' : '#1F2937',
                            boxShadow: `inset 0 0 0 1px rgba(${r}, ${g}, ${b}, ${isDark ? 0.35 : 0.25})`
                          }
                        }
                        // 非激活态：使用主题色的浅边框，增强对比度
                        return {
                          borderColor: `rgba(${r}, ${g}, ${b}, ${isDark ? 0.45 : 0.35})`,
                          boxShadow: `inset 0 0 0 1px rgba(${r}, ${g}, ${b}, ${isDark ? 0.18 : 0.14})`,
                          backgroundColor: isDark ? `rgba(${r}, ${g}, ${b}, 0.06)` : `rgba(${r}, ${g}, ${b}, 0.04)`
                        }
                      })()}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          handleCategorySelect(category.id)
                          dispatch(toggleCategoryCollapse({ categoryId: category.id }))
                        }}
                        className={`p-1 bg-transparent focus:outline-none transition-colors ${
                          isDark ? 'text-gray-300 hover:text-gray-100' : 'text-gray-500 hover:text-gray-700'
                        }`}
                        aria-label={category.collapsed ? '展开分类' : '收起分类'}
                      >
                        {category.collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                      </button>

                      {isEditing && renamingCategoryId === category.id ? (
                        <input
                          type="text"
                          autoFocus
                          defaultValue={category.name}
                          onBlur={(e) => handleCategoryRename(category.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleCategoryRename(category.id, e.currentTarget.value)
                            } else if (e.key === 'Escape') {
                              setRenamingCategoryId(null)
                            }
                          }}
                          className={`flex-1 basis-0 min-w-0 bg-transparent outline-none text-sm font-medium ${
                            isDark ? 'text-gray-200' : 'text-gray-700'
                          }`}
                          style={{
                            maxWidth: 'calc(100% - 80px)'
                          }}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handleCategorySelect(category.id)
                            dispatch(toggleCategoryCollapse({ categoryId: category.id }))
                          }}
                          onDoubleClick={() => handleCategoryDoubleClick(category.id)}
                          className="flex-1 basis-0 min-w-0 text-left font-medium hover:underline"
                          style={{
                            maxWidth: 'none'
                          }}
                          title={category.name}
                        >
                          <span className="truncate block">{category.name}</span>
                        </button>
                      )}

                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category.id)}
                          className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                            isDark
                              ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                              : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                          }`}
                        >
                          ×
                        </button>
                      ) : null}
                    </div>

                    {/* 新增分类按钮 - 只在最后一个分类后面显示，但如果分类展开则显示在子列表区域下方 */}
                    {isEditing && isLastCategory && category.collapsed && (
                      <button
                        onClick={handleAddCategory}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg transition-colors my-2 text-sm font-medium"
                        style={{
                          backgroundColor: isDark ? primaryColor : primaryColor,
                          color: 'white',
                        }}
                        onMouseEnter={(e) => {
                          const hex = primaryColor.replace('#', '')
                          const r = parseInt(hex.substr(0, 2), 16)
                          const g = parseInt(hex.substr(2, 2), 16)
                          const b = parseInt(hex.substr(4, 2), 16)
                          const darken = (val) => Math.max(0, val - 20)
                          e.currentTarget.style.backgroundColor = `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = primaryColor
                        }}
                      >
                        <Plus size={16} />
                        新增分类
                      </button>
                    )}

                    {!category.collapsed && (
                      <div
                        className={`mt-3 space-y-2 rounded-xl px-3 py-2 ${
                          isDark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-200 bg-white'
                        }`}
                      >
                        {category.todos.map((todo, todoIndex) => {
                          const Icon = lucideIcons[todo.iconName] || lucideIcons.ListTodo
                          const isComplete = todo.status === 'complete'
                          const contentType = todo.contentType || (todo.link ? 'link' : 'text')
                          const linkValue =
                            contentType === 'link'
                              ? (typeof todo.contentValue === 'string' && todo.contentValue
                                ? todo.contentValue
                                : typeof todo.link === 'string'
                                  ? todo.link
                                  : '')
                              : typeof todo.link === 'string'
                                ? todo.link
                                : ''
                          const textValue =
                            contentType === 'text'
                              ? typeof todo.contentValue === 'string'
                                ? todo.contentValue
                                : Array.isArray(todo.contentValue)
                                  ? todo.contentValue.join('\n')
                                  : ''
                              : ''
                          const imageValues =
                            contentType === 'image'
                              ? Array.isArray(todo.contentValue)
                                ? todo.contentValue.filter(item => typeof item === 'string' && item)
                                : typeof todo.contentValue === 'string' && todo.contentValue
                                  ? [todo.contentValue]
                                  : []
                              : []
                          const imageMetas =
                            contentType === 'image'
                              ? Array.isArray(todo.contentMeta)
                                ? todo.contentMeta
                                : typeof todo.contentMeta === 'string' && todo.contentMeta
                                  ? [todo.contentMeta]
                                  : []
                              : []
                          const barcodeValues =
                            contentType === 'barcode'
                              ? Array.isArray(todo.contentValue)
                                ? todo.contentValue.filter(item => typeof item === 'string' && item)
                                : typeof todo.contentValue === 'string' && todo.contentValue
                                  ? [todo.contentValue]
                                  : []
                              : []
                          const barcodeMetas =
                            contentType === 'barcode'
                              ? Array.isArray(todo.contentMeta)
                                ? todo.contentMeta
                                : typeof todo.contentMeta === 'string' && todo.contentMeta
                                  ? [todo.contentMeta]
                                  : []
                              : []
                          const accentStyles = getTodoAccentStyles(todo.accentColor, isDark)
                          const isDragged = draggedTodoId?.todoId === todo.id
                          const todoIndicator = todoDropIndicator?.categoryId === category.id && todoDropIndicator?.todoId === todo.id ? todoDropIndicator.position : null

                          return (
                            <div key={todo.id}>
                              {todoIndicator === 'before' && (
                                <div 
                                  className="mb-1 h-0.5 rounded-full transition-all"
                                  style={{
                                    backgroundColor: isDark ? `${primaryColor}B3` : primaryColor
                                  }}
                                />
                              )}
                              <div
                                draggable={isEditing}
                                onDragStart={(event) => {
                                  // 如果点击的是按钮，不启动拖拽
                                  if (event.target.closest('button')) {
                                    event.preventDefault()
                                    return
                                  }
                                  handleTodoDragStart(event, todo.id, category.id)
                                }}
                                onDragOver={(event) => {
                                  // 如果点击的是按钮，阻止拖拽
                                  if (event.target.closest('button')) {
                                    return
                                  }
                                  handleTodoDragOver(event, todo.id, category.id)
                                }}
                                onDragLeave={(event) => {
                                  // 检查是否真正离开了元素
                                  const relatedTarget = event.relatedTarget
                                  if (relatedTarget && event.currentTarget.contains(relatedTarget)) {
                                    return
                                  }
                                  handleTodoDragLeave(event, todo.id)
                                }}
                                onDrop={(event) => {
                                  // 如果点击的是按钮，阻止放下
                                  if (event.target.closest('button')) {
                                    event.preventDefault()
                                    return
                                  }
                                  handleTodoDrop(event, todo.id, category.id)
                                }}
                                onDragEnd={handleTodoDragEnd}
                                className={`flex items-center gap-3 rounded-lg border px-3 py-1 text-sm transition-all ${
                                  isDark ? 'text-gray-200' : 'text-gray-800'
                                } ${isEditing ? 'cursor-move ios-wiggle' : ''} ${isDragged ? 'opacity-50' : ''}`}
                                style={accentStyles.container}
                                onClick={() => {
                                  if (isEditing) {
                                    openTodoModalForCategory(category.id, { ...todo, categoryId: category.id })
                                  } else {
                                    handleToggleTodo(category.id, todo.id)
                                  }
                                }}
                              >
                              <span
                                className="flex items-center justify-center text-base transition-colors"
                                style={accentStyles.icon}
                              >
                                <Icon size={16} />
                              </span>
                              <span className="flex-1 truncate">{todo.title}</span>

                              {!isEditing && contentType === 'link' && linkValue && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    const target = linkValue.startsWith('http') ? linkValue : `https://${linkValue}`
                                    window.open(target, '_blank', 'noopener,noreferrer')
                                  }}
                                  className="rounded-md px-2 py-1 text-xs font-medium border transition-colors"
                                  style={accentStyles.action}
                                >
                                  打开
                                </button>
                              )}

                              {!isEditing && contentType === 'text' && textValue && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    openPreviewForTodo({ ...todo, contentType, contentValue: textValue, contentMeta: '' })
                                  }}
                                  className="rounded-md px-2 py-1 text-xs font-medium border transition-colors"
                                  style={accentStyles.action}
                                >
                                  查看
                                </button>
                              )}

                              {!isEditing && contentType === 'image' && imageValues.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    openPreviewForTodo({
                                      ...todo,
                                      contentType,
                                      contentValue: imageValues,
                                      contentMeta: imageMetas,
                                    })
                                  }}
                                  className="rounded-md px-2 py-1 text-xs font-medium border transition-colors"
                                  style={accentStyles.action}
                                >
                                  预览
                                </button>
                              )}

                              {!isEditing && contentType === 'barcode' && barcodeValues.length > 0 && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    openPreviewForTodo({
                                      ...todo,
                                      contentType,
                                      contentValue: barcodeValues,
                                      contentMeta: barcodeMetas,
                                    })
                                  }}
                                  className="rounded-md px-2 py-1 text-xs font-medium border transition-colors"
                                  style={accentStyles.action}
                                >
                                  条码
                                </button>
                              )}

                              {isEditing && (
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleDeleteTodo({ ...todo, categoryId: category.id })
                                  }}
                                  className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                                    isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300' : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                                  }`}
                                >
                                  ×
                                </button>
                              )}
                              </div>
                              {todoIndicator === 'after' && (
                                <div 
                                  className="mt-1 h-0.5 rounded-full transition-all"
                                  style={{
                                    backgroundColor: isDark ? `${primaryColor}B3` : primaryColor
                                  }}
                                />
                              )}
                            </div>
                          )
                        })}

                        {isEditing && (
                          <button
                            onClick={() => openTodoModalForCategory(category.id)}
                            className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-2 text-sm font-medium transition-colors ${
                              isDark
                                ? 'border-gray-700 text-gray-300 hover:border-gray-500 hover:text-gray-200'
                                : 'border-gray-300 text-gray-600 hover:border-gray-500 hover:text-gray-700'
                            }`}
                          >
                            <Plus size={16} />
                            添加子列表
                          </button>
                        )}
                        {/* 如果这是最后一个分类且展开，在这里显示新增分类按钮 */}
                        {isEditing && isLastCategory && (
                          <button
                            onClick={handleAddCategory}
                            className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg transition-colors mt-2 text-sm font-medium"
                            style={{
                              backgroundColor: isDark ? primaryColor : primaryColor,
                              color: 'white',
                            }}
                            onMouseEnter={(e) => {
                              const hex = primaryColor.replace('#', '')
                              const r = parseInt(hex.substr(0, 2), 16)
                              const g = parseInt(hex.substr(2, 2), 16)
                              const b = parseInt(hex.substr(4, 2), 16)
                              const darken = (val) => Math.max(0, val - 20)
                              e.currentTarget.style.backgroundColor = `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = primaryColor
                            }}
                          >
                            <Plus size={16} />
                            新增分类
                          </button>
                        )}
                      </div>
                    )}
                    {indicator === 'after' && (
                      <div 
                        className="mt-2 h-1 rounded-full transition-all"
                        style={{
                          backgroundColor: isDark ? `${primaryColor}B3` : primaryColor
                        }}
                      />
                    )}
                  </div>
            )
          })}
              </div>
            </div>
          </>
        )}
      </div>

      {isModalOpen && (
        <TodoModal
          isOpen={isModalOpen}
          onClose={closeTodoModal}
          onSubmit={handleTodoModalSubmit}
          onDelete={handleTodoModalDelete}
          categoryId={modalCategoryId || activeCategory}
          categoryName={activeCategoryName}
          todo={editingTodo}
        />
      )}

      <ContentPreviewModal
        isOpen={previewState.open}
        type={previewState.type}
        title={previewState.title}
        value={previewState.value}
        meta={previewState.meta}
        onClose={closePreview}
        isDark={isDark}
      />
    </aside>
  )
}

export default Sidebar

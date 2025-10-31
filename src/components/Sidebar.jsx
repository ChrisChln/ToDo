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
    setEditingTodo(null)
    setIsModalOpen(false)
  }

  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')

  return (
    <aside className={`w-80 border-r transition-colors ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'}`}>
      <div className="h-full flex flex-col">
        {orderedCategories.length > 0 && (
          <>
            <div className="px-4 pt-4 pb-4 flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>我的列表</h3>
              </div>
              <button
                onClick={toggleEditing}
                className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
              >
                <Settings size={16} />
                {isEditing ? '完成' : '管理'}
              </button>
            </div>

            {isEditing && (
              <div className="px-4 pb-4">
            <button
              onClick={handleAddCategory}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors text-white"
              style={{
                backgroundColor: isDark ? primaryColor : primaryColor,
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
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 pb-4 pt-5">
              {/* 删除“拖动分类以调整顺序”提示 */}

              <div className="space-y-4">

              {orderedCategories.map((category) => {
                const indicator = dropIndicator?.id === category.id ? dropIndicator.position : null
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
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition-colors ${
                        activeCategory === category.id
                          ? 'font-semibold'
                          : isDark
                            ? 'border-transparent bg-gray-900/40 text-gray-200'
                            : 'border-transparent bg-gray-50 text-gray-700'
                      } ${isEditing ? 'cursor-move ios-wiggle' : 'cursor-pointer'}`}
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

                      {isEditing ? (
                        <input
                          type="text"
                          value={category.name}
                          onChange={(event) => handleCategoryNameChange(category.id, event.target.value)}
                          onBlur={(event) => {
                            handleCategoryNameBlur(category.id, event.target.value)
                            event.currentTarget.style.borderColor = ''
                          }}
                          onKeyDown={handleCategoryNameKeyDown}
                          className={`flex-1 basis-0 min-w-0 rounded-lg border px-3 py-2 text-sm font-medium focus:outline-none ${
                            isDark
                              ? 'bg-transparent border-gray-700 text-gray-100'
                              : 'bg-transparent border-gray-200 text-gray-900'
                          }`}
                          style={{
                            maxWidth: 'calc(100% - 92px)'
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = primaryColor
                          }}
                          placeholder="输入分类名称"
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            handleCategorySelect(category.id)
                            dispatch(toggleCategoryCollapse({ categoryId: category.id }))
                          }}
                          className="flex-1 text-left font-medium hover:underline"
                        >
                          {category.name}
                        </button>
                      )}

                      {isEditing ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(category.id)}
                          className={`shrink-0 rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                            isDark
                              ? 'bg-red-500/20 text-red-300 hover:bg-red-500/40'
                              : 'bg-red-100 text-red-600 hover:bg-red-200'
                          }`}
                        >
                          删除
                        </button>
                      ) : null}
                    </div>

                    {!category.collapsed && (
                      <div
                        className={`mt-3 space-y-2 rounded-xl px-3 py-2 ${
                          isDark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-200 bg-white'
                        }`}
                      >
                        {category.todos.map((todo) => {
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

                          return (
                            <div
                              key={todo.id}
                              className={`flex items-center gap-3 rounded-lg border px-3 py-1 text-sm transition-all ${
                                isDark ? 'text-gray-200' : 'text-gray-800'
                              } ${isEditing ? 'ios-wiggle' : ''}`}
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
                                  className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                                    isDark ? 'bg-red-500/20 text-red-300 hover:bg-red-500/40' : 'bg-red-100 text-red-600 hover:bg-red-200'
                                  }`}
                                >
                                  删除
                                </button>
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

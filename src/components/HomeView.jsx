import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { icons as lucideIcons } from 'lucide-react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import {
  addHomeIcon,
  updateHomeIcon,
  removeHomeIcon,
  setHomeIcons,
} from '../store/slices/homeSlice'
import { createHomeIconId } from '../utils/homeHelpers'
import HomeIconModal from './HomeIconModal'
import ContentPreviewModal from './ContentPreviewModal'
import ToolModal from './ToolModal'
import ManageButton from './ManageButton'

const availableIconNames = Object.keys(lucideIcons)
  .filter((key) => /^[A-Z]/.test(key))
  .sort((a, b) => a.localeCompare(b))

const gridCellSize = '120px' // 固定宽度，避免随容器宽度变化
const gridColumns = 6
const minPlaceholderRows = 4
const MAX_DESKTOPS = 20 // 最大桌面数量限制

const internalRoutePattern = /^app:(home|calendar|tools)$/i

function sortIcons(icons) {
  return [...icons].sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row
    if (a.column !== b.column) return a.column - b.column
    return a.title.localeCompare(b.title, 'zh-CN')
  })
}

function resolveNextPosition(icons) {
  if (!icons.length) {
    return { row: 1, column: 1 }
  }
  const maxRow = Math.max(...icons.map(icon => icon.row || 1))
  const rowIcons = icons.filter(icon => icon.row === maxRow)
  if (rowIcons.length >= 6) {
    return { row: maxRow + 1, column: 1 }
  }
  const maxColumn = Math.max(...rowIcons.map(icon => icon.column || 0), 0)
  return { row: maxRow, column: Math.min(maxColumn + 1, 6) || 1 }
}

function getIconComponent(name) {
  if (!name) return lucideIcons.Folder
  const component = lucideIcons[name]
  return component || lucideIcons.Folder
}

function hexToRgb(hex) {
  const s = (hex || '#000000').replace('#', '')
  const r = parseInt(s.substring(0, 2), 16) || 0
  const g = parseInt(s.substring(2, 4), 16) || 0
  const b = parseInt(s.substring(4, 6), 16) || 0
  return { r, g, b }
}

function HomeView({ onNavigate }) {
  const dispatch = useDispatch()
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  const icons = useSelector(state => state.home?.icons || [])

  const orderedIcons = useMemo(() => sortIcons(icons), [icons])
  const [visibleIcons, setVisibleIcons] = useState(orderedIcons)

  const [isEditing, setIsEditing] = useState(false)
  const [modalState, setModalState] = useState({ open: false, icon: null })
  const [previewState, setPreviewState] = useState({ open: false, type: null, value: '', title: '', meta: '' })
  const [toolModalState, setToolModalState] = useState({ open: false, toolId: '' })
  const [draggedIconId, setDraggedIconId] = useState(null)
  const [draggedDesktopId, setDraggedDesktopId] = useState(null)
  const [desktopDropIndicator, setDesktopDropIndicator] = useState(null)

  // Multi-desktop state (persist to localStorage)
  const [desktops, setDesktops] = useState([]) // [{id, name}]
  const [activeDesktopId, setActiveDesktopId] = useState('')
  const [renamingId, setRenamingId] = useState('')
  const desktopScrollRef = useRef(null)
  const [desktopScrollState, setDesktopScrollState] = useState({ canScrollLeft: false, canScrollRight: false })

  const DESKTOPS_KEY = 'home_desktops'
  const ACTIVE_KEY = 'home_activeDesktop'
  const desktopIconsKey = (id) => `home_desktop_${id}`

  // load desktops at mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DESKTOPS_KEY) || '[]')
      let list = Array.isArray(saved) ? saved : []
      if (!list.length) {
        list = [{ id: 'desk-1', name: '桌面 1' }]
        localStorage.setItem(DESKTOPS_KEY, JSON.stringify(list))
        // bootstrap current icons
        localStorage.setItem(desktopIconsKey('desk-1'), JSON.stringify(icons))
        localStorage.setItem(ACTIVE_KEY, 'desk-1')
      }
      setDesktops(list)
      const act = localStorage.getItem(ACTIVE_KEY) || list[0].id
      setActiveDesktopId(act)
      // load icons for active
      const raw = localStorage.getItem(desktopIconsKey(act))
      if (raw) {
        const parsed = JSON.parse(raw)
        dispatch(setHomeIcons(parsed))
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // persist current desktop icons when icons change
  useEffect(() => {
    if (!activeDesktopId) return
    try {
      localStorage.setItem(desktopIconsKey(activeDesktopId), JSON.stringify(icons))
    } catch {}
  }, [icons, activeDesktopId])

  const handleAddDesktop = () => {
    if (desktops.length >= MAX_DESKTOPS) {
      return // 达到上限，不允许再添加
    }
    const id = `desk-${Date.now().toString(36)}`
    const next = [...desktops, { id, name: '新桌面' }]
    setDesktops(next)
    localStorage.setItem(DESKTOPS_KEY, JSON.stringify(next))
    localStorage.setItem(desktopIconsKey(id), JSON.stringify([]))
    localStorage.setItem(ACTIVE_KEY, id)
    setActiveDesktopId(id)
    dispatch(setHomeIcons([]))
    setRenamingId(id)
  }

  const handleSwitchDesktop = (id) => {
    if (id === activeDesktopId) return
    localStorage.setItem(ACTIVE_KEY, id)
    setActiveDesktopId(id)
    try {
      const raw = localStorage.getItem(desktopIconsKey(id))
      const parsed = raw ? JSON.parse(raw) : []
      dispatch(setHomeIcons(parsed))
    } catch {
      dispatch(setHomeIcons([]))
    }
  }

  const handleRenameDesktop = (id, name) => {
    const next = desktops.map(d => d.id === id ? { ...d, name: name.slice(0, 20) || '未命名' } : d)
    setDesktops(next)
    localStorage.setItem(DESKTOPS_KEY, JSON.stringify(next))
  }

  const handleDeleteDesktop = (id) => {
    if (desktops.length <= 1) return // 至少保留一个桌面
    const next = desktops.filter(d => d.id !== id)
    setDesktops(next)
    localStorage.setItem(DESKTOPS_KEY, JSON.stringify(next))
    localStorage.removeItem(desktopIconsKey(id))
    // 清除改名状态
    setRenamingId('')
    // 如果删除的是当前桌面，切换到第一个
    if (id === activeDesktopId) {
      const newActive = next[0].id
      setActiveDesktopId(newActive)
      localStorage.setItem(ACTIVE_KEY, newActive)
      try {
        const raw = localStorage.getItem(desktopIconsKey(newActive))
        const parsed = raw ? JSON.parse(raw) : []
        dispatch(setHomeIcons(parsed))
      } catch {
        dispatch(setHomeIcons([]))
      }
    }
  }

  const handleDesktopDragStart = (event, desktopId) => {
    if (!isEditing) return
    event.stopPropagation()
    setDraggedDesktopId(desktopId)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', desktopId)
    }
  }

  const handleDesktopDragOver = (event, desktopId) => {
    if (!isEditing || !draggedDesktopId || draggedDesktopId === desktopId) return
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const midX = rect.left + rect.width / 2
    const mouseX = event.clientX
    setDesktopDropIndicator({ id: desktopId, position: mouseX < midX ? 'before' : 'after' })
  }

  const handleDesktopDrop = (event, targetDesktopId) => {
    if (!isEditing || !draggedDesktopId || draggedDesktopId === targetDesktopId) return
    event.preventDefault()
    event.stopPropagation()
    
    const sourceIndex = desktops.findIndex(d => d.id === draggedDesktopId)
    const targetIndex = desktops.findIndex(d => d.id === targetDesktopId)
    
    if (sourceIndex === -1 || targetIndex === -1) {
      setDraggedDesktopId(null)
      setDesktopDropIndicator(null)
      return
    }

    const newDesktops = [...desktops]
    const [removed] = newDesktops.splice(sourceIndex, 1)
    
    // 重新计算目标索引（因为源元素已被移除）
    const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
    const indicator = desktopDropIndicator?.id === targetDesktopId ? desktopDropIndicator.position : 'after'
    const insertIndex = indicator === 'before' ? adjustedTargetIndex : adjustedTargetIndex + 1
    newDesktops.splice(insertIndex, 0, removed)

    setDesktops(newDesktops)
    localStorage.setItem(DESKTOPS_KEY, JSON.stringify(newDesktops))
    setDraggedDesktopId(null)
    setDesktopDropIndicator(null)
  }

  const handleDesktopDragLeave = (event) => {
    if (!isEditing) return
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX
    const y = event.clientY
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDesktopDropIndicator(null)
    }
  }

  const handleDesktopDragEnd = () => {
    setDraggedDesktopId(null)
    setDesktopDropIndicator(null)
  }

  const updateDesktopScrollState = useCallback(() => {
    const container = desktopScrollRef.current
    if (!container) {
      setDesktopScrollState({ canScrollLeft: false, canScrollRight: false })
      return
    }
    const { scrollLeft, scrollWidth, clientWidth } = container
    const epsilon = 1
    setDesktopScrollState({
      canScrollLeft: scrollLeft > epsilon,
      canScrollRight: scrollLeft + clientWidth < scrollWidth - epsilon,
    })
  }, [])

  useEffect(() => {
    const container = desktopScrollRef.current
    if (!container) return
    updateDesktopScrollState()
    const handleScroll = () => updateDesktopScrollState()
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [updateDesktopScrollState])

  useEffect(() => {
    updateDesktopScrollState()
  }, [desktops, updateDesktopScrollState])

  // 当进入/退出管理模式时，更新滚动状态
  useEffect(() => {
    updateDesktopScrollState()
  }, [isEditing, updateDesktopScrollState])

  useEffect(() => {
    const handleResize = () => updateDesktopScrollState()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateDesktopScrollState])

  useEffect(() => {
    if (!activeDesktopId) return
    const container = desktopScrollRef.current
    if (!container) return
    const activeItem = container.querySelector(`[data-desktop-id="${activeDesktopId}"]`)
    if (activeItem) {
      activeItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
      window.setTimeout(updateDesktopScrollState, 220)
    }
  }, [activeDesktopId, updateDesktopScrollState])

  const scrollDesktops = (direction) => {
    const container = desktopScrollRef.current
    if (!container) return
    const amount = direction === 'left' ? -240 : 240
    container.scrollBy({ left: amount, behavior: 'smooth' })
    window.setTimeout(updateDesktopScrollState, 200)
  }

  useEffect(() => {
    setVisibleIcons(orderedIcons)
    // 切换桌面时立即清空拖拽状态，避免残留数据
    setDraggedIconId(null)
  }, [orderedIcons])

  const iconPositionMap = useMemo(() => {
    const map = new Map()
    visibleIcons.forEach((icon) => {
      const row = Math.max(1, icon.row || 1)
      const column = Math.max(1, Math.min(gridColumns, icon.column || 1))
      map.set(`${row}-${column}`, icon)
    })
    return map
  }, [visibleIcons])

  const maxRowFromIcons = useMemo(() => {
    if (!visibleIcons.length) return 0
    return visibleIcons.reduce((maxRow, icon) => Math.max(maxRow, icon.row || 1), 0)
  }, [visibleIcons])

  const totalRows = useMemo(() => {
    if (!isEditing) {
      return Math.max(1, maxRowFromIcons)
    }
    // 编辑模式下：如果有图标，在最大行基础上+1；如果没有图标，只显示1行空位
    if (maxRowFromIcons === 0) {
      return 1
    }
    return maxRowFromIcons + 1
  }, [isEditing, maxRowFromIcons])

  const placeholderCells = useMemo(() => {
    if (!isEditing) return []
    const cells = []
    // 管理模式下：如果没有图标显示3行，有图标显示最大行+2行，方便用户添加更多图标
    const minRowsInEditMode = 3
    const rowsToShow = maxRowFromIcons === 0 ? minRowsInEditMode : Math.max(maxRowFromIcons + 2, minRowsInEditMode)
    for (let row = 1; row <= rowsToShow; row += 1) {
      for (let column = 1; column <= gridColumns; column += 1) {
        const key = `${row}-${column}`
        if (!iconPositionMap.has(key)) {
          cells.push({ row, column, key })
        }
      }
    }
    return cells
  }, [isEditing, iconPositionMap, maxRowFromIcons])

  const handleToggleEdit = () => {
    setIsEditing(prev => !prev)
    setModalState({ open: false, icon: null })
    setDraggedIconId(null)
  }

  const handleAddIcon = () => {
    const fallbackPosition = resolveNextPosition(icons)
    const defaultIconName = availableIconNames[Math.floor(Math.random() * availableIconNames.length)] || 'Folder'
    const newIcon = {
      id: createHomeIconId(),
      title: '新建图标',
      url: '',
      actionType: 'link',
      actionValue: '',
      actionMeta: '',
      iconType: 'builtin',
      iconName: defaultIconName,
      customData: '',
      row: fallbackPosition.row,
      column: fallbackPosition.column,
      background: primaryColor,
    }
    setModalState({ open: true, icon: newIcon, isNew: true })
  }

  const handleEditIcon = (icon) => {
    setModalState({ open: true, icon, isNew: false })
  }

  const handleRemoveIcon = (id) => {
    dispatch(removeHomeIcon(id))
  }

  const handleSaveIcon = (icon, isNew) => {
    const normalized = {
      ...icon,
      url: icon.actionType === 'link' ? (icon.actionValue || icon.url || '') : '',
    }
    if (isNew) {
      dispatch(addHomeIcon(normalized))
    } else {
      const { id, ...rest } = normalized
      dispatch(updateHomeIcon({ id, changes: rest }))
    }
    setModalState({ open: false, icon: null })
  }

  const handleActivateIcon = (icon) => {
    if (isEditing) {
      handleEditIcon(icon)
      return
    }

    if (!icon.actionType) {
      return
    }

    if (icon.actionType === 'link' && icon.actionValue) {
      if (internalRoutePattern.test(icon.actionValue)) {
        const target = icon.actionValue.slice(4).toLowerCase()
        if (target === 'home') {
          onNavigate?.('home')
        } else if (target === 'calendar') {
          onNavigate?.('calendar')
        } else if (target === 'tools') {
          onNavigate?.('tools')
        }
        return
      }

      const targetUrl = icon.actionValue.startsWith('http') ? icon.actionValue : `https://${icon.actionValue}`

      try {
        const newWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer')
        if (newWindow) {
          newWindow.focus()
        }
      } catch (error) {
        console.error('无法打开链接:', error)
      }
      return
    }

    if (icon.actionType === 'text' && icon.actionValue) {
      setPreviewState({
        open: true,
        type: 'text',
        value: icon.actionValue,
        title: icon.title,
        meta: '',
      })
      return
    }

    if (icon.actionType === 'image') {
      const images = Array.isArray(icon.actionValue)
        ? icon.actionValue.filter(item => typeof item === 'string' && item)
        : typeof icon.actionValue === 'string' && icon.actionValue
          ? [icon.actionValue]
          : []
      if (!images.length) {
        return
      }
      const metasSource = Array.isArray(icon.actionMeta)
        ? icon.actionMeta
        : typeof icon.actionMeta === 'string' && icon.actionMeta
          ? [icon.actionMeta]
          : []
      const metas = images.map((_, index) => metasSource[index] || '')
      setPreviewState({
        open: true,
        type: 'image',
        value: images,
        title: icon.title,
        meta: metas,
      })
      return
    }

    if (icon.actionType === 'barcode') {
      const images = Array.isArray(icon.actionValue)
        ? icon.actionValue.filter(item => typeof item === 'string' && item)
        : typeof icon.actionValue === 'string' && icon.actionValue
          ? [icon.actionValue]
          : []
      if (!images.length) {
        return
      }
      const metasSource = Array.isArray(icon.actionMeta)
        ? icon.actionMeta
        : typeof icon.actionMeta === 'string' && icon.actionMeta
          ? [icon.actionMeta]
          : []
      const metas = images.map((_, index) => metasSource[index] || '')
      setPreviewState({
        open: true,
        type: 'barcode',
        value: images,
        title: icon.title,
        meta: metas,
      })
      return
    }

    if (icon.actionType === 'tool' && icon.actionValue) {
      setToolModalState({
        open: true,
        toolId: icon.actionValue.trim(),
      })
    }
  }

  const handleIconDragStart = (event, iconId) => {
    if (!isEditing) return
    event.stopPropagation()
    setDraggedIconId(iconId)
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', iconId)
    }
  }

  const handleIconDragOver = (event) => {
    if (!isEditing) return
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  const handleIconDrop = (event, targetIcon) => {
    if (!isEditing) return
    event.preventDefault()
    event.stopPropagation()
    const sourceId = draggedIconId || event.dataTransfer?.getData('text/plain')
    if (!sourceId || !targetIcon || sourceId === targetIcon.id) {
      setDraggedIconId(null)
      return
    }
    handleDropToPosition(sourceId, event, targetIcon.row || 1, targetIcon.column || 1, targetIcon.id)
  }

  const handleIconDragEnd = () => {
    setDraggedIconId(null)
  }

  const handlePlaceholderDragOver = (event) => {
    if (!isEditing) return
    event.preventDefault()
    event.stopPropagation()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
  }

  const handlePlaceholderDrop = (event, row, column) => {
    if (!isEditing) return
    event.preventDefault()
    event.stopPropagation()
    const sourceId = draggedIconId || event.dataTransfer?.getData('text/plain')
    if (!sourceId) {
      setDraggedIconId(null)
      return
    }
    handleDropToPosition(sourceId, event, row, column, null)
  }

  const handleDropToPosition = (sourceId, event, targetRow, targetColumn, swapWithId) => {
    const currentOrder = visibleIcons.map(icon => ({ ...icon }))
    const sourceIndex = currentOrder.findIndex(icon => icon.id === sourceId)
    if (sourceIndex === -1) {
      setDraggedIconId(null)
      return
    }

    const sourceIcon = currentOrder[sourceIndex]
    const originalRow = Math.max(1, sourceIcon.row || 1)
    const originalColumn = Math.max(1, Math.min(gridColumns, sourceIcon.column || 1))

    const updatedIcons = [...currentOrder]
    updatedIcons[sourceIndex] = {
      ...sourceIcon,
      row: Math.max(1, targetRow),
      column: Math.max(1, Math.min(gridColumns, targetColumn)),
    }

    if (swapWithId) {
      const swapIndex = updatedIcons.findIndex(icon => icon.id === swapWithId)
      if (swapIndex !== -1 && swapIndex !== sourceIndex) {
        updatedIcons[swapIndex] = {
          ...updatedIcons[swapIndex],
          row: originalRow,
          column: originalColumn,
        }
      }
    }

    const normalized = updatedIcons.map(icon => ({
      ...icon,
      row: Math.max(1, icon.row || 1),
      column: Math.max(1, Math.min(gridColumns, icon.column || 1)),
    }))

    const sorted = sortIcons(normalized)
    setVisibleIcons(sorted)
    dispatch(setHomeIcons(sorted))
    setDraggedIconId(null)
    if (event.dataTransfer) {
      event.dataTransfer.clearData()
    }
  }

  return (
    <div className={`flex-1 overflow-hidden transition-colors ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 px-8 py-6 max-w-full">
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-3 w-full max-w-[920px]">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  scrollDesktops('left')
                }}
                disabled={!desktopScrollState.canScrollLeft}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  desktopScrollState.canScrollLeft
                    ? isDark
                      ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                    : isDark
                      ? 'border-gray-800 bg-gray-900 text-gray-700 cursor-default'
                      : 'border-gray-200 bg-gray-100 text-gray-300 cursor-default'
                }`}
              >
                <ChevronLeft size={16} />
              </button>

              <div className="relative flex-1 overflow-hidden">
                <div
                  ref={desktopScrollRef}
                  className="flex items-center gap-2 px-4 py-2 min-w-0 overflow-x-hidden scroll-smooth"
                >
                  {desktops.map((desk) => {
                    const active = desk.id === activeDesktopId
                    const indicator = desktopDropIndicator?.id === desk.id ? desktopDropIndicator.position : null
                    return (
                      <div key={desk.id} className="relative flex items-center" data-desktop-id={desk.id}>
                        {indicator === 'before' && (
                          <div 
                            className="absolute left-0 top-0 -translate-x-0.5 h-full w-0.5 transition-all"
                            style={{ backgroundColor: primaryColor }}
                          />
                        )}
                        <div 
                          draggable={isEditing}
                          onDragStart={(e) => handleDesktopDragStart(e, desk.id)}
                          onDragOver={(e) => handleDesktopDragOver(e, desk.id)}
                          onDrop={(e) => handleDesktopDrop(e, desk.id)}
                          onDragLeave={handleDesktopDragLeave}
                          onDragEnd={handleDesktopDragEnd}
                          className={`relative flex items-center rounded-xl border pl-3 py-1.5 text-sm whitespace-nowrap flex-shrink-0 transition-all ${
                            isEditing && desktops.length > 1 && renamingId === desk.id ? 'pr-9' : 'pr-3'
                          } ${
                            isEditing && draggedDesktopId === desk.id ? 'opacity-50' : ''
                          } ${isEditing ? 'cursor-move ios-wiggle' : 'cursor-pointer'} ${active ? 'text-white' : (isDark ? 'text-gray-200' : 'text-gray-700')}`}
                          style={active ? { backgroundColor: primaryColor, borderColor: primaryColor } : { borderColor: isDark ? '#374151' : '#E5E7EB' }}
                          onMouseEnter={(e) => {
                            if (!active && !isEditing) {
                              const hex = primaryColor.replace('#', '')
                              const r = parseInt(hex.substr(0, 2), 16)
                              const g = parseInt(hex.substr(2, 2), 16)
                              const b = parseInt(hex.substr(4, 2), 16)
                              e.currentTarget.style.backgroundColor = `rgba(${r}, ${g}, ${b}, ${isDark ? 0.15 : 0.1})`
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!active && !isEditing) {
                              e.currentTarget.style.backgroundColor = ''
                            }
                          }}
                          onClick={(e) => {
                            if (!isEditing) {
                              e.stopPropagation()
                              handleSwitchDesktop(desk.id)
                            }
                          }}
                        >
                          {isEditing && renamingId === desk.id ? (
                            <input
                              autoFocus
                              defaultValue={desk.name}
                              onBlur={(e) => { 
                                // 使用 setTimeout 延迟检查，确保删除按钮的点击事件先处理
                                setTimeout(() => {
                                  const activeElement = document.activeElement
                                  // 如果焦点在删除按钮上，说明点击了删除，不处理 blur
                                  if (activeElement && activeElement.getAttribute('data-delete-button') === 'true') {
                                    return
                                  }
                                  handleRenameDesktop(desk.id, e.target.value)
                                  setRenamingId('') 
                                }, 100)
                              }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { handleRenameDesktop(desk.id, e.currentTarget.value); setRenamingId('') } }}
                              className={`bg-transparent outline-none max-w-[140px] ${active ? 'text-white' : (isDark ? 'text-gray-200' : 'text-gray-700')}`}
                            />
                          ) : (
                            <span className="max-w-[140px] truncate" onDoubleClick={() => isEditing && setRenamingId(desk.id)} title={desk.name}>{desk.name}</span>
                          )}
                          {isEditing && desktops.length > 1 && renamingId === desk.id && (
                            <button
                              type="button"
                              data-delete-button="true"
                              draggable={false}
                              onMouseDown={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                // 使用 onMouseDown 立即触发删除，避免 blur 事件干扰
                                handleDeleteDesktop(desk.id)
                              }}
                              className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold z-50 transition-colors pointer-events-auto ${
                                active ? 'text-white hover:bg-white/20' : (isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-200')
                              }`}
                            >
                              ×
                            </button>
                          )}
                        </div>
                        {indicator === 'after' && (
                          <div 
                            className="absolute right-0 top-0 translate-x-0.5 h-full w-0.5 transition-all"
                            style={{ backgroundColor: primaryColor }}
                          />
                        )}
                      </div>
                    )
                  })}
                  {isEditing && desktops.length < MAX_DESKTOPS && (
                    <button
                      type="button"
                      onClick={handleAddDesktop}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl border flex-shrink-0 transition-colors ${
                        isDark
                          ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
                          : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                      }`}
                      title="新建桌面"
                    >
                      <Plus size={18} />
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  scrollDesktops('right')
                }}
                disabled={!desktopScrollState.canScrollRight}
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                  desktopScrollState.canScrollRight
                    ? isDark
                      ? 'border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700'
                      : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-100'
                    : isDark
                      ? 'border-gray-800 bg-gray-900 text-gray-700 cursor-default'
                      : 'border-gray-200 bg-gray-100 text-gray-300 cursor-default'
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <ManageButton active={isEditing} onClick={handleToggleEdit} inactiveText="管理" activeText="完成" />
          </div>
        </div>

        <div className="flex-1 px-8 pb-8 overflow-auto">
          {/* 删除顶部提示 UI */}
          <div
            className={`relative min-h-[480px] rounded-3xl border transition-colors ${
              isDark ? 'border-gray-800 bg-gray-900/60' : 'border-gray-200 bg-white'
            }`}
          >
            <div
              className={`grid gap-6 px-8 pb-8 ${isEditing ? 'pt-20' : 'pt-12'} mx-auto`}
              style={{
                gridTemplateColumns: `repeat(${gridColumns}, ${gridCellSize})`,
                gridAutoRows: gridCellSize,
                width: 'fit-content',
              }}
            >
              {visibleIcons.map((icon) => {
                const IconComponent = getIconComponent(icon.iconName)
                const isCustom = icon.iconType === 'custom' && icon.customData
                const key = icon.id
                return (
                  <div
                    key={key}
                    draggable={isEditing}
                    onDragStart={(event) => handleIconDragStart(event, icon.id)}
                    onDragOver={handleIconDragOver}
                    onDrop={(event) => handleIconDrop(event, icon)}
                    onDragEnd={handleIconDragEnd}
                    className={`relative flex flex-col items-center text-center rounded-2xl border transition-all px-4 pt-6 pb-4 ${
                      isEditing
                        ? isDark
                          ? 'border-gray-700 bg-gray-800/60'
                          : 'border-gray-300 bg-gray-50'
                        : isDark
                          ? 'border-transparent bg-transparent'
                          : 'border-transparent bg-transparent'
                    } ${isEditing ? 'cursor-move ios-wiggle' : 'cursor-pointer'} ${
                      isEditing && draggedIconId === icon.id ? 'opacity-70' : ''
                    }`}
                    style={{
                      gridColumnStart: icon.column,
                      gridRowStart: icon.row,
                    }}
                    onClick={() => handleActivateIcon(icon)}
                  >
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-all"
                      style={{ background: isCustom ? 'transparent' : (icon.background || '#6366F1') }}
                      onMouseEnter={(e) => {
                        const { r, g, b } = hexToRgb(primaryColor)
                        e.currentTarget.style.boxShadow = `0 8px 20px rgba(${r}, ${g}, ${b}, 0.25), 0 0 0 2px rgba(${r}, ${g}, ${b}, 0.45)`
                        e.currentTarget.style.transform = 'scale(1.05)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = ''
                        e.currentTarget.style.transform = ''
                      }}
                    >
                      {isCustom ? (
                        <img
                          src={icon.customData}
                          alt={icon.title}
                          className="h-12 w-12 object-cover rounded-2xl"
                        />
                      ) : (
                        <IconComponent size={32} className="text-white" />
                      )}
                    </div>
                    <p className={`mt-3 w-full px-2 font-medium text-adaptive ${
                      isDark ? 'text-gray-100' : 'text-gray-800'
                    }`}>
                      {icon.title}
                    </p>
                    {isEditing && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          handleRemoveIcon(icon.id)
                        }}
                        className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white text-xs font-semibold shadow-md transition-transform hover:scale-105"
                        title="删除图标"
                      >
                        ×
                      </button>
                    )}
                  </div>
                )
              })}

              {isEditing && placeholderCells.map((cell) => (
                <div
                  key={`placeholder-${cell.key}`}
                  onDragOver={handlePlaceholderDragOver}
                  onDrop={(event) => handlePlaceholderDrop(event, cell.row, cell.column)}
                  onClick={() => {
                    const defaultIconName = availableIconNames[Math.floor(Math.random() * availableIconNames.length)] || 'Folder'
                    const newIcon = {
                      id: createHomeIconId(),
                      title: '新建图标',
                      url: '',
                      actionType: 'link',
                      actionValue: '',
                      actionMeta: '',
                      iconType: 'builtin',
                      iconName: defaultIconName,
                      customData: '',
                      row: cell.row,
                      column: cell.column,
                      background: primaryColor,
                    }
                    setModalState({ open: true, icon: newIcon, isNew: true })
                  }}
                  className={`flex items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer ${
                    isDark ? 'border-gray-700 bg-gray-800/20 text-gray-500' : 'border-gray-300 bg-gray-100 text-gray-400'
                  }`}
                  style={{
                    gridColumnStart: cell.column,
                    gridRowStart: cell.row,
                    minHeight: '120px',
                    width: '100%',
                  }}
                >
                  <span className="pointer-events-none text-xs">空位（点击新建）</span>
                </div>
              ))}

              {!visibleIcons.length && !isEditing && (
                <div className="col-span-6 flex flex-col items-center justify-center py-20 text-center">
                  <p className={`text-lg font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    还没有任何快捷方式
                  </p>
                  <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    进入"管理"后，点击空位即可新建图标。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {modalState.open && (
        <HomeIconModal
          isOpen={modalState.open}
          icon={modalState.icon}
          isNew={modalState.isNew}
          onClose={() => setModalState({ open: false, icon: null })}
          onSave={handleSaveIcon}
        />
      )}

      <ContentPreviewModal
        isOpen={previewState.open}
        type={previewState.type}
        title={previewState.title}
        value={previewState.value}
        meta={previewState.meta}
        onClose={() => setPreviewState({ open: false, type: null, value: '', title: '', meta: '' })}
        isDark={isDark}
      />

      <ToolModal
        isOpen={toolModalState.open}
        toolId={toolModalState.toolId}
        onClose={() => setToolModalState({ open: false, toolId: '' })}
      />
    </div>
  )
}

export default HomeView

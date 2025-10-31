import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { icons as lucideIcons } from 'lucide-react'
import IconPicker from './IconPicker'
import { createCode39Batch, getCode39HelperText, MAX_CODE39_LENGTH } from '../utils/barcode'
import BarcodeInputList from './BarcodeInputList'

const builtinIcons = Object.keys(lucideIcons)
  .filter((key) => /^[A-Z]/.test(key))
  .sort((a, b) => a.localeCompare(b))

const colorPalette = [
  '#1D4ED8',
  '#2563EB',
  '#4F46E5',
  '#6366F1',
  '#7C3AED',
  '#9333EA',
  '#DB2777',
  '#EA580C',
  '#F59E0B',
  '#10B981',
  '#14B8A6',
  '#0EA5E9',
  '#64748B',
  '#475569',
  '#111827',
]

const validActionTypes = ['link', 'text', 'image', 'barcode', 'tool']
const actionTypeLabels = {
  link: '打开链接',
  text: '展示文本',
  image: '预览图片',
  barcode: '条形码预览',
  tool: '调用工具',
}

// 可用的工具列表
const availableTools = [
  { id: 'theme', name: '主题色设置', component: 'ThemeColor' },
  { id: 'barcode', name: '条码生成器', component: 'BarcodeGenerator' },
  { id: 'ewh', name: 'EWH 计算器', component: 'EwhCalculator' },
  { id: 'backup', name: '数据备份', component: 'Backup' },
]

const toNumberWithinRange = (value, fallback, { min, max }) => {
  const num = Number(value)
  if (Number.isFinite(num)) {
    return Math.min(Math.max(num, min), max)
  }
  return fallback
}

const deriveFormState = (icon) => {
  const source = icon || {}
  const resolvedType = validActionTypes.includes(source.actionType)
    ? source.actionType
    : source.url
      ? 'link'
      : 'text'

  const linkValue = resolvedType === 'link' ? (source.actionValue || source.url || '') : ''
  const textValue = resolvedType === 'text' ? (source.actionValue || '') : ''
  const toolValue = resolvedType === 'tool' ? (source.actionValue || '') : ''

  const toImageItems = (value, meta) => {
    const values = Array.isArray(value)
      ? value.filter(item => typeof item === 'string' && item)
      : typeof value === 'string' && value
        ? [value]
        : []
    const names = Array.isArray(meta)
      ? meta
      : typeof meta === 'string' && meta
        ? [meta]
        : []
    return values.map((data, index) => ({
      data,
      name: names[index] || '',
    }))
  }

  const toBarcodeItems = (value, meta) => {
    const values = Array.isArray(value)
      ? value.filter(item => typeof item === 'string' && item)
      : typeof value === 'string' && value
        ? [value]
        : []
    const codes = Array.isArray(meta)
      ? meta
      : typeof meta === 'string' && meta
        ? [meta]
        : []
    return values.map((data, index) => ({
      data,
      code: codes[index] || '',
    }))
  }

  const imageItems = resolvedType === 'image' ? toImageItems(source.actionValue, source.actionMeta) : []
  const barcodeItems = resolvedType === 'barcode' ? toBarcodeItems(source.actionValue, source.actionMeta) : []
  const barcodeValues = resolvedType === 'barcode'
    ? (barcodeItems.length ? barcodeItems.map(item => item.code || '') : [''])
    : ['']

  return {
    id: source.id || '',
    title: source.title || '',
    iconType: source.iconType === 'custom' ? 'custom' : 'builtin',
    iconName: source.iconName || 'Folder',
    customData: source.customData || '',
    row: source.row || 1,
    column: source.column || 1,
    background: source.background || '#6366F1',
    actionType: resolvedType,
    linkValue,
    textValue,
    toolValue,
    imageItems,
    barcodeItems,
    barcodeValues,
  }
}

function HomeIconModal({ isOpen, icon, isNew, onClose, onSave }) {
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  const isDark = useSelector(state => state.theme?.isDark || false)
  const [form, setForm] = useState(() => {
    const initialState = deriveFormState(icon)
    // 如果是新建图标，使用主题色作为默认背景色
    if (isNew && !icon?.background) {
      initialState.background = primaryColor
    }
    return initialState
  })
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)
  const [iconZoom, setIconZoom] = useState(1)
  const [showIconLibrary, setShowIconLibrary] = useState(false)

  useEffect(() => {
    if (isOpen && icon) {
      const newState = deriveFormState(icon)
      // 如果是新建图标，使用主题色作为默认背景色
      if (isNew && !icon?.background) {
        newState.background = primaryColor
      }
      setForm(newState)
      setErrors({})
      setIsSaving(false)
    }
  }, [icon, isOpen, isNew, primaryColor])

  const trimmedBarcodeEntries = useMemo(() => {
    if (form.actionType !== 'barcode' || !Array.isArray(form.barcodeValues)) {
      return []
    }
    return form.barcodeValues.map(value => (value || '').trim()).filter(Boolean)
  }, [form.actionType, form.barcodeValues])

  const barcodePreview = useMemo(() => {
    if (form.actionType !== 'barcode') {
      return { codes: [], errors: [] }
    }
    if (!trimmedBarcodeEntries.length) {
      return { codes: [], errors: [] }
    }
    return createCode39Batch(
      trimmedBarcodeEntries.join('\n'),
      {
        backgroundColor: '#FFFFFF',
        barColor: '#111827',
      },
      { includeErrors: true },
    )
  }, [form.actionType, trimmedBarcodeEntries])

  const isValid = useMemo(() => {
    if (!form.title.trim()) return false
    if (form.iconType === 'builtin' && !form.iconName) return false
    if (form.iconType === 'custom' && !form.customData) return false

    if (form.actionType === 'link') {
      return !!form.linkValue.trim()
    }
    if (form.actionType === 'text') {
      return !!form.textValue.trim()
    }
    if (form.actionType === 'image') {
      return form.imageItems.length > 0
    }
    if (form.actionType === 'barcode') {
      if (trimmedBarcodeEntries.length > 0) {
        return barcodePreview.codes.length > 0 && barcodePreview.errors.length === 0
      }
      return Array.isArray(form.barcodeItems) && form.barcodeItems.length > 0
    }
    if (form.actionType === 'tool') {
      return !!form.toolValue.trim()
    }
    return false
  }, [form.title, form.iconType, form.iconName, form.customData, form.actionType, form.linkValue, form.textValue, form.toolValue, form.imageItems, form.barcodeItems, barcodePreview, trimmedBarcodeEntries])

  if (!isOpen || !icon) {
    return null
  }

  const handleBackgroundChange = (color) => {
    setForm(prev => ({ ...prev, background: color }))
  }

  const handleIconTypeChange = (type) => {
    setForm(prev => ({
      ...prev,
      iconType: type,
      iconName: type === 'builtin' ? (prev.iconName || 'Folder') : prev.iconName,
    }))
    setErrors(prev => ({
      ...prev,
      iconName: undefined,
      customData: undefined,
    }))
  }

  const handleIconFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 1024 * 1024 * 2) {
      setErrors(prev => ({ ...prev, customData: '图片大小需小于 2MB' }))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      setForm(prev => ({
        ...prev,
        iconType: 'custom',
        customData: typeof reader.result === 'string' ? reader.result : '',
      }))
      setErrors(prev => ({ ...prev, customData: undefined }))
    }
    reader.readAsDataURL(file)
  }

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })

  const handleActionFileChange = async (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    const tasks = await Promise.all(
      files.map(async (file) => {
        if (file.size > 1024 * 1024 * 5) {
          return { error: `${file.name} 大小需小于 5MB` }
        }
        try {
          const data = await readFileAsDataURL(file)
          if (!data) return { error: `${file.name} 上传失败` }
          return { data, name: file.name }
        } catch {
          return { error: `${file.name} 上传失败` }
        }
      })
    )

    const errorsFound = tasks.filter(item => item?.error).map(item => item.error)
    const validItems = tasks.filter(item => item?.data)

    if (errorsFound.length && !validItems.length) {
      setErrors(prev => ({ ...prev, imageItems: errorsFound[0] }))
      event.target.value = ''
      return
    }

    if (validItems.length) {
      setForm(prev => ({
        ...prev,
        actionType: 'image',
        imageItems: [...prev.imageItems, ...validItems.map(item => ({ data: item.data, name: item.name }))],
      }))
      setErrors(prev => ({ ...prev, imageItems: errorsFound.length ? errorsFound[0] : undefined }))
    }

    event.target.value = ''
  }

  const handleActionTypeChange = (type) => {
    if (!validActionTypes.includes(type)) return
    setForm(prev => ({
      ...prev,
      actionType: type,
      barcodeValues: type === 'barcode'
        ? (Array.isArray(prev.barcodeValues) && prev.barcodeValues.length ? prev.barcodeValues : [''])
        : prev.barcodeValues,
    }))
    setErrors(prev => ({
      ...prev,
      linkValue: undefined,
      textValue: undefined,
      imageItems: undefined,
      barcodeValues: undefined,
    }))
  }

  const handleRemoveActionImage = (index) => {
    setForm(prev => {
      const nextItems = prev.imageItems.filter((_, itemIndex) => itemIndex !== index)
      if (nextItems.length === 0) {
        setErrors(previous => ({ ...previous, imageItems: undefined }))
      }
      return {
        ...prev,
        imageItems: nextItems,
      }
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!isValid) {
      setErrors({
        title: !form.title.trim() ? '请输入名称' : undefined,
        iconName: form.iconType === 'builtin' && !form.iconName ? '请选择图标' : undefined,
        customData: form.iconType === 'custom' && !form.customData ? '请上传图片' : undefined,
        linkValue: form.actionType === 'link' && !form.linkValue.trim() ? '请输入链接地址' : undefined,
        textValue: form.actionType === 'text' && !form.textValue.trim() ? '请输入文本内容' : undefined,
        imageItems: form.actionType === 'image' && form.imageItems.length === 0 ? '请上传图片' : undefined,
        barcodeValues:
          form.actionType === 'barcode' && trimmedBarcodeEntries.length === 0 && (!form.barcodeItems || form.barcodeItems.length === 0)
            ? '请输入条形码内容'
            : undefined,
        toolValue: form.actionType === 'tool' && !form.toolValue.trim() ? '请选择工具' : undefined,
      })
      return
    }

    let actionValue = ''
    let actionMeta = ''

    if (form.actionType === 'link') {
      actionValue = form.linkValue.trim()
    } else if (form.actionType === 'text') {
      actionValue = form.textValue.trim()
    } else if (form.actionType === 'tool') {
      actionValue = form.toolValue.trim()
    } else if (form.actionType === 'image') {
      actionValue = form.imageItems.map(item => item.data)
      actionMeta = form.imageItems.map(item => item.name)
    } else if (form.actionType === 'barcode') {
      if (trimmedBarcodeEntries.length > 0) {
        if (barcodePreview.errors.length > 0) {
          setErrors(prev => ({
            ...prev,
            barcodeValues: barcodePreview.errors[0],
          }))
          return
        }
        if (barcodePreview.codes.length === 0) {
          setErrors(prev => ({
            ...prev,
            barcodeValues: '无法生成条形码，请检查内容',
          }))
          return
        }
        actionValue = barcodePreview.codes.map(item => item.dataUrl)
        actionMeta = barcodePreview.codes.map(item => item.value)
      } else if (form.barcodeItems?.length) {
        actionValue = form.barcodeItems.map(item => item.data)
        actionMeta = form.barcodeItems.map(item => item.code)
      } else {
        setErrors(prev => ({
          ...prev,
          barcodeValues: '请输入条形码内容',
        }))
        return
      }
    }

    setIsSaving(true)
    onSave(
      {
        id: form.id || icon.id,
        title: form.title.trim(),
        iconType: form.iconType,
        iconName: form.iconName,
        customData: form.customData,
        row: toNumberWithinRange(form.row, 1, { min: 1, max: 12 }),
        column: toNumberWithinRange(form.column, 1, { min: 1, max: 6 }),
        background: form.background,
        actionType: form.actionType,
        actionValue,
        actionMeta,
        url: form.actionType === 'link' ? actionValue : '',
      },
      isNew
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-6" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="mx-auto my-6 w-full max-w-3xl max-h-[92vh] overflow-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900 flex flex-col" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {isNew ? '新建图标' : '编辑图标'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            关闭
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px,minmax(0,1fr)]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                名称
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(event) => {
                  const value = event.target.value
                  setForm(prev => ({ ...prev, title: value }))
                  if (errors.title) {
                    setErrors(prev => ({ ...prev, title: undefined }))
                  }
                }}
                className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                  errors.title
                    ? 'border-red-500 focus:ring-red-100'
                    : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                }`}
                maxLength={40}
                placeholder="例如：团队文档"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-500">{errors.title}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  行
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={form.row}
                  onChange={(event) =>
                    setForm(prev => ({
                      ...prev,
                      row: toNumberWithinRange(event.target.value, prev.row, { min: 1, max: 12 }),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  列
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={form.column}
                  onChange={(event) =>
                    setForm(prev => ({
                      ...prev,
                      column: toNumberWithinRange(event.target.value, prev.column, { min: 1, max: 6 }),
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                背景颜色
              </label>
              <div className="mt-2 space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">主题色：</span>
                  <button
                    type="button"
                    onClick={() => handleBackgroundChange(primaryColor)}
                    className={`h-8 w-8 rounded-full border-2 transition-all ${
                      form.background === primaryColor ? 'border-purple-500 scale-110 ring-2 ring-purple-200 dark:ring-purple-800' : 'border-transparent'
                    }`}
                    style={{ background: primaryColor }}
                    title="使用主题色"
                  />
                  <span className="text-xs font-mono text-gray-600 dark:text-gray-400">{primaryColor}</span>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {useMemo(() => {
                    const extra = ['#FFFFFF', '#F3F4F6', '#E5E7EB', '#9CA3AF', '#6B7280', '#374151', '#111827', '#000000']
                    const merged = Array.from(new Set([primaryColor, ...colorPalette, ...extra]))
                    return merged
                  }, [primaryColor]).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => handleBackgroundChange(color)}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        form.background === color ? 'border-purple-500 scale-110' : 'border-transparent'
                      }`}
                      style={{ background: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3 flex items-center gap-3">
                <input
                  type="color"
                  value={form.background}
                  onChange={(e) => handleBackgroundChange(e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded-lg border-2 border-gray-300 bg-transparent transition-colors"
                />
                <input
                  type="text"
                  value={form.background}
                  onChange={(e) => {
                    const v = e.target.value.trim()
                    if (/^#[0-9A-Fa-f]{6}$/.test(v)) handleBackgroundChange(v)
                  }}
                  placeholder="#A78BFA"
                  className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                图标类型
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => handleIconTypeChange('builtin')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    form.iconType === 'builtin'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  内置图标
                </button>
                <button
                  type="button"
                  onClick={() => handleIconTypeChange('custom')}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    form.iconType === 'custom'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  上传图片
                </button>
              </div>
            </div>

            {form.iconType === 'builtin' ? (
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowIconLibrary(prev => !prev)}
                    className="rounded-lg px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
                  >
                    {showIconLibrary ? '隐藏图标库' : '显示图标库'}
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">缩放</span>
                  <input
                    type="range"
                    min={0.8}
                    max={1.6}
                    step={0.1}
                    value={iconZoom}
                    onChange={(e) => setIconZoom(parseFloat(e.target.value) || 1)}
                    className="w-40"
                  />
                  <span className="text-xs tabular-nums text-gray-500 dark:text-gray-400">{Math.round(iconZoom*100)}%</span>
                </div>
                {showIconLibrary && (
                  <IconPicker
                    icons={builtinIcons}
                    value={form.iconName}
                    scale={iconZoom}
                    onChange={(iconName) => {
                      setForm(prev => ({ ...prev, iconName }))
                      setErrors(prev => ({ ...prev, iconName: undefined }))
                    }}
                  />
                )}
                {errors.iconName && (
                  <p className="mt-1 text-xs text-red-500">{errors.iconName}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center text-xs text-gray-500 transition-colors hover:border-purple-400 hover:text-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    选择图片
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml,image/webp"
                      className="hidden"
                      onChange={handleIconFileChange}
                    />
                  </label>
                  {form.customData && (
                    <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
                      <img
                        src={form.customData}
                        alt="自定义图标预览"
                        className="h-20 w-20 object-contain"
                      />
                    </div>
                  )}
                </div>
                {errors.customData && (
                  <p className="text-xs text-red-500">{errors.customData}</p>
                )}
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                点击后执行
              </p>
              <div className="mt-3 flex gap-3">
                {validActionTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleActionTypeChange(type)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      form.actionType === type
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {actionTypeLabels[type] || type}
                  </button>
                ))}
              </div>
            </div>

            {form.actionType === 'link' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  链接地址
                </label>
                <input
                  type="text"
                  value={form.linkValue}
                  onChange={(event) => {
                    const value = event.target.value
                    setForm(prev => ({ ...prev, linkValue: value }))
                    if (errors.linkValue) {
                      setErrors(prev => ({ ...prev, linkValue: undefined }))
                    }
                  }}
                  className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errors.linkValue
                      ? 'border-red-500 focus:ring-red-100'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                  placeholder="支持 http(s) 或 app:calendar / app:tools 等内部链接"
                />
                {errors.linkValue && (
                  <p className="mt-1 text-xs text-red-500">{errors.linkValue}</p>
                )}
              </div>
            )}

            {form.actionType === 'tool' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  选择工具
                </label>
                <select
                  value={form.toolValue}
                  onChange={(event) => {
                    const value = event.target.value
                    setForm(prev => ({ ...prev, toolValue: value }))
                    if (errors.toolValue) {
                      setErrors(prev => ({ ...prev, toolValue: undefined }))
                    }
                  }}
                  className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errors.toolValue
                      ? 'border-red-500 focus:ring-red-100'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                >
                  <option value="">请选择要调用的工具</option>
                  {availableTools.map((tool) => (
                    <option key={tool.id} value={tool.id}>
                      {tool.name}
                    </option>
                  ))}
                </select>
                {errors.toolValue && (
                  <p className="mt-1 text-xs text-red-500">{errors.toolValue}</p>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  点击图标后将以弹窗形式打开选中的工具功能
                </p>
              </div>
            )}

            {form.actionType === 'text' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  文本内容
                </label>
                <textarea
                  value={form.textValue}
                  onChange={(event) => {
                    const value = event.target.value
                    setForm(prev => ({ ...prev, textValue: value }))
                    if (errors.textValue) {
                      setErrors(prev => ({ ...prev, textValue: undefined }))
                    }
                  }}
                  rows={6}
                  className={`mt-2 w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errors.textValue
                      ? 'border-red-500 focus:ring-red-100'
                      : 'border-gray-300 focus:border-purple-500 focus:ring-purple-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
                  }`}
                  placeholder="输入需要展示的内容"
                />
                {errors.textValue && (
                  <p className="mt-1 text-xs text-red-500">{errors.textValue}</p>
                )}
              </div>
            )}

            {form.actionType === 'image' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center text-xs text-gray-500 transition-colors hover:border-purple-400 hover:text-purple-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    上传图片
                    <input
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={handleActionFileChange}
                    />
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">可选择多张图片，建议控制在 5MB 以内</p>
                </div>

                {form.imageItems.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {form.imageItems.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="relative flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800"
                      >
                        <button
                          type="button"
                          onClick={() => handleRemoveActionImage(index)}
                          className="absolute right-2 top-2 rounded-full bg-black/40 px-2 text-xs text-white hover:bg-black/60"
                          aria-label="移除图片"
                        >
                          x
                        </button>
                        <img
                          src={item.data}
                          alt={item.name || `图像 ${index + 1}`}
                          className="h-20 w-20 rounded-lg object-contain"
                        />
                        {item.name && (
                          <p className="w-full truncate text-center text-xs text-gray-500 dark:text-gray-400">
                            {item.name}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {errors.imageItems && (
                  <p className="text-xs text-red-500">{errors.imageItems}</p>
                )}
              </div>
            )}

            {form.actionType === 'barcode' && (
              <div className="space-y-4">
                <BarcodeInputList
                  values={form.barcodeValues}
                  onChange={(nextValues) => {
                    setForm(prev => ({ ...prev, barcodeValues: nextValues }))
                    if (errors.barcodeValues) {
                      setErrors(prev => ({ ...prev, barcodeValues: undefined }))
                    }
                  }}
                  error={errors.barcodeValues}
                  helperText={`点击“添加条形码”按钮可新增输入框。单条不超过 ${MAX_CODE39_LENGTH} 个字符。${getCode39HelperText()}。`}
                />

                {trimmedBarcodeEntries.length === 0 && form.barcodeItems?.length > 0 && (
                  <div className="grid gap-3 md:grid-cols-2">
                    {form.barcodeItems.map((item, index) => (
                      <div
                        key={`${item.data.slice(0, 20)}-${index}`}
                        className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <img
                          src={item.data}
                          alt={item.code || `条形码 ${index + 1}`}
                          className="w-full max-w-xs rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"
                        />
                        <p className="text-xs font-medium tracking-[0.18em] text-gray-700 dark:text-gray-200">
                          {item.code || `条形码 ${index + 1}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="col-span-full flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={!isValid || isSaving}
              className={`rounded-lg px-5 py-2 text-sm font-medium text-white transition-colors ${
                isValid
                  ? 'bg-purple-600 hover:bg-purple-500'
                  : 'cursor-not-allowed bg-purple-300'
              }`}
            >
              {isNew ? '创建' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HomeIconModal

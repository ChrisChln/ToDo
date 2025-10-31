import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { icons as lucideIcons } from 'lucide-react'
import { useSelector } from 'react-redux'
import IconPicker from './IconPicker'
import { createCode39Batch } from '../utils/barcode'
import BarcodeInputList from './BarcodeInputList'

function TodoModal({ isOpen, onClose, onSubmit, onDelete, categoryId, categoryName, todo }) {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  const iconOptions = useMemo(
    () => Object.keys(lucideIcons).filter(key => /^[A-Z]/.test(key)).sort((a, b) => a.localeCompare(b)),
  []
  )
  const [title, setTitle] = useState('')
  const [iconName, setIconName] = useState('ListTodo')
  const [accentColor, setAccentColor] = useState('#A78BFA')
  const [contentType, setContentType] = useState('link')
  const [linkValue, setLinkValue] = useState('')
  const [textValue, setTextValue] = useState('')
  const [imageItems, setImageItems] = useState([])
  const [barcodeValues, setBarcodeValues] = useState([''])
  const [errors, setErrors] = useState({})
  const [iconZoom, setIconZoom] = useState(1)
  const [showIconLibrary, setShowIconLibrary] = useState(false)
  const isEdit = !!todo

  const resetFields = () => {
    setTitle('')
    setIconName('ListTodo')
    setAccentColor('#A78BFA')
    setContentType('link')
    setLinkValue('')
    setTextValue('')
    setImageItems([])
    setBarcodeValues([''])
    setErrors({})
  }

  useEffect(() => {
    if (!isOpen) return

    if (todo) {
      setTitle(todo.title || '')
      setIconName(todo.iconName || 'ListTodo')
      setAccentColor(todo.accentColor || '#A78BFA')
      const validTypes = ['link', 'text', 'image', 'barcode']
      const resolvedType = validTypes.includes(todo.contentType) ? todo.contentType : (todo.link ? 'link' : 'text')
      setContentType(resolvedType)
      setLinkValue(resolvedType === 'link' ? (todo.contentValue || todo.link || '') : '')
      setTextValue(resolvedType === 'text' ? (todo.contentValue || '') : '')
      if (resolvedType === 'image') {
        const values = Array.isArray(todo.contentValue)
          ? todo.contentValue.filter(item => typeof item === 'string' && item)
          : typeof todo.contentValue === 'string' && todo.contentValue
            ? [todo.contentValue]
            : []
        const metas = Array.isArray(todo.contentMeta)
          ? todo.contentMeta
          : typeof todo.contentMeta === 'string' && todo.contentMeta
            ? [todo.contentMeta]
            : []
        setImageItems(values.map((data, index) => ({ data, name: metas[index] || '' })))
      } else {
        setImageItems([])
      }
      if (resolvedType === 'barcode') {
        const metas = Array.isArray(todo.contentMeta)
          ? todo.contentMeta.filter(item => typeof item === 'string')
          : typeof todo.contentMeta === 'string' && todo.contentMeta
            ? [todo.contentMeta]
            : []
        setBarcodeValues(metas.length ? metas : [''])
      } else {
        setBarcodeValues([''])
      }
      setErrors({})
    } else {
      resetFields()
    }
  }, [isOpen, todo])

  if (!isOpen) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    if (!categoryId) return

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setErrors(prev => ({ ...prev, title: '请输入名称' }))
      return
    }

    let contentValue = ''
    let contentMeta = ''
    let link = ''

    if (contentType === 'link') {
      const value = linkValue.trim()
      if (!value) {
        setErrors(prev => ({ ...prev, linkValue: '请输入链接地址' }))
        return
      }
      contentValue = value
      link = value
    } else if (contentType === 'text') {
      const value = textValue.trim()
      if (!value) {
        setErrors(prev => ({ ...prev, textValue: '请输入文本内容' }))
        return
      }
      contentValue = value
    } else if (contentType === 'image') {
      if (imageItems.length === 0) {
        setErrors(prev => ({ ...prev, imageItems: '请上传图片' }))
        return
      }
      contentValue = imageItems.map(item => item.data)
      contentMeta = imageItems.map(item => item.name)
    } else if (contentType === 'barcode') {
      const entries = barcodeValues.map(item => item.trim()).filter(Boolean)
      if (!entries.length) {
        setErrors(prev => ({ ...prev, barcodeInput: '请至少输入一个条形码内容' }))
        return
      }
      const batch = createCode39Batch(entries.join('\n'), { backgroundColor: '#FFFFFF', barColor: '#0F172A' }, { includeErrors: true })
      if (batch.errors.length && batch.codes.length === 0) {
        setErrors(prev => ({ ...prev, barcodeInput: batch.errors[0] }))
        return
      }
      if (batch.errors.length) {
        setErrors(prev => ({ ...prev, barcodeInput: batch.errors[0] }))
        return
      }
      if (batch.codes.length === 0) {
        setErrors(prev => ({ ...prev, barcodeInput: '无法生成条形码，请检查内容' }))
        return
      }
      contentValue = batch.codes.map(item => item.dataUrl)
      contentMeta = batch.codes.map(item => item.value)
    }

    const payload = {
      id: todo?.id || `t${Date.now()}`,
      title: trimmedTitle,
      categoryId,
      status: todo?.status || 'incomplete',
      createdAt: todo?.createdAt || new Date().toISOString().split('T')[0],
      iconName,
      accentColor,
      link,
      contentType,
      contentValue,
      contentMeta,
    }

    onSubmit(payload, isEdit ? 'edit' : 'create')

    resetFields()
    onClose()
  }

  const handleContentTypeChange = (type) => {
    if (!['link', 'text', 'image', 'barcode'].includes(type)) return
    setContentType(type)
    setErrors(prev => ({
      ...prev,
      linkValue: undefined,
      textValue: undefined,
      imageItems: undefined,
      barcodeInput: undefined,
    }))
    if (type === 'barcode' && barcodeValues.length === 0) {
      setBarcodeValues([''])
    }
  }

  const readFileAsDataURL = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsDataURL(file)
    })

  const handleImageUpload = async (event) => {
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
      setImageItems(prev => [...prev, ...validItems.map(item => ({ data: item.data, name: item.name }))])
      setErrors(prev => ({ ...prev, imageItems: errorsFound.length ? errorsFound[0] : undefined }))
    }

    event.target.value = ''
  }

  const handleRemoveImageItem = (index) => {
    setImageItems(prev => {
      const next = prev.filter((_, itemIndex) => itemIndex !== index)
      if (next.length === 0) {
        setErrors(previous => ({ ...previous, imageItems: undefined }))
      }
      return next
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-lg rounded-custom shadow-custom p-6 transition-colors ${
        isDark ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {isEdit ? '编辑子列表' : '添加子列表'}
            </h3>
            {categoryName && (
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                当前分类：{categoryName}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              resetFields()
              onClose()
            }}
            className={`p-1 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
            }`}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              名称
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                if (errors.title) {
                  setErrors(prev => ({ ...prev, title: undefined }))
                }
              }}
              className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                isDark
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              } focus:outline-none`}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = primaryColor
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = ''
              }}
              placeholder="请输入子列表名称"
              autoFocus
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-500">{errors.title}</p>
            )}
          </div>

          <div>
            <p className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              内容类型
            </p>
            <div className="flex gap-3">
              {['link', 'text', 'image', 'barcode'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleContentTypeChange(type)}
                  className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    contentType === type
                      ? 'text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  style={contentType === type ? {
                    backgroundColor: primaryColor
                  } : {}}
                >
                  {type === 'link'
                    ? '打开链接'
                    : type === 'text'
                      ? '展示文本'
                      : type === 'image'
                        ? '预览图片'
                        : '条形码'}
                </button>
              ))}
            </div>
          </div>

          {contentType === 'link' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                链接地址
              </label>
              <input
                type="text"
                value={linkValue}
                onChange={(event) => {
                  setLinkValue(event.target.value)
                  if (errors.linkValue) {
                    setErrors(prev => ({ ...prev, linkValue: undefined }))
                  }
                }}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
                } focus:outline-none`}
                placeholder="https://example.com"
              />
              {errors.linkValue && (
                <p className="mt-1 text-xs text-red-500">{errors.linkValue}</p>
              )}
            </div>
          )}

          {contentType === 'text' && (
            <div>
              <label className={`block text-sm font-medium mb-2 ${
                isDark ? 'text-gray-300' : 'text-gray-700'
              }`}>
                文本内容
              </label>
              <textarea
                value={textValue}
                onChange={(event) => {
                  setTextValue(event.target.value)
                  if (errors.textValue) {
                    setErrors(prev => ({ ...prev, textValue: undefined }))
                  }
                }}
                rows={5}
                className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
                } focus:outline-none`}
                placeholder="输入需要记录的内容"
              />
              {errors.textValue && (
                <p className="mt-1 text-xs text-red-500">{errors.textValue}</p>
              )}
            </div>
          )}

          {contentType === 'image' && (
            <div className="space-y-4">
              <label className={`block text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                上传图片
              </label>
              <div className="flex items-center gap-3">
                <label className={`flex h-24 w-24 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed ${
                  isDark ? 'border-gray-600 bg-gray-700 text-gray-300' : 'border-gray-300 bg-gray-100 text-gray-600'
                } text-xs transition-colors`}>
                  选择图片
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                <p className="text-xs text-gray-500">可一次选择多张图片，单张不超过 5MB</p>
              </div>

              {imageItems.length > 0 && (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                  {imageItems.map((item, index) => (
                    <div
                      key={`${item.name}-${index}`}
                      className={`relative flex flex-col items-center gap-2 rounded-xl border ${isDark ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'} p-3 shadow-sm`}
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveImageItem(index)}
                        className="absolute right-2 top-2 rounded-full bg-black/40 px-2 text-xs text-white hover:bg-black/60"
                        aria-label="移除图片"
                      >
                        x
                      </button>
                      <img src={item.data} alt={item.name || `图片 ${index + 1}`} className="h-16 w-16 rounded-lg object-contain" />
                      {item.name && (
                        <p className="w-full truncate text-center text-xs text-gray-500">{item.name}</p>
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

          {contentType === 'barcode' && (
            <BarcodeInputList
              values={barcodeValues}
              onChange={(nextValues) => {
                setBarcodeValues(nextValues)
                if (errors.barcodeInput) {
                  setErrors(prev => ({ ...prev, barcodeInput: undefined }))
                }
              }}
              error={errors.barcodeInput}
            />
          )}

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              图标
            </label>
            <div className="mb-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowIconLibrary(prev => !prev)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >
                {showIconLibrary ? '隐藏图标库' : '显示图标库'}
              </button>
              <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>缩放</span>
              <input
                type="range"
                min={0.8}
                max={1.6}
                step={0.1}
                value={iconZoom}
                onChange={(e) => setIconZoom(parseFloat(e.target.value) || 1)}
                className="w-40"
              />
              <span className={`text-xs tabular-nums ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{Math.round(iconZoom*100)}%</span>
            </div>
            {showIconLibrary && (
              <IconPicker icons={iconOptions} value={iconName} onChange={setIconName} scale={iconZoom} />
            )}
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              颜色
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={accentColor}
                onChange={(event) => setAccentColor(event.target.value)}
                className="h-10 w-20 cursor-pointer rounded-lg border-2 border-gray-300 bg-transparent transition-colors"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = primaryColor
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = ''
                }}
              />
              <input
                type="text"
                value={accentColor}
                onChange={(event) => {
                  const value = event.target.value.trim()
                  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    setAccentColor(value)
                  }
                }}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-purple-500'
                    : 'bg-white border-gray-300 text-gray-900 focus:border-purple-500'
                }`}
                placeholder="#A78BFA"
              />
              <div
                className="h-10 w-10 rounded-lg border-2 border-gray-300"
                style={{ backgroundColor: accentColor }}
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {['#A78BFA', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#8B5CF6', '#6366F1'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  className={`h-8 w-8 rounded-lg border-2 transition-all ${
                    accentColor === color ? 'border-gray-900 scale-110' : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

         <div className="flex gap-3">
            {isEdit && (
              <button
                type="button"
                onClick={() => {
                  onDelete?.(todo)
                  resetFields()
                  onClose()
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDark
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                删除
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                resetFields()
                onClose()
              }}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors"
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
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TodoModal

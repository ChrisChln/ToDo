import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { setPrimaryColor } from '../store/slices/themeSlice'
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import BarcodeGenerator from './BarcodeGenerator'
import EwhCalculator from './EwhCalculator'

function ToolModal({ isOpen, toolId, onClose }) {
  const dispatch = useDispatch()
  const isDark = useSelector(state => state.theme?.isDark || false)
  const primaryColor = useSelector(state => state.theme?.primaryColor || '#A78BFA')
  const currentUserId = useSelector(state => state.auth?.user?.sub || null)
  const [collapsedTools, setCollapsedTools] = useState({
    theme: false,
    barcode: false,
    ewh: false,
    backup: false,
  })
  const [showSaveMessage, setShowSaveMessage] = useState(false)
  const [importResult, setImportResult] = useState(null)

  // 根据传入的 toolId 设置对应工具的展开状态
  useEffect(() => {
    if (toolId && isOpen) {
      setCollapsedTools({
        theme: toolId === 'theme' ? false : true,
        barcode: toolId === 'barcode' ? false : true,
        ewh: toolId === 'ewh' ? false : true,
        backup: toolId === 'backup' ? false : true,
      })
    }
  }, [toolId, isOpen])

  if (!isOpen) return null

  const toggleTool = (id) => {
    setCollapsedTools(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  const handleColorChange = (color) => {
    dispatch(setPrimaryColor(color))
    setShowSaveMessage(true)
    setTimeout(() => setShowSaveMessage(false), 2000)
  }

  const exportLocalData = () => {
    try {
      const all = {}
      const allow = /^(todos|calendar|theme|share|home|restDays)(_.+)?$/
      for (let i = 0; i < localStorage.length; i += 1) {
        const key = localStorage.key(i)
        if (allow.test(key)) {
          all[key] = localStorage.getItem(key)
        }
      }
      const explicitKeys = ['home', 'todos', 'calendar', 'theme', 'share', 'restDays']
      explicitKeys.forEach((base) => {
        const k1 = base
        const k2 = currentUserId ? `${base}_${currentUserId}` : null
        const v1 = localStorage.getItem(k1)
        const v2 = k2 ? localStorage.getItem(k2) : null
        if (v1 && !(k1 in all)) all[k1] = v1
        if (v2 && !(k2 in all)) all[k2] = v2
      })
      const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const date = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
      a.download = `todo-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('导出失败', err)
    }
  }

  const importLocalData = async (file) => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      let restored = 0
      const allow = /^(todos|calendar|theme|share|home|restDays)(?:_(.+))?$/
      Object.keys(data).forEach((k) => {
        if (typeof data[k] === 'string') {
          const match = k.match(allow)
          if (!match) return
          const base = match[1]
          const targetKey = currentUserId ? `${base}_${currentUserId}` : base
          localStorage.setItem(targetKey, data[k])
          restored += 1
        }
      })
      setImportResult({ ok: true, count: restored })
      setTimeout(() => setImportResult(null), 2500)
    } catch (err) {
      console.error('导入失败', err)
      setImportResult({ ok: false, error: String(err) })
      setTimeout(() => setImportResult(null), 4000)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-6" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="mx-auto my-6 w-full max-w-4xl max-h-[92vh] overflow-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900 flex flex-col" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            工具
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!toolId && (
            <div className={`rounded-2xl border p-6 text-center ${isDark ? 'border-gray-800 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'}`}>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                请选择一个工具
              </p>
            </div>
          )}

          {toolId === 'theme' && (
            <div
              className={`rounded-2xl border transition-colors ${
                isDark ? 'border-gray-800 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              <button
                onClick={() => toggleTool('theme')}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h2 className="text-xl font-semibold">主题色设置</h2>
                {collapsedTools.theme ? (
                  <ChevronDown className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                ) : (
                  <ChevronUp className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                )}
              </button>
              {!collapsedTools.theme && (
                <div className="px-6 pb-6">
                  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    选择您喜欢的主题色，这将应用到整个应用的按钮、链接和强调元素。颜色会自动保存。
                  </p>
                  
                  {showSaveMessage && (
                    <div className={`mb-4 flex items-center gap-2 rounded-lg p-3 ${
                      isDark ? 'bg-green-900/30 text-green-300 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200'
                    }`}>
                      <Check size={16} />
                      <span className="text-sm font-medium">主题色已保存</span>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <label className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        主题色：
                      </label>
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(event) => handleColorChange(event.target.value)}
                        className="h-10 w-20 cursor-pointer rounded-lg border-2 border-gray-300 bg-transparent transition-colors"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(event) => {
                          const value = event.target.value.trim()
                          if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                            handleColorChange(value)
                          }
                        }}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="#A78BFA"
                      />
                      <div
                        className="h-10 w-10 rounded-lg border-2 border-gray-300"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </div>
                    
                    <div>
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>预设颜色：</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { name: '紫色', value: '#A78BFA' },
                          { name: '蓝色', value: '#3B82F6' },
                          { name: '绿色', value: '#10B981' },
                          { name: '橙色', value: '#F59E0B' },
                          { name: '红色', value: '#EF4444' },
                          { name: '粉色', value: '#EC4899' },
                          { name: '靛蓝', value: '#6366F1' },
                          { name: '青色', value: '#06B6D4' },
                        ].map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => handleColorChange(color.value)}
                            className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ${
                              primaryColor === color.value
                                ? 'border-gray-900 scale-105'
                                : isDark
                                  ? 'border-gray-600 hover:border-gray-500'
                                  : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div
                              className="h-5 w-5 rounded"
                              style={{ backgroundColor: color.value }}
                            />
                            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                              {color.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {toolId === 'barcode' && (
            <div
              className={`rounded-2xl border transition-colors ${
                isDark ? 'border-gray-800 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              <button
                onClick={() => toggleTool('barcode')}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h2 className="text-xl font-semibold">条码生成器</h2>
                {collapsedTools.barcode ? (
                  <ChevronDown className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                ) : (
                  <ChevronUp className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                )}
              </button>
              {!collapsedTools.barcode && (
                <div className="px-6 pb-6">
                  <BarcodeGenerator />
                </div>
              )}
            </div>
          )}

          {toolId === 'ewh' && (
            <div
              className={`rounded-2xl border transition-colors ${
                isDark ? 'border-gray-800 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              <button
                onClick={() => toggleTool('ewh')}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h2 className="text-xl font-semibold">EWH 计算器</h2>
                {collapsedTools.ewh ? (
                  <ChevronDown className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                ) : (
                  <ChevronUp className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                )}
              </button>
              {!collapsedTools.ewh && (
                <div className="px-6 pb-6">
                  <EwhCalculator />
                </div>
              )}
            </div>
          )}

          {toolId === 'backup' && (
            <div
              className={`rounded-2xl border transition-colors ${
                isDark ? 'border-gray-800 bg-gray-800 text-gray-100' : 'border-gray-200 bg-white text-gray-900'
              }`}
            >
              <button
                onClick={() => toggleTool('backup')}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <h2 className="text-xl font-semibold">数据备份</h2>
                {collapsedTools.backup ? (
                  <ChevronDown className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                ) : (
                  <ChevronUp className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`} size={20} />
                )}
              </button>
              {!collapsedTools.backup && (
                <div className="px-6 pb-6 space-y-4">
                  {importResult && (
                    <div className={`flex items-center gap-2 rounded-lg p-3 text-sm border ${importResult.ok
                      ? (isDark ? 'bg-green-900/30 text-green-300 border-green-700' : 'bg-green-50 text-green-700 border-green-200')
                      : (isDark ? 'bg-red-900/30 text-red-300 border-red-700' : 'bg-red-50 text-red-700 border-red-200')
                    }`}>
                      {importResult.ok ? '导入完成：' + importResult.count + ' 条记录' : '导入失败：' + importResult.error}
                    </div>
                  )}

                  <div className="text-sm">
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>在切换端口或设备前，先导出备份；迁移后再导入即可恢复。</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={exportLocalData}
                      className={`rounded-lg px-4 py-2 text-sm font-medium text-white`}
                      style={{ backgroundColor: primaryColor }}
                    >
                      导出备份（JSON）
                    </button>

                    <label
                      className={`rounded-lg px-4 py-2 text-sm font-medium cursor-pointer ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'} border`}
                      style={{ borderColor: isDark ? '#4B5563' : '#E5E7EB' }}
                    >
                      导入备份
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) importLocalData(f)
                          e.target.value = ''
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => { localStorage.clear(); setImportResult({ ok: true, count: 0 }); setTimeout(() => setImportResult(null), 1500) }}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${isDark ? 'text-red-300 border-red-700' : 'text-red-600 border-red-300'} border`}
                    >
                      清空本地数据
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ToolModal


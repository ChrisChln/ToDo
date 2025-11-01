import { useMemo, useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { MAX_CODE39_LENGTH, createCode39Batch, getCode39HelperText } from '../utils/barcode'

function BarcodeGenerator() {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const [inputValue, setInputValue] = useState('HELLO')
  const [selectedIndices, setSelectedIndices] = useState(new Set())
  const [isPrintMode, setIsPrintMode] = useState(false)

  const batchResult = useMemo(() => {
    if (!inputValue.trim()) {
      return {
        codes: [],
        errors: ['请输入要生成条形码的内容'],
      }
    }
    return createCode39Batch(
      inputValue,
      {
        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
        barColor: isDark ? '#F8FAFC' : '#0F172A',
      },
      { includeErrors: true },
    )
  }, [inputValue, isDark])

  const helperText = getCode39HelperText()
  const backgroundClass = isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
  const labelClass = isDark ? 'text-gray-300' : 'text-gray-700'
  const helperTextClass = isDark ? 'text-gray-400' : 'text-gray-500'

  // 当条形码列表变化时，重置选中状态
  useEffect(() => {
    setSelectedIndices(new Set())
  }, [batchResult.codes.length])

  const handleToggleSelect = (index) => {
    setSelectedIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    if (selectedIndices.size === batchResult.codes.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(batchResult.codes.map((_, i) => i)))
    }
  }

  const handlePrint = () => {
    if (selectedIndices.size === 0) {
      alert('请至少选择一个条形码')
      return
    }
    setIsPrintMode(true)
    setTimeout(() => {
      const images = document.querySelectorAll('.barcode-generator-print-image')
      let loadedCount = 0
      const totalImages = images.length
      
      if (totalImages === 0) {
        window.print()
        setTimeout(() => setIsPrintMode(false), 500)
        return
      }
      
      const checkAllLoaded = () => {
        loadedCount++
        if (loadedCount >= totalImages) {
          setTimeout(() => {
            window.print()
            setTimeout(() => setIsPrintMode(false), 500)
          }, 100)
        }
      }
      
      images.forEach((img) => {
        if (img.complete) {
          checkAllLoaded()
        } else {
          img.onload = checkAllLoaded
          img.onerror = checkAllLoaded
        }
      })
      
      if (Array.from(images).every(img => img.complete)) {
        setTimeout(() => {
          window.print()
          setTimeout(() => setIsPrintMode(false), 500)
        }, 100)
      }
    }, 300)
  }

  // 获取选中的条形码
  const selectedBarcodes = Array.from(selectedIndices)
    .map(i => batchResult.codes[i])
    .filter(Boolean)

  return (
    <div className={`rounded-2xl border p-6 print-container ${backgroundClass} ${isPrintMode ? 'print-mode bg-white' : ''}`}>
      <div className={`print-content ${isPrintMode ? 'bg-white' : ''}`}>
        <div className={`print-header ${isPrintMode ? 'hidden' : ''}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            条码生成器（Code 128）
          </h2>
          <p className={`text-sm mb-4 ${helperTextClass}`}>
            支持所有 ASCII 可打印字符。系统会自动添加起止码、校验位并生成可扫描的 Code 128 条形码。
          </p>
        </div>

        {!isPrintMode && (
          <>
            <label className={`block text-sm font-medium mb-2 ${labelClass}`} htmlFor="barcode-input">
              内容
            </label>
            <textarea
              id="barcode-input"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder="每行一个内容，按 Enter 换列"
              rows={4}
              className={`w-full rounded-lg border px-4 py-2 text-sm focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-gray-900 border-gray-700 text-white focus:ring-purple-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-200'
              }`}
              autoComplete="off"
            />
            <p className={`mt-2 text-xs ${helperTextClass}`}>
              按 Enter 换行，每行生成一个条形码。{helperText}。单条长度不超过 {MAX_CODE39_LENGTH} 个字符。
            </p>

            {batchResult.errors.length > 0 && (
              <div className="mt-4 space-y-1">
                {batchResult.errors.map((error, index) => (
                  <p key={index} className="text-sm text-red-500">
                    {error}
                  </p>
                ))}
              </div>
            )}

            {batchResult.codes.length > 0 && (
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`rounded-lg px-3 py-1 text-sm transition-colors ${
                    isDark
                      ? 'text-gray-400 hover:bg-gray-700'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {selectedIndices.size === batchResult.codes.length ? '取消全选' : '全选'}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={selectedIndices.size === 0}
                  className={`rounded-lg px-4 py-1 text-sm font-medium transition-colors ${
                    selectedIndices.size === 0
                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  打印 ({selectedIndices.size})
                </button>
              </div>
            )}
          </>
        )}

        <div className={`print-body ${isPrintMode ? 'print-body-mode' : 'mt-6'}`}>
          {isPrintMode ? (
            // 打印模式：显示选中的条形码
            selectedBarcodes.length > 0 ? (
              <div className="print-grid">
                {selectedBarcodes.map((item, idx) => (
                  <div key={`print-barcode-${idx}`} className="print-barcode-item">
                    <div className="print-barcode-image-container">
                      <img
                        src={item.dataUrl}
                        alt={item.value}
                        className="print-barcode-image barcode-generator-print-image"
                      />
                    </div>
                    <p className="print-barcode-text">{item.value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm">请选择要打印的条形码</p>
            )
          ) : (
            // 正常模式：显示所有条形码，带选择功能
            <div className="grid gap-6 md:grid-cols-2">
              {batchResult.codes.map((item, index) => (
                <div
                  key={item.value}
                  className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-xl border border-dashed border-gray-300 p-4 flex flex-col items-center gap-3`}
                >
                  <img
                    src={item.dataUrl}
                    alt={`内容为 ${item.value} 的条形码`}
                    className="w-full max-w-xs rounded-lg border border-gray-200 bg-white p-4"
                  />
                  <p className={`text-sm font-medium tracking-[0.15em] text-center ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {item.value}
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(index)}
                        onChange={() => handleToggleSelect(index)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        打印
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BarcodeGenerator

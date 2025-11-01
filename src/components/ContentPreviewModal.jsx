import { useEffect, useMemo, useState } from 'react'

function ContentPreviewModal({ isOpen, type, title, value, meta, onClose, isDark, hideBarcodeText, barcodeDisplayText, barcodeHideText, barcodeDisplayTexts }) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedIndices, setSelectedIndices] = useState(new Set())
  const [isPrintMode, setIsPrintMode] = useState(false)

  const images = useMemo(() => {
    if (!Array.isArray(value)) {
      return typeof value === 'string' && value ? [value] : []
    }
    return value.filter(item => typeof item === 'string' && item)
  }, [value])

  const imageNames = useMemo(() => {
    if (type === 'barcode') {
      // 优先使用新的数组格式，兼容旧的单个值格式
      const hideTextArray = Array.isArray(barcodeHideText) 
        ? barcodeHideText 
        : hideBarcodeText 
          ? Array(images.length).fill(true)
          : Array(images.length).fill(false)
      
      const displayTextsArray = Array.isArray(barcodeDisplayTexts)
        ? barcodeDisplayTexts
        : barcodeDisplayText
          ? Array(images.length).fill(barcodeDisplayText)
          : Array(images.length).fill('')
      
      // 为每个条形码生成显示文本
      return images.map((_, index) => {
        const shouldHide = hideTextArray[index] || false
        if (shouldHide) {
          const displayText = (displayTextsArray[index] || '').trim() || title || ''
          return displayText
        }
        // 如果不隐藏，使用原始内容
        if (!Array.isArray(meta)) {
          return typeof meta === 'string' && meta ? meta : ''
        }
        return meta[index] || ''
      })
    }
    if (!Array.isArray(meta)) {
      return typeof meta === 'string' && meta ? [meta] : []
    }
    return meta.filter(item => typeof item === 'string')
  }, [meta, type, hideBarcodeText, barcodeDisplayText, barcodeHideText, barcodeDisplayTexts, title, images])

  const isBarcodePreview = type === 'barcode'
  const isGalleryPreview = type === 'image' || isBarcodePreview

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0)
      setSelectedIndices(new Set())
      setIsPrintMode(false)
      return
    }
    if (isGalleryPreview) {
      setCurrentIndex(prev => {
        if (!images.length) return 0
        return Math.min(prev, images.length - 1)
      })
      // 初始化时不选中任何条形码（默认不打印）
      if (isBarcodePreview) {
        setSelectedIndices(new Set())
      }
    } else {
      setCurrentIndex(0)
    }
  }, [isOpen, isGalleryPreview, images, isBarcodePreview])

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
    if (selectedIndices.size === images.length) {
      setSelectedIndices(new Set())
    } else {
      setSelectedIndices(new Set(images.map((_, i) => i)))
    }
  }

  const handlePrint = () => {
    if (selectedIndices.size === 0) {
      alert('请至少选择一个条形码')
      return
    }
    console.log('Printing barcodes:', selectedImages.length)
    setIsPrintMode(true)
    // 使用 setTimeout 确保 DOM 更新后再打印
    setTimeout(() => {
      // 确保所有图片都已加载
      const images = document.querySelectorAll('.print-barcode-image')
      let loadedCount = 0
      const totalImages = images.length
      
      if (totalImages === 0) {
        console.warn('No images found for printing')
        window.print()
        setTimeout(() => setIsPrintMode(false), 500)
        return
      }
      
      const checkAllLoaded = () => {
        loadedCount++
        if (loadedCount >= totalImages) {
          // 所有图片加载完成后再打印
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
          img.onerror = checkAllLoaded // 即使出错也继续
        }
      })
      
      // 如果所有图片已经加载完成
      if (Array.from(images).every(img => img.complete)) {
        setTimeout(() => {
          window.print()
          setTimeout(() => setIsPrintMode(false), 500)
        }, 100)
      }
    }, 300)
  }

  if (!isOpen && !isPrintMode) return null

  const headingClass = isDark ? 'text-gray-100' : 'text-gray-900'
  const textClass = isDark ? 'text-gray-200' : 'text-gray-700'
  const backdropClass = isDark ? 'bg-gray-900/90' : 'bg-white'
  const borderClass = isDark ? 'border-gray-700' : 'border-gray-200'
  const actionButtonClass = isDark
    ? 'text-gray-400 hover:bg-gray-800'
    : 'text-gray-500 hover:bg-gray-100'
  const imageFrameClass = isDark
    ? 'border-gray-700 bg-gray-900'
    : 'border-gray-200 bg-gray-50'
  const textFrameClass = isDark
    ? 'border-gray-700 bg-gray-900'
    : 'border-gray-100 bg-gray-50'
  const previewLabel = isBarcodePreview ? '条形码预览' : type === 'image' ? '图片预览' : '文本内容'

  // 获取选中的条形码数据
  const selectedImages = Array.from(selectedIndices).map(i => ({
    src: images[i],
    name: imageNames[i] || '',
    index: i
  })).sort((a, b) => a.index - b.index)

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 py-6 print-container ${isPrintMode ? 'print-mode bg-white' : 'bg-black/60'}`}>
      <div className={`w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl print-content ${isPrintMode ? 'bg-white' : backdropClass} ${isPrintMode ? 'print-modal' : ''}`}>
        <div className={`flex items-center justify-between border-b px-6 py-4 print-header ${borderClass}`}>
          <div>
            <h3 className={`text-lg font-semibold ${headingClass}`}>{title || '预览'}</h3>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
              {previewLabel}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isBarcodePreview && images.length > 0 && !isPrintMode && (
              <>
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className={`rounded-lg px-3 py-1 text-sm transition-colors ${actionButtonClass}`}
                >
                  {selectedIndices.size === images.length ? '取消全选' : '全选'}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={selectedIndices.size === 0}
                  className={`rounded-lg px-3 py-1 text-sm font-medium transition-colors ${
                    selectedIndices.size === 0
                      ? 'opacity-50 cursor-not-allowed text-gray-400'
                      : isDark
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  打印 ({selectedIndices.size})
                </button>
              </>
            )}
            {!isPrintMode && (
              <button
                type="button"
                onClick={onClose}
                className={`rounded-lg px-3 py-1 text-sm transition-colors ${actionButtonClass}`}
              >
                关闭
              </button>
            )}
          </div>
        </div>

        <div className={`max-h-[70vh] overflow-auto px-6 py-5 print-body ${isPrintMode ? 'print-body-mode' : ''}`}>
          {isPrintMode ? (
            // 打印模式：显示所有选中的条形码
            isBarcodePreview && selectedImages.length > 0 ? (
              <div className="print-grid">
                {selectedImages.map((item, idx) => (
                  <div key={`print-barcode-${item.index}`} className="print-barcode-item">
                    <div className="print-barcode-image-container">
                      <img
                        src={item.src}
                        alt={item.name || `条形码 ${item.index + 1}`}
                        className="print-barcode-image"
                        onLoad={() => {
                          // 确保图片加载完成
                          console.log('Barcode image loaded:', item.index)
                        }}
                        onError={(e) => {
                          console.error('Barcode image error:', item.index, e)
                        }}
                      />
                    </div>
                    {item.name.trim() && (
                      <p className="print-barcode-text">{item.name}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-center text-sm ${textClass}`}>请选择要打印的条形码</p>
            )
          ) : isGalleryPreview ? (
            images.length ? (
              <div className="flex flex-col items-center gap-4">
                <div className={`relative flex items-center justify-center rounded-xl border border-dashed p-4 ${imageFrameClass}`}>
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrentIndex(prev => (prev - 1 + images.length) % images.length)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 px-2 py-1 text-sm text-white hover:bg-black/50"
                        aria-label="上一张"
                      >
                        &lt;
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentIndex(prev => (prev + 1) % images.length)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/30 px-2 py-1 text-sm text-white hover:bg-black/50"
                        aria-label="下一张"
                      >
                        &gt;
                      </button>
                    </>
                  )}
                  <img
                    src={images[currentIndex]}
                    alt={
                      isBarcodePreview
                        ? `内容为 ${(imageNames[currentIndex] || '').trim() || title || '条形码'} 的预览`
                        : title || imageNames[currentIndex] || '预览图片'
                    }
                    className={`max-h-[480px] max-w-full rounded-lg object-contain ${isBarcodePreview ? 'bg-white p-4 dark:bg-gray-900' : ''}`}
                  />
                </div>
                {isBarcodePreview && (
                  <div className="w-full">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIndices.has(currentIndex)}
                        onChange={() => handleToggleSelect(currentIndex)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className={`text-sm ${textClass}`}>打印</span>
                    </label>
                  </div>
                )}
                {(imageNames[currentIndex] || '').trim() !== '' && (
                  <p className={`text-xs ${textClass}`}>
                    {!isBarcodePreview && '文件名：'}
                    {imageNames[currentIndex]}
                  </p>
                )}
                {images.length > 1 && (
                  <p className={`text-xs ${textClass}`}>
                    {currentIndex + 1} / {images.length}
                  </p>
                )}
              </div>
            ) : (
              <p className={`text-center text-sm ${textClass}`}>暂无可预览的图片。</p>
            )
          ) : (
            <pre className={`whitespace-pre-wrap break-words rounded-xl border p-4 text-sm ${textClass} ${textFrameClass}`}>
              {value || '暂无内容'}
            </pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default ContentPreviewModal

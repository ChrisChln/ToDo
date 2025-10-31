import { useEffect, useMemo, useState } from 'react'

function ContentPreviewModal({ isOpen, type, title, value, meta, onClose, isDark }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const images = useMemo(() => {
    if (!Array.isArray(value)) {
      return typeof value === 'string' && value ? [value] : []
    }
    return value.filter(item => typeof item === 'string' && item)
  }, [value])

  const imageNames = useMemo(() => {
    if (!Array.isArray(meta)) {
      return typeof meta === 'string' && meta ? [meta] : []
    }
    return meta.filter(item => typeof item === 'string')
  }, [meta])

  const isBarcodePreview = type === 'barcode'
  const isGalleryPreview = type === 'image' || isBarcodePreview

  useEffect(() => {
    if (!isOpen) {
      setCurrentIndex(0)
      return
    }
    if (isGalleryPreview) {
      setCurrentIndex(prev => {
        if (!images.length) return 0
        return Math.min(prev, images.length - 1)
      })
    } else {
      setCurrentIndex(0)
    }
  }, [isOpen, isGalleryPreview, images])

  if (!isOpen) return null

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className={`w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl ${backdropClass}`}>
        <div className={`flex items-center justify-between border-b px-6 py-4 ${borderClass}`}>
          <div>
            <h3 className={`text-lg font-semibold ${headingClass}`}>{title || '预览'}</h3>
            <p className="text-xs text-gray-400 mt-1 uppercase tracking-wide">
              {previewLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-3 py-1 text-sm transition-colors ${actionButtonClass}`}
          >
            关闭
          </button>
        </div>

        <div className="max-h-[70vh] overflow-auto px-6 py-5">
          {isGalleryPreview ? (
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
                {(imageNames[currentIndex] || '').trim() !== '' && (
                  <p className={`text-xs ${textClass}`}>
                    {isBarcodePreview ? '内容：' : '文件名：'}
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

import { useMemo } from 'react'
import { createCode39Batch, getCode39HelperText, MAX_CODE39_LENGTH } from '../utils/barcode'

function BarcodeInputList({
  values,
  onChange,
  error = '',
  label = '条形码内容',
  placeholder = '例如：ABC123',
  addButtonLabel = '添加条形码',
  helperText,
}) {
  const safeValues = useMemo(() => {
    if (Array.isArray(values) && values.length) {
      return values
    }
    return ['']
  }, [values])

  const resolvedHelperText = helperText || `支持数字、英文与常见符号。单条最长 ${MAX_CODE39_LENGTH} 个字符。${getCode39HelperText()}。`

  const preview = useMemo(() => {
    const trimmedEntries = safeValues.map(item => (item || '').trim()).filter(Boolean)
    if (!trimmedEntries.length) {
      return { codes: [], errors: [] }
    }
    return createCode39Batch(
      trimmedEntries.join('\n'),
      {
        backgroundColor: '#FFFFFF',
        barColor: '#111827',
      },
      { includeErrors: true },
    )
  }, [safeValues])

  const hasInput = safeValues.some(item => (item || '').trim())

  const updateValue = (index, nextValue) => {
    const next = [...safeValues]
    next[index] = nextValue
    onChange(next)
  }

  const addField = () => {
    onChange([...safeValues, ''])
  }

  const removeField = (index) => {
    if (safeValues.length === 1) {
      onChange([''])
      return
    }
    const next = safeValues.filter((_, itemIndex) => itemIndex !== index)
    onChange(next.length ? next : [''])
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          {label}
        </label>
        <div className="space-y-3">
          {safeValues.map((value, index) => (
            <div key={`barcode-field-${index}`} className="flex items-center gap-3">
              <input
                type="text"
                value={value}
                onChange={(event) => updateValue(index, event.target.value.toUpperCase())}
                className="flex-1 rounded-lg border px-3 py-2 text-sm transition-colors bg-white border-gray-300 text-gray-900 focus:border-purple-500 focus:outline-none dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100"
                placeholder={placeholder}
                maxLength={MAX_CODE39_LENGTH}
                autoComplete="off"
              />
              {safeValues.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeField(index)}
                  className="rounded-lg px-3 py-2 text-xs font-medium transition-colors bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  移除
                </button>
              )}
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={addField}
              className="rounded-lg bg-purple-500 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-600"
            >
              {addButtonLabel}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {resolvedHelperText}
            </p>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      </div>

      {hasInput && preview.errors.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-100">
          {preview.errors[0]}
        </div>
      )}

      {preview.codes.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {preview.codes.map((code) => (
            <div
              key={code.value}
              className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 dark:border-gray-600 dark:bg-gray-800"
            >
              <img
                src={code.dataUrl}
                alt={`内容为 ${code.value} 的条形码`}
                className="w-full max-w-xs rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900"
              />
              <p className="text-xs font-medium tracking-[0.2em] text-gray-700 dark:text-gray-200">
                {code.value}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BarcodeInputList

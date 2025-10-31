import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { MAX_CODE39_LENGTH, createCode39Batch, getCode39HelperText } from '../utils/barcode'

function BarcodeGenerator() {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const [inputValue, setInputValue] = useState('HELLO')

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

  return (
    <div className={`rounded-2xl border p-6 ${backgroundClass}`}>
      <h2 className={`text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        条码生成器（Code 39）
      </h2>
      <p className={`text-sm mb-4 ${helperTextClass}`}>
        支持数字、英文与常见符号。系统会自动添加起止符号并生成可扫描的 Code 39 条形码。
      </p>

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

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        {batchResult.codes.map((item) => (
          <div
            key={item.value}
            className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-xl border border-dashed border-gray-300 p-4 flex flex-col items-center gap-3`}
          >
            <img
              src={item.dataUrl}
              alt={`内容为 ${item.value} 的条形码`}
              className="w-full max-w-xs rounded-lg border border-gray-200 bg-white p-4"
            />
            <p className={`text-sm font-medium tracking-[0.15em] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BarcodeGenerator

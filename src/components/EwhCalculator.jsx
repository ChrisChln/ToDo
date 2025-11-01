import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

const parseTime = (timeString) => {
  const [rawHour, rawMinute] = timeString.split(':').map(part => Number(part))
  if (
    Number.isNaN(rawHour) ||
    Number.isNaN(rawMinute) ||
    rawHour < 0 ||
    rawHour > 23 ||
    rawMinute < 0 ||
    rawMinute > 59
  ) {
    return null
  }
  return { hour: rawHour, minute: rawMinute }
}

const formatDuration = (start, end) => {
  if (!start || !end) return null
  const startParts = parseTime(start)
  const endParts = parseTime(end)
  if (!startParts || !endParts) {
    return { error: '请输入有效的时间（24 小时制，例如 09:00）' }
  }

  const today = new Date()
  const startDate = new Date(today)
  startDate.setHours(startParts.hour, startParts.minute, 0, 0)

  const endDateBase = new Date(today)
  endDateBase.setHours(endParts.hour, endParts.minute, 0, 0)

  const candidates = []

  if (endDateBase.getTime() >= startDate.getTime()) {
    candidates.push(endDateBase)
  }

  if (endParts.hour < 12) {
    const afternoon = new Date(endDateBase)
    afternoon.setHours(endParts.hour + 12, endParts.minute, 0, 0)
    if (afternoon.getTime() >= startDate.getTime()) {
      candidates.push(afternoon)
    }
  }

  const nextDay = new Date(endDateBase)
  nextDay.setDate(nextDay.getDate() + 1)
  if (nextDay.getTime() >= startDate.getTime()) {
    candidates.push(nextDay)
  }

  if (candidates.length === 0) {
    return { error: '无法计算，请检查时间是否填写正确' }
  }

  const endDate = candidates.reduce((best, current) => {
    const bestDiff = best.getTime() - startDate.getTime()
    const currentDiff = current.getTime() - startDate.getTime()
    if (currentDiff < bestDiff) {
      return current
    }
    return best
  }, candidates[0])

  const diffMs = endDate.getTime() - startDate.getTime()
  if (diffMs < 0) {
    return { error: '结束时间不能早于开始时间' }
  }

  const diffMinutes = Math.round(diffMs / 60000)
  const hours = Math.floor(diffMinutes / 60)
  const minutes = diffMinutes % 60
  const diffHoursDecimal = diffMinutes / 60
  const lunchAdjustedMinutes = Math.max(0, diffMinutes - 30)
  const lunchAdjustedHours = lunchAdjustedMinutes / 60

  return {
    error: '',
    diffMinutes,
    hours,
    minutes,
    diffHoursDecimal,
    lunchAdjustedMinutes,
    lunchAdjustedHours,
  }
}

function EwhCalculator() {
  const isDark = useSelector(state => state.theme?.isDark || false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [accountingDuration, setAccountingDuration] = useState('')
  const [deductLunch, setDeductLunch] = useState(true)

  const result = useMemo(() => {
    return formatDuration(startTime, endTime)
  }, [startTime, endTime])

  const cardClass = isDark
    ? 'border-gray-800 bg-gray-800 text-gray-100'
    : 'border-gray-200 bg-white text-gray-900'
  const labelClass = isDark ? 'text-gray-300' : 'text-gray-700'
  const helperClass = isDark ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className={`rounded-2xl border p-6 ${cardClass}`}>
      <h2 className="text-xl font-semibold mb-4">EWH 计算器</h2>
      <p className={`text-sm ${helperClass} mb-6`}>
        输入开始与结束时间（24 小时制），系统将计算经过的总工时（Elapsed Working Hours）。若结束时间早于开始时间且小于 12 小时，将自动识别为下午时段。
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={`block text-sm font-medium mb-2 ${labelClass}`} htmlFor="ewh-start">
            开始时间
          </label>
          <input
            id="ewh-start"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              isDark
                ? 'bg-gray-900 border-gray-700 text-white focus:ring-purple-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-200'
            }`}
          />
        </div>
        <div>
          <label className={`block text-sm font-medium mb-2 ${labelClass}`} htmlFor="ewh-end">
            结束时间
          </label>
          <input
            id="ewh-end"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
              isDark
                ? 'bg-gray-900 border-gray-700 text-white focus:ring-purple-500'
                : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-200'
            }`}
          />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-gray-300 px-4 py-5 text-sm">
        {!startTime || !endTime ? (
          <p className={helperClass}>填写完整时间后将即时显示计算结果。</p>
        ) : result?.error ? (
          <p className="text-red-500">{result.error}</p>
        ) : (
          <div className="space-y-3">
            <p>
              <span className="font-medium">总工时：</span>
              <span>{result.diffHoursDecimal.toFixed(2)} 小时</span>
            </p>
            <p>
              <span className="font-medium">换算：</span>
              <span>{result.hours} 小时 {result.minutes} 分钟（共 {result.diffMinutes} 分钟）</span>
            </p>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="font-medium mb-1">扣除午餐（30 分钟）：</p>
              <p className="text-sm">
                {result.lunchAdjustedHours.toFixed(2)} 小时（共 {result.lunchAdjustedMinutes} 分钟）
              </p>
            </div>
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <p className="font-medium mb-1">异常时间（8 小时标准）：</p>
              {(() => {
                const standardHours = 8
                const abnormalHours = result.lunchAdjustedHours - standardHours
                const abnormalMinutes = Math.round(abnormalHours * 60)
                const absAbnormalMinutes = Math.abs(abnormalMinutes)
                
                if (abnormalHours > 0) {
                  return (
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      超时 {absAbnormalMinutes} 分钟
                    </p>
                  )
                } else if (abnormalHours < 0) {
                  return (
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      欠时 {absAbnormalMinutes} 分钟
                    </p>
                  )
                } else {
                  return (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      正常，刚好 8 小时
                    </p>
                  )
                }
              })()}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 px-4 py-5">
        <h3 className={`text-lg font-semibold mb-4 ${labelClass}`}>回补基础时长计算</h3>
        
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${labelClass}`} htmlFor="accounting-duration">
              核算时长（分钟）
            </label>
            <input
              id="accounting-duration"
              type="number"
              min="0"
              value={accountingDuration}
              onChange={(event) => setAccountingDuration(event.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                isDark
                  ? 'bg-gray-900 border-gray-700 text-white focus:ring-purple-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:ring-purple-200'
              }`}
              placeholder="请输入核算时长（分钟）"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deduct-lunch-check"
              checked={deductLunch}
              onChange={(event) => setDeductLunch(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="deduct-lunch-check" className={`text-sm ${labelClass}`}>
              扣除午餐（30 分钟）
            </label>
          </div>

          <div className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900/50">
            {!startTime || !endTime ? (
              <p className={`text-sm ${helperClass}`}>请先填写完整的工作时间</p>
            ) : result?.error ? (
              <p className="text-sm text-red-500">{result.error}</p>
            ) : !accountingDuration || accountingDuration === '' || Number(accountingDuration) < 0 ? (
              <p className={`text-sm ${helperClass}`}>请输入有效的核算时长</p>
            ) : (
              (() => {
                const accountingMinutes = Number(accountingDuration)
                const baseMinutes = deductLunch ? result.lunchAdjustedMinutes : result.diffMinutes
                const compensationMinutes = baseMinutes - accountingMinutes
                const absCompensationMinutes = Math.abs(compensationMinutes)

                if (compensationMinutes > 0) {
                  return (
                    <div>
                      <p className={`text-sm font-medium mb-1 ${labelClass}`}>回补基础时长：</p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        需回补 {absCompensationMinutes} 分钟
                      </p>
                    </div>
                  )
                } else if (compensationMinutes < 0) {
                  return (
                    <div>
                      <p className={`text-sm font-medium mb-1 ${labelClass}`}>回补基础时长：</p>
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        超出 {absCompensationMinutes} 分钟
                      </p>
                    </div>
                  )
                } else {
                  return (
                    <div>
                      <p className={`text-sm font-medium mb-1 ${labelClass}`}>回补基础时长：</p>
                      <p className="text-sm text-green-600 dark:text-green-400">
                        无需回补，时长一致
                      </p>
                    </div>
                  )
                }
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EwhCalculator

const CODE39_PATTERNS = {
  '0': 'nnnwwnwnn',
  '1': 'wnnwnnnnw',
  '2': 'nnwwnnnnw',
  '3': 'wnwwnnnnn',
  '4': 'nnnwwnnnw',
  '5': 'wnnwwnnnn',
  '6': 'nnwwwnnnn',
  '7': 'nnnwnnwnw',
  '8': 'wnnwnnwnn',
  '9': 'nnwwnnwnn',
  A: 'wnnnnwnnw',
  B: 'nnwnnwnnw',
  C: 'wnwnnwnnn',
  D: 'nnnnwwnnw',
  E: 'wnnnwwnnn',
  F: 'nnwnwwnnn',
  G: 'nnnnnwwnw',
  H: 'wnnnnwwnn',
  I: 'nnwnnwwnn',
  J: 'nnnnwwwnn',
  K: 'wnnnnnnww',
  L: 'nnwnnnnww',
  M: 'wnwnnnnwn',
  N: 'nnnnwnnww',
  O: 'wnnnwnnwn',
  P: 'nnwnwnnwn',
  Q: 'nnnnnnwww',
  R: 'wnnnnnwwn',
  S: 'nnwnnnwwn',
  T: 'nnnnwnwwn',
  U: 'wwnnnnnnw',
  V: 'nwwnnnnnw',
  W: 'wwwnnnnnn',
  X: 'nwnnwnnnw',
  Y: 'wwnnwnnnn',
  Z: 'nwwnwnnnn',
  '-': 'nwnnnnwnw',
  '.': 'wwnnnnwnn',
  ' ': 'nwwnnnwnn',
  '$': 'nwnwnwnnn',
  '/': 'nwnwnnnwn',
  '+': 'nwnnnwnwn',
  '%': 'nnnwnwnwn',
  '*': 'nwnnwnwnn',
}

export const START_STOP_CHAR = '*'
export const ALLOWED_CODE39_CHARACTERS = Object.keys(CODE39_PATTERNS).filter(
  (char) => char !== START_STOP_CHAR,
)

export const MAX_CODE39_LENGTH = 32

const DEFAULT_CONFIG = {
  narrowWidth: 2,
  wideFactor: 3,
  quietZoneFactor: 10,
  height: 100,
  backgroundColor: '#FFFFFF',
  barColor: '#0F172A',
}

const resolveConfig = (config = {}) => {
  const narrowWidth = Number.isFinite(config.narrowWidth) ? Math.max(1, config.narrowWidth) : DEFAULT_CONFIG.narrowWidth
  const wideWidth = narrowWidth * (Number.isFinite(config.wideFactor) ? Math.max(2, config.wideFactor) : DEFAULT_CONFIG.wideFactor)
  const quietZone = narrowWidth * (Number.isFinite(config.quietZoneFactor) ? Math.max(6, config.quietZoneFactor) : DEFAULT_CONFIG.quietZoneFactor)
  const height = Number.isFinite(config.height) ? Math.max(24, config.height) : DEFAULT_CONFIG.height

  return {
    narrowWidth,
    wideWidth,
    quietZone,
    height,
    backgroundColor: typeof config.backgroundColor === 'string' ? config.backgroundColor : DEFAULT_CONFIG.backgroundColor,
    barColor: typeof config.barColor === 'string' ? config.barColor : DEFAULT_CONFIG.barColor,
  }
}

export const buildCode39Segments = (value, config) => {
  const { narrowWidth, wideWidth, quietZone } = resolveConfig(config)
  const fullValue = `${START_STOP_CHAR}${value}${START_STOP_CHAR}`
  const segments = []
  let cursor = quietZone

  fullValue.split('').forEach((char, charIndex) => {
    const pattern = CODE39_PATTERNS[char]
    if (!pattern) return

    pattern.split('').forEach((token, index) => {
      const width = token === 'w' ? wideWidth : narrowWidth
      const isBar = index % 2 === 0
      segments.push({
        type: isBar ? 'bar' : 'space',
        x: cursor,
        width,
      })
      cursor += width
    })

    if (charIndex < fullValue.length - 1) {
      cursor += narrowWidth
    }
  })

  const totalWidth = cursor + quietZone

  return {
    totalWidth,
    segments,
  }
}

export const validateCode39Value = (value) => {
  if (!value?.trim()) {
    return { valid: false, reason: '内容不能为空' }
  }
  if (value.length > MAX_CODE39_LENGTH) {
    return { valid: false, reason: `长度需少于 ${MAX_CODE39_LENGTH} 个字符` }
  }
  for (const char of value) {
    if (!CODE39_PATTERNS[char] || char === START_STOP_CHAR) {
      return { valid: false, reason: `存在不支持的字符 ${char}` }
    }
  }
  return { valid: true }
}

export const createCode39Svg = (value, options = {}) => {
  const upperValue = value.toUpperCase()
  const validation = validateCode39Value(upperValue)
  if (!validation.valid) {
    return { svg: '', width: 0, height: 0, error: validation.reason }
  }

  const config = resolveConfig(options)
  const { totalWidth, segments } = buildCode39Segments(upperValue, config)
  const { height, backgroundColor, barColor } = config

  const bars = segments
    .filter((segment) => segment.type === 'bar')
    .map((bar) => `<rect x="${bar.x}" y="0" width="${bar.width}" height="${height}" fill="${barColor}" />`)
    .join('')

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}">`,
    `<rect width="100%" height="100%" fill="${backgroundColor}" />`,
    bars,
    '</svg>',
  ].join('')

  return {
    svg,
    width: totalWidth,
    height,
    value: upperValue,
  }
}

export const createCode39DataUrl = (value, options = {}) => {
  const { svg, error, width, height, value: normalized } = createCode39Svg(value, options)
  if (!svg) {
    return { dataUrl: '', error }
  }
  const encode = (value) => {
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return window.btoa(unescape(encodeURIComponent(value)))
    }
    if (typeof globalThis !== 'undefined' && typeof globalThis.btoa === 'function') {
      return globalThis.btoa(unescape(encodeURIComponent(value)))
    }
    if (typeof globalThis !== 'undefined' && typeof globalThis.Buffer !== 'undefined') {
      return globalThis.Buffer.from(value, 'utf-8').toString('base64')
    }
    return ''
  }

  const encoded = encode(svg)
  if (!encoded) {
    return { dataUrl: '', error: '编码失败' }
  }

  return {
    dataUrl: `data:image/svg+xml;base64,${encoded}`,
    width,
    height,
    value: normalized,
  }
}

export const createCode39Batch = (input, options = {}, { includeErrors = false } = {}) => {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.toUpperCase())

  const results = []
  const errors = []

  lines.forEach((line, index) => {
    const { dataUrl, error } = createCode39DataUrl(line, options)
    if (error || !dataUrl) {
      errors.push(`第 ${index + 1} 行：${error || '生成失败'}`)
      return
    }
    results.push({
      value: line,
      dataUrl,
      fileName: `${line || `barcode_${index + 1}`}.svg`,
    })
  })

  if (!results.length && errors.length && !includeErrors) {
    return { codes: [], errors }
  }

  return { codes: results, errors }
}

export const getCode39HelperText = () => `可输入字符：${ALLOWED_CODE39_CHARACTERS.join(' ')}`

export default {
  CODE39_PATTERNS,
  START_STOP_CHAR,
  ALLOWED_CODE39_CHARACTERS,
  MAX_CODE39_LENGTH,
  buildCode39Segments,
  validateCode39Value,
  createCode39Svg,
  createCode39DataUrl,
  createCode39Batch,
  getCode39HelperText,
}

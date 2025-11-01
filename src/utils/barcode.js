// Code 128 编码表（每个值对应11个模块的图案，1=bar, 0=space）
const CODE128_PATTERNS = [
  '11011001100', // 0
  '11001101100', // 1
  '11001100110', // 2
  '10010011000', // 3
  '10010001100', // 4
  '10001001100', // 5
  '10011001000', // 6
  '10011000100', // 7
  '10001100100', // 8
  '11001001000', // 9
  '11001000100', // 10
  '11000100100', // 11
  '10110011100', // 12
  '10011011100', // 13
  '10011001110', // 14
  '10111001100', // 15
  '10011101100', // 16
  '10011100110', // 17
  '11001110010', // 18
  '11001011100', // 19
  '11001001110', // 20
  '11011100100', // 21
  '11001110100', // 22
  '11101101110', // 23
  '11101001100', // 24
  '11100101100', // 25
  '11100100110', // 26
  '11101100100', // 27
  '11100110100', // 28
  '11100110010', // 29
  '11011011000', // 30
  '11011000110', // 31
  '11000110110', // 32
  '10100011000', // 33
  '10001011000', // 34
  '10001000110', // 35
  '10110001000', // 36
  '10001101000', // 37
  '10001100010', // 38
  '11010001000', // 39
  '11000101000', // 40
  '11000100010', // 41
  '10110111000', // 42
  '10110001110', // 43
  '10001101110', // 44
  '10111011000', // 45
  '10111000110', // 46
  '10001110110', // 47
  '11101110110', // 48
  '11010001110', // 49
  '11000101110', // 50
  '11011101000', // 51
  '11011100010', // 52
  '11011101110', // 53
  '11101011000', // 54
  '11101000110', // 55
  '11100010110', // 56
  '11101101000', // 57
  '11101100010', // 58
  '11100011010', // 59
  '11101111010', // 60
  '11001000010', // 61
  '11110001010', // 62
  '10100110000', // 63
  '10100001100', // 64
  '10010110000', // 65
  '10010000110', // 66
  '10000101100', // 67
  '10000100110', // 68
  '10110010000', // 69
  '10110000100', // 70
  '10011010000', // 71
  '10011000010', // 72
  '10000110100', // 73
  '10000110010', // 74
  '11000010010', // 75
  '11001010000', // 76
  '11100011000', // 77
  '11100000110', // 78
  '11100010100', // 79
  '11000010100', // 80
  '11000010010', // 81
  '11001010010', // 82
  '11100001000', // 83
  '11000001000', // 84
  '11000000100', // 85
  '11000000110', // 86
  '11000001100', // 87
  '11000010000', // 88
  '11000001010', // 89
  '11000000010', // 90
  '11000001110', // 91
  '11000010010', // 92
  '11000000110', // 93
  '11000001000', // 94
  '11000000100', // 95
  '11000000010', // 96
  '11000001100', // 97
  '11000010000', // 98
  '11000001010', // 99
  '11001001110', // 100 - Code C
  '11001110110', // 101 - Code B
  '11000110100', // 102 - Start Code A
  '10100011110', // 103 - Start Code B
  '10111100100', // 104 - Start Code C
  '11110011110', // 105
  '11011100110', // 106
  '11101000110', // 107
]

// Code 128 字符集 B（最常用，支持所有 ASCII 可打印字符）
const CODE128_B_CHARS = {
  ' ': 0, '!': 1, '"': 2, '#': 3, '$': 4, '%': 5, '&': 6, "'": 7,
  '(': 8, ')': 9, '*': 10, '+': 11, ',': 12, '-': 13, '.': 14, '/': 15,
  '0': 16, '1': 17, '2': 18, '3': 19, '4': 20, '5': 21, '6': 22, '7': 23,
  '8': 24, '9': 25, ':': 26, ';': 27, '<': 28, '=': 29, '>': 30, '?': 31,
  '@': 32, 'A': 33, 'B': 34, 'C': 35, 'D': 36, 'E': 37, 'F': 38, 'G': 39,
  'H': 40, 'I': 41, 'J': 42, 'K': 43, 'L': 44, 'M': 45, 'N': 46, 'O': 47,
  'P': 48, 'Q': 49, 'R': 50, 'S': 51, 'T': 52, 'U': 53, 'V': 54, 'W': 55,
  'X': 56, 'Y': 57, 'Z': 58, '[': 59, '\\': 60, ']': 61, '^': 62, '_': 63,
  '`': 64, 'a': 65, 'b': 66, 'c': 67, 'd': 68, 'e': 69, 'f': 70, 'g': 71,
  'h': 72, 'i': 73, 'j': 74, 'k': 75, 'l': 76, 'm': 77, 'n': 78, 'o': 79,
  'p': 80, 'q': 81, 'r': 82, 's': 83, 't': 84, 'u': 85, 'v': 86, 'w': 87,
  'x': 88, 'y': 89, 'z': 90, '{': 91, '|': 92, '}': 93, '~': 94, '\x7F': 95, // DEL
}

export const ALLOWED_CODE128_CHARACTERS = Object.keys(CODE128_B_CHARS).filter(c => c !== '\x7F')
export const MAX_CODE128_LENGTH = 80

const DEFAULT_CONFIG = {
  moduleWidth: 2, // 每个模块的宽度
  quietZoneFactor: 10,
  height: 100,
  backgroundColor: '#FFFFFF',
  barColor: '#0F172A',
}

const resolveConfig = (config = {}) => {
  const moduleWidth = Number.isFinite(config.moduleWidth) ? Math.max(1, config.moduleWidth) : DEFAULT_CONFIG.moduleWidth
  const quietZone = moduleWidth * (Number.isFinite(config.quietZoneFactor) ? Math.max(6, config.quietZoneFactor) : DEFAULT_CONFIG.quietZoneFactor)
  const height = Number.isFinite(config.height) ? Math.max(24, config.height) : DEFAULT_CONFIG.height

  return {
    moduleWidth,
    quietZone,
    height,
    backgroundColor: typeof config.backgroundColor === 'string' ? config.backgroundColor : DEFAULT_CONFIG.backgroundColor,
    barColor: typeof config.barColor === 'string' ? config.barColor : DEFAULT_CONFIG.barColor,
  }
}

// 计算校验位
const calculateChecksum = (values) => {
  let sum = 104 // Start Code B 的值
  values.forEach((value, index) => {
    sum += value * (index + 1)
  })
  return sum % 103
}

export const buildCode128Segments = (value, config) => {
  const { moduleWidth, quietZone } = resolveConfig(config)
  
  // 转换为字符值数组（使用 Code B）
  const charValues = []
  for (const char of value) {
    if (char in CODE128_B_CHARS) {
      charValues.push(CODE128_B_CHARS[char])
    } else {
      // 不支持非 ASCII 字符，跳过或使用替代
      return { totalWidth: 0, segments: [] }
    }
  }
  
  if (charValues.length === 0) {
    return { totalWidth: 0, segments: [] }
  }
  
  // 起始码 B (104)
  const startCode = 104
  
  // 计算校验位
  const checksum = calculateChecksum(charValues)
  
  // 终止码 (106)
  const stopCode = 106
  
  // 构建完整序列：起始码 + 数据 + 校验位 + 终止码
  const allValues = [startCode, ...charValues, checksum, stopCode]
  
  const segments = []
  let cursor = quietZone
  
  allValues.forEach((value, valueIndex) => {
    const pattern = CODE128_PATTERNS[value]
    if (!pattern) return
    
    // 每个字符由11个模块组成
    pattern.split('').forEach((bit, bitIndex) => {
      const width = moduleWidth
      const isBar = bit === '1'
      segments.push({
        type: isBar ? 'bar' : 'space',
        x: cursor,
        width,
      })
      cursor += width
    })
  })
  
  const totalWidth = cursor + quietZone
  
  return {
    totalWidth,
    segments,
  }
}

export const validateCode128Value = (value) => {
  if (!value?.trim()) {
    return { valid: false, reason: '内容不能为空' }
  }
  if (value.length > MAX_CODE128_LENGTH) {
    return { valid: false, reason: `长度需少于 ${MAX_CODE128_LENGTH} 个字符` }
  }
  for (const char of value) {
    if (!(char in CODE128_B_CHARS)) {
      return { valid: false, reason: `存在不支持的字符 ${char} (仅支持 ASCII 可打印字符)` }
    }
  }
  return { valid: true }
}

export const createCode128Svg = (value, options = {}) => {
  const validation = validateCode128Value(value)
  if (!validation.valid) {
    return { svg: '', width: 0, height: 0, error: validation.reason }
  }

  const config = resolveConfig(options)
  const { totalWidth, segments } = buildCode128Segments(value, config)
  
  if (totalWidth === 0) {
    return { svg: '', width: 0, height: 0, error: '无法生成条形码' }
  }
  
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
    value,
  }
}

export const createCode128DataUrl = (value, options = {}) => {
  const { svg, error, width, height, value: normalized } = createCode128Svg(value, options)
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

export const createCode128Batch = (input, options = {}, { includeErrors = false } = {}) => {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const results = []
  const errors = []

  lines.forEach((line, index) => {
    const { dataUrl, error } = createCode128DataUrl(line, options)
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

export const getCode128HelperText = () => `支持所有 ASCII 可打印字符（0-9, A-Z, a-z 及常用符号）`

// 为了向后兼容，保留旧的导出名称但指向新的 Code 128 函数
export const MAX_CODE39_LENGTH = MAX_CODE128_LENGTH
export const ALLOWED_CODE39_CHARACTERS = ALLOWED_CODE128_CHARACTERS
export const createCode39Batch = createCode128Batch
export const getCode39HelperText = getCode128HelperText

export default {
  CODE128_PATTERNS,
  ALLOWED_CODE128_CHARACTERS,
  MAX_CODE128_LENGTH,
  buildCode128Segments,
  validateCode128Value,
  createCode128Svg,
  createCode128DataUrl,
  createCode128Batch,
  getCode128HelperText,
  // 向后兼容
  MAX_CODE39_LENGTH,
  ALLOWED_CODE39_CHARACTERS,
  createCode39Batch,
  getCode39HelperText,
}

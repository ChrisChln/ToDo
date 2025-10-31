import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // 恢复默认端口（5173）。如需再次修改，可调整这里的 port。
  server: {
    port: 5180,
    host: true,
    open: false,
  },
  preview: {
    port: 5280,
    host: true,
  },
})

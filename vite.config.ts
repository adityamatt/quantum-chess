import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/quantum-chess/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/Users/aditya/source/chess/src',
    },
  },
  test: {
    globals: true,
  },
})

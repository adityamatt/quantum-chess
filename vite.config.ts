import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
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

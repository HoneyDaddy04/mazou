import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/auth': 'http://localhost:8000',
      '/api/dashboard': 'http://localhost:8000',
      '/api/routing': 'http://localhost:8000',
      '/api/admin': 'http://localhost:8000',
      '/v1': 'http://localhost:8000',
      '/webhooks': 'http://localhost:8000',
    },
  },
})

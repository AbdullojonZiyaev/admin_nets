import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'http://10.251.4.199:5000',
        changeOrigin: true,
      },
    },
  },
})

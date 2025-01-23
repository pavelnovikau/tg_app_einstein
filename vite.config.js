import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/tg_app_affilate/', // Имя вашего репозитория
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}) 
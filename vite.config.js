import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Используем base path только в production
  base: command === 'serve' ? '' : '/tg_app_einstein/',
  build: {
    outDir: 'dist'
  }
})) 
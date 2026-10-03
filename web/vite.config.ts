import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Absolute base: routes are real paths (/viewinter/topic/x), so assets must not be relative
  base: '/viewinter/',
  server: { fs: { allow: ['..'] } },
})

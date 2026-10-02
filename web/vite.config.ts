import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Relative base so the build works on any GitHub Pages path (user.github.io/repo/)
  base: './',
  server: { fs: { allow: ['..'] } },
})

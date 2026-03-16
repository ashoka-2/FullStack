import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    cssMinify: 'lightningcss' 
  },
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    forwardConsole: true 
  }
})
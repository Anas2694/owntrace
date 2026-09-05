import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  build: {
    // The licensed Three.js globe is isolated in a lazy route chunk by design.
    chunkSizeWarningLimit: 650,
  },
  plugins: [react()],
  resolve: {
    alias: {
      three: fileURLToPath(new URL('./src/vendor/three/three.module.js', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
})

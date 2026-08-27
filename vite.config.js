import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  },
  server: {
    // In dev, run `npm run dev` (this, with HMR) + `npm run dev:api` (wrangler).
    // Relative /api calls are proxied to the local Worker so there's no CORS.
    proxy: {
      '/api': 'http://localhost:8787'
    }
  }
})
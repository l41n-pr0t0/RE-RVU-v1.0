import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // three.js lives in its own lazy chunk (GlassScreen); it never blocks first paint.
  build: { chunkSizeWarningLimit: 600 },
})

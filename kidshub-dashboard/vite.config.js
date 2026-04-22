import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Pin the dev server to 5173 with strictPort so a second `npm run dev:dashboard`
// fails loudly instead of silently hopping to 5174 and shadowing kidshub's Expo
// dev server (which is pinned to 5180 — see kidshub/package.json).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
})
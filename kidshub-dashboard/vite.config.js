import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Pin the dev server to 5173 with strictPort so a second `npm run dev:dashboard`
// fails loudly instead of silently hopping to 5174 and shadowing kidshub's Expo
// dev server (which is pinned to 5180 — see kidshub/package.json).
//
// fs.allow lets Vite read the monorepo-root `config/` folder (one level above
// this project's own root). Without it, `import * from '../../../config/product'`
// fails at dev-time with "The request url ... is outside of Vite serving allow
// list". The config folder holds the single source of truth for tier/feature
// settings shared with the kidshub app — see config/README.md.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '..', 'config'),
      ],
    },
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
})
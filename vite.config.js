import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Use a function form so we can set `base` differently for dev vs build.
export default defineConfig(({ command }) => ({
  // During `vite` dev server, use '/' so assets load correctly.
  // During `vite build`, use a relative base so the built files work both
  // with local preview and when served from GitHub Pages.
  // Use './' for relative asset paths (works well for project pages).
  base: command === 'build' ? './' : '/',
  plugins: [react()]
}))

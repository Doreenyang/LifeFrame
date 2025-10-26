import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // When deploying to GitHub Pages for a repo named `LifeFrame`,
  // set the base to '/LifeFrame/' so assets are referenced correctly.
  base: '/LifeFrame/',
  plugins: [react()]
})

import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// VITE_BASE allows moving off GitHub Pages later (e.g. own hosting at "/")
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    base: env.VITE_BASE || '/montalux-crm/',
    plugins: [react(), tailwindcss()],
  }
})

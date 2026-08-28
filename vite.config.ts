import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

function githubPagesSpaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const index = resolve(outDir, 'index.html')
      const notFound = resolve(outDir, '404.html')
      if (existsSync(index)) copyFileSync(index, notFound)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), githubPagesSpaFallback()],
  server: {
    proxy: {
      '/api': 'http://localhost:8090',
    },
  },
})

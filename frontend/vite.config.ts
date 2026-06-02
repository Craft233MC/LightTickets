import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function ensureDataConfig() {
  const sourceFile = path.resolve(__dirname, 'data', 'config.yml')
  const publicDir = path.resolve(__dirname, 'public', 'data')
  const publicFile = path.join(publicDir, 'config.yml')
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }
  if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, publicFile)
  } else if (!fs.existsSync(publicFile)) {
    fs.writeFileSync(publicFile, 'backendUrl: "http://localhost:3000/api"\n', 'utf-8')
  }
}

ensureDataConfig()

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})

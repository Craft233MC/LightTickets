import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

function dataConfigPlugin(): import('vite').Plugin {
  const dataDir = path.resolve(__dirname, 'data')
  const configFile = path.join(dataDir, 'config.yml')
  const defaultContent = 'backendUrl: "http://localhost:3000/api"\n'

  return {
    name: 'data-config',
    configureServer(server) {
      // Dev: serve /data/config.yml directly from frontend/data/
      server.middlewares.use((req, res, next) => {
        if (req.url === '/data/config.yml') {
          if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
          if (!fs.existsSync(configFile)) fs.writeFileSync(configFile, defaultContent, 'utf-8')
          res.setHeader('Content-Type', 'text/yaml')
          res.end(fs.readFileSync(configFile, 'utf-8'))
          return
        }
        next()
      })
    },
    closeBundle() {
      // Build: copy to dist/data/
      const distData = path.resolve(__dirname, 'dist', 'data')
      if (!fs.existsSync(distData)) fs.mkdirSync(distData, { recursive: true })
      if (!fs.existsSync(configFile)) {
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
        fs.writeFileSync(configFile, defaultContent, 'utf-8')
      }
      fs.copyFileSync(configFile, path.join(distData, 'config.yml'))
    },
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), dataConfigPlugin()],
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

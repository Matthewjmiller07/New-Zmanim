import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'chart-vendor': ['apexcharts', 'react-apexcharts'],
          'map-vendor': ['leaflet']
        }
      }
    }
  },
  plugins: [react()],

  server: {
    port: 5173,
    open: true
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          chart: ['chart.js', 'react-chartjs-2'],
          ui: [
            '@mui/icons-material',
            '@radix-ui/react-icons',
            '@radix-ui/react-label',
            '@radix-ui/react-select',
            '@radix-ui/react-slot',
            '@radix-ui/react-toast'
          ],
          data: [
            '@supabase/supabase-js',
            '@tanstack/react-query',
            'dexie',
            'dexie-react-hooks'
          ]
        }
      }
    },
    minify: true,
    target: 'esnext'
  },
  base: '/',
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'chart.js',
      'react-chartjs-2',
      '@supabase/supabase-js'
    ]
  }
})

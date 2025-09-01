import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/assets': path.resolve(__dirname, './src/assets'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
    },
  },
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV === 'development',
    minify: 'terser',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-slot', '@radix-ui/react-toast'],
          chart: ['chart.js', 'react-chartjs-2', 'recharts'],
          supabase: ['@supabase/supabase-js'],
          apollo: ['@apollo/client', 'graphql'],
          utils: ['clsx', 'tailwind-merge', 'framer-motion'],
          icons: ['lucide-react', '@radix-ui/react-icons'],
          excel: ['xlsx', 'react-dropzone'],
        },
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const extType = info[info.length - 1]
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/\.(css)$/i.test(assetInfo.name)) {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/globals.scss";`,
      },
    },
  },
  base: '/',
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})

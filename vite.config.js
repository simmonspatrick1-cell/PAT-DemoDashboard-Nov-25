import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Output directory for Suitelet deployment
    outDir: 'dist-suitelet',
    // Optimize for NetSuite hosting
    rollupOptions: {
      output: {
        // Single file output for easier NetSuite hosting
        manualChunks: undefined,
        entryFileNames: 'assets/dashboard.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    // Inline small assets to reduce HTTP requests
    assetsInlineLimit: 4096,
    // Minify for production
    minify: 'terser',
    sourcemap: false
  },
  // Use relative paths for NetSuite File Cabinet
  base: './',
})


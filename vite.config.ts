import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/safeprag_site/',
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 8080,
    host: true
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor chunks
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('@radix-ui') || id.includes('react-modal') || id.includes('react-toastify')) {
              return 'vendor-ui';
            }
            if (id.includes('chart.js') || id.includes('recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('date-fns') || id.includes('uuid') || id.includes('framer-motion')) {
              return 'vendor-utils';
            }
            if (id.includes('html2canvas') || id.includes('jspdf')) {
              return 'vendor-pdf';
            }
            return 'vendor';
          }
          
          // Feature chunks
          if (id.includes('/components/')) {
            if (id.includes('Scheduler') || id.includes('Calendar')) {
              return 'feature-scheduler';
            }
            if (id.includes('Admin') || id.includes('Dashboard')) {
              return 'feature-admin';
            }
            if (id.includes('Activity') || id.includes('Service')) {
              return 'feature-activity';
            }
          }
        },
        // Configuração adicional para otimizar o output
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    // Otimizações adicionais
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  }
});

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Path aliases — use @utils, @services, @components etc. instead of ../../../
  resolve: {
    alias: {
      '@':          path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages':     path.resolve(__dirname, './src/pages'),
      '@utils':     path.resolve(__dirname, './src/utils'),
      '@services':  path.resolve(__dirname, './src/services'),
      '@store':     path.resolve(__dirname, './src/store'),
      '@context':   path.resolve(__dirname, './src/context'),
      '@config':    path.resolve(__dirname, './src/config'),
      '@theme':     path.resolve(__dirname, './src/theme'),
    },
  },

  build: {
    // Raise the warning threshold so routine vendor chunks don't warn
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Safe vendor splits: only packages with no shared singleton dependencies.
        // MUI + react-select + framer-motion are intentionally left in the main chunk
        // because they all share @emotion/react — splitting them causes a "Cannot set
        // properties of undefined (setting 'lastIndex')" runtime error from the emotion
        // cache initialising before its host chunk is ready.
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-utils':  ['axios', 'zustand', 'date-fns', 'dayjs'],
        },
      },
    },
  },
})

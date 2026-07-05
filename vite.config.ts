import { defineConfig, loadEnv } from 'vite'
import solidPlugin from 'vite-plugin-solid'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  if (!env || !env.VITE_API_BASE_URL) {
    throw new Error("ENV VARIABLES NOT DEFINED")
  }
  
  return {
    plugins: [solidPlugin()],
    resolve: {
      alias: {
        '@': new URL('./src', import.meta.url).pathname,
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 510,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('three')) return 'three'
              if (id.includes('echarts') || id.includes('zrender')) return 'echarts'
              return 'vendor'
            }
          },
        },
      },
    },
  }
})

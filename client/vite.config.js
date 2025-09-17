import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    plugins: [react(), tailwindcss()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false
            }
        }
    },
    build: {
        outDir: 'dist',
        sourcemap: mode === 'production',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                    ui: ['react-hot-toast']
                }
            }
        }
    },
    define: {
        __DEV__: mode === 'development'
    }
}))

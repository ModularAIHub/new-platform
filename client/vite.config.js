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
        chunkSizeWarningLimit: 800,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;

                    if (id.includes('react-router-dom')) return 'vendor-router';
                    if (id.includes('react-dom') || id.includes('react/')) return 'vendor-react';
                    if (id.includes('recharts')) return 'vendor-charts';
                    if (
                        id.includes('lucide-react') ||
                        id.includes('@headlessui/react') ||
                        id.includes('react-hot-toast')
                    ) {
                        return 'vendor-ui';
                    }
                    if (
                        id.includes('marked') ||
                        id.includes('dompurify') ||
                        id.includes('fuse.js')
                    ) {
                        return 'vendor-content';
                    }
                    if (
                        id.includes('dayjs') ||
                        id.includes('moment') ||
                        id.includes('date-fns')
                    ) {
                        return 'vendor-dates';
                    }
                    if (id.includes('axios')) return 'vendor-network';
                }
            }
        }
    },
    define: {
        __DEV__: mode === 'development'
    }
}))

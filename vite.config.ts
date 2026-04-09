import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Vite設定。
 * テスト環境（jsdom）とReactプラグインを設定する。
 */
export default defineConfig({
  plugins: [react()],
  build: {
    /**
     * コードスプリッティング設定。
     * Three.js・R3Fは大きいので独立チャンクに分離し、
     * メインチャンクを500KB以下に保つ（CLAUDE.mdのパフォーマンス目標）。
     */
    rollupOptions: {
      output: {
        /**
         * Three.js・R3Fを独立チャンクに分離し、
         * メインチャンクを500KB以下に保つ（rolldown対応の関数形式）。
         */
        manualChunks: (id: string) => {
          if (id.includes('three') || id.includes('@react-three')) {
            return 'three-vendor'
          }
          if (id.includes('react-dom') || id.includes('react/')) {
            return 'react-vendor'
          }
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
})

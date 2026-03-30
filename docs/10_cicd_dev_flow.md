# CI/CD + 自動開発フロー（PDCAサイクル）

本ドキュメントは、このゲームプロジェクトで**継続的に品質を維持しながら開発を進めるための自動化フロー**を定義します。
Claude Code はコードを書いた後、必ずこのフローに沿った品質チェックを意識すること。

---

## 1. 開発フローの全体像（PDCA）

```
PLAN（設計）
  → docs/ にアーキテクチャ・要件を先に記述
  → CLAUDE.md の原則を確認

DO（実装）
  → Feature ブランチで開発
  → コミット前に Husky フックが自動チェック
  → PR を作成

CHECK（検証）
  → GitHub Actions でCI自動実行
  → Vercel Preview で実機確認
  → テストカバレッジ確認

ACT（改善）
  → レビュー・修正してマージ
  → main へのマージで本番デプロイ
```

---

## 2. ブランチ戦略

```
main            ← 本番。直接プッシュ禁止
  └─ develop    ← 統合ブランチ
       └─ feature/xxx   ← 機能開発
       └─ fix/xxx       ← バグ修正
       └─ docs/xxx      ← ドキュメント
```

コミットメッセージ規約（Conventional Commits）:
```
feat: ワードオブジェクトの浮遊アニメーション追加
fix: トップダウンカメラの追従ずれを修正
docs: GoFパターンガイドラインを更新
test: WordObjectのコリジョンテストを追加
refactor: PlayerコンポーネントをSRP原則に沿って分割
```

---

## 3. Husky + lint-staged（コミット前チェック）

```bash
npm install -D husky lint-staged
npx husky init
```

**package.json**:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

**.husky/pre-commit**:
```bash
#!/bin/sh
npx lint-staged
```

**.husky/pre-push**（型チェックはpush時のみ・重いため）:
```bash
#!/bin/sh
npm run type-check
```

---

## 4. GitHub Actions CI パイプライン

**.github/workflows/ci.yml**:

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci

      # TypeScript 型チェック
      - name: Type Check
        run: npm run type-check

      # ESLint
      - name: Lint
        run: npm run lint

      # Vitest（ユニット・統合テスト + カバレッジ）
      - name: Unit Tests
        run: npm run test:coverage
        env:
          CI: true

      # PRにカバレッジをコメント
      - name: Coverage Report
        uses: davelosert/vitest-coverage-report-action@v2

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - name: Build
        run: npm run build
      - name: E2E Tests
        run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  preview:
    runs-on: ubuntu-latest
    needs: quality
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci && npm run build
      - name: Deploy Vercel Preview
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          github-comment: true  # PRにプレビューURLを自動コメント
```

---

## 5. テスト戦略

### テストの種類と対象

| レイヤー | ツール | 対象 |
|----------|--------|------|
| ユニットテスト | Vitest | Zustand ストア、カスタムフック、ユーティリティ関数 |
| コンポーネントテスト | @react-three/test-renderer | R3F 3Dコンポーネント |
| E2Eテスト | Playwright | ゲーム全体のフロー（起動→プレイ→スコア） |
| ビジュアルテスト | Storybook | UIコンポーネントの見た目確認 |

### カバレッジ目標
- ゲームロジック（ストア・フック）: **80%以上**
- UIコンポーネント: **60%以上**
- ユーティリティ: **90%以上**

### vitest.config.ts
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: ['**/*.stories.*', '**/index.ts', 'src/test/**'],
      thresholds: {
        branches: 60,
        functions: 70,
        lines: 70,
      },
    },
  },
})
```

### R3F コンポーネントテストの注意点
WebGL 内の 3D オブジェクトは直接テストしにくい。
**ゲームロジックをストア層に分離し、ストアの状態変化をテストする**設計を徹底する:

```tsx
// NG: 3D描画結果をテスト（困難）
// OK: ゲームロジック（ストア）をテスト
it('正解するとスコアが加算される', () => {
  const { result } = renderHook(() => useGameStore())
  act(() => result.current.submitAnswer('apple', 'apple'))
  expect(result.current.score).toBeGreaterThan(0)
})
```

### E2Eテストの特殊対応（WebGLゲーム向け）
```ts
// window.__gameStore 経由でストアを操作してテストを加速
await page.evaluate(() => {
  (window as any).__gameStore?.setState({ phase: 'gameover', lives: 0 })
})
```

---

## 6. Storybook によるコンポーネント開発

```bash
npx storybook@latest init
```

R3F コンポーネントには Canvas デコレーターを設定:

```tsx
// .storybook/decorators.tsx
export const CanvasDecorator = (Story) => (
  <div style={{ height: '400px', background: '#1a1a2e' }}>
    <Canvas camera={{ position: [0, 5, 5], fov: 45 }}>
      <ambientLight /><directionalLight position={[5, 5, 5]} />
      <Story />
    </Canvas>
  </div>
)
```

---

## 7. package.json スクリプト定義（必須）

```json
{
  "scripts": {
    "dev":          "vite",
    "build":        "tsc && vite build",
    "preview":      "vite preview",
    "type-check":   "tsc --noEmit",
    "lint":         "eslint src --ext .ts,.tsx --fix",
    "format":       "prettier --write 'src/**/*.{ts,tsx,json,css}'",
    "test":         "vitest",
    "test:coverage":"vitest run --coverage",
    "test:e2e":     "playwright test",
    "storybook":    "storybook dev -p 6006",
    "prepare":      "husky"
  }
}
```

---

## 8. 開発サイクルの運用ルール

1. **新機能の開始前**: `feature/` ブランチを切り、`docs/` に設計メモを書く
2. **実装中**: こまめにコミット（動く単位ごと）
3. **テストは先に書く（TDD推奨）**: 特にゲームロジック（ストア・フック）
4. **PRを出す前**: ローカルで `npm run test:coverage` と `npm run type-check` を通す
5. **マージ基準**: CI全パス + カバレッジ基準クリア + Vercelプレビューで動作確認
6. **週次レビュー**: テストカバレッジ・依存パッケージのアップデート確認

---

## 9. 環境変数管理

```
.env.local          ← ローカル開発用（Gitに含めない）
.env.production     ← 本番用（Vercel環境変数に設定）
.env.example        ← テンプレート（Gitに含める）
```

**.env.example**:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
# Service Role Key は絶対にクライアントに公開しない
# SUPABASE_SERVICE_ROLE_KEY= → Edge Functions の環境変数にのみ設定
```

---

*最終更新: 2026-03-29*

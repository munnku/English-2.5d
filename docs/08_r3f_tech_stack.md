# React Three Fiber (R3F) 技術スタック詳細 — トップダウン2.5D教育ゲーム向け

本ドキュメントは、**React Three Fiber (R3F) を使ったトップダウン視点2.5D英語学習ゲーム**の技術スタックを確定させるリファレンスです。
方針が決まったらこのドキュメントを最初に参照し、ライブラリ選定・API選定の根拠とすること。

---

## 1. 確定技術スタック

```
Vite + React 18 + TypeScript
  ├─ @react-three/fiber (R3F v8)      ← 3Dゲームコア
  ├─ @react-three/drei                 ← ヘルパーユーティリティ集
  ├─ @react-three/rapier              ← 物理エンジン (Rust/WASM)
  ├─ Zustand + subscribeWithSelector  ← グローバル状態管理
  ├─ howler.js                         ← 音声管理
  ├─ react-i18next                     ← UI国際化
  ├─ zod                               ← バリデーション
  └─ Supabase                          ← BaaS (Auth + DB + Edge Functions)
```

---

## 2. カメラ設定（トップダウン2.5D）

### 奥行き感あり（推奨: このゲーム向き）
```tsx
<PerspectiveCamera
  makeDefault
  position={[0, 15, 8]}         // Y: 高さ, Z: 後退量
  rotation={[-Math.PI / 4, 0, 0]}  // 45度俯瞰
  fov={45}
/>
```

### ピクセルアート的・完全2D表現向き
```tsx
<OrthographicCamera
  makeDefault
  position={[0, 10, 0]}
  rotation={[-Math.PI / 2, 0, 0]}
  zoom={50}
/>
```

### プレイヤー追従カメラ（useFrame で毎フレーム更新）
```tsx
function FollowCamera() {
  useFrame((state) => {
    // ⚠️ React state を経由せず直接変更 → re-render 不要
    const pos = useGameStore.getState().playerPosition
    state.camera.position.x = pos.x
    state.camera.position.z = pos.z + 8
    state.camera.lookAt(pos.x, 0, pos.z)
  })
  return null
}
```

---

## 3. 物理エンジン: @react-three/rapier

トップダウンゲームでは `gravity={[0, 0, 0]}` で重力をゼロにする。

```tsx
<Physics gravity={[0, 0, 0]}>
  <RigidBody
    colliders="cuboid"
    linearDamping={5}
    lockRotations           // 回転を固定（トップダウン必須）
  >
    {/* プレイヤーメッシュ */}
  </RigidBody>

  <RigidBody type="fixed">
    {/* 壁・障害物 */}
  </RigidBody>
</Physics>
```

衝突イベントで英語問題をトリガー:
```tsx
<RigidBody
  onCollisionEnter={({ other }) => {
    if (other.rigidBodyObject?.name === 'word-object') {
      triggerQuestion(other.rigidBodyObject.userData.wordId)
    }
  }}
/>
```

---

## 4. @react-three/drei 主要ユーティリティ

| API | 用途 |
|-----|------|
| `<Html>` | 3D空間にHTML/CSSのUIを配置（単語ラベル、チュートリアル等） |
| `<Text>` | 3Dテキスト表示（英単語ラベル） |
| `<Instances>` | 同一オブジェクト大量表示（1ドローコール化） |
| `<Detailed>` | LOD（距離による詳細度切り替え） |
| `<useGLTF>` | GLTFキャラクター・マップオブジェクト読み込み |
| `<PerformanceMonitor>` | FPS監視・自動品質調整（モバイル対応） |
| `<Preload>` | ゲーム開始前のアセット事前読み込み |
| `<BakeShadows>` | 静的シーンの影ベイク（最適化） |

---

## 5. Zustand 状態管理のベストプラクティス

```tsx
// stores/gameStore.ts
export const useGameStore = create<GameState>()(
  subscribeWithSelector((set) => ({
    phase: 'idle',
    score: 0,
    playerPosition: new THREE.Vector3(),
    // ...
  }))
)
```

**重要ルール**:
- `useFrame` 内では `useGameStore.getState()` を使う（re-render回避）
- UIに反映が必要な値のみ Zustand に入れる
- セレクターで必要なプロパティのみサブスクライブ

```tsx
// NG: オブジェクト全体 → 毎回re-render
const state = useGameStore()

// OK: 必要なプロパティのみ
const score = useGameStore(s => s.score)
```

---

## 6. パフォーマンス最適化（必須事項）

### ドローコール削減
```tsx
// 100個の木 → 1ドローコールに
<Instances limit={1000}>
  <boxGeometry /><meshStandardMaterial />
  {trees.map(t => <Instance key={t.id} position={t.position} />)}
</Instances>
```

### Canvas 設定（モバイル対応）
```tsx
<Canvas
  gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
  dpr={[1, 2]}  // デバイスピクセル比を最大2に制限
>
```

### 開発中のパフォーマンスモニタリング
```tsx
{import.meta.env.DEV && <Perf position="top-left" />}  // r3f-perf
```

### メニュー画面等での on-demand レンダリング
```tsx
<Canvas frameloop="demand">  {/* 変更がないとき描画しない */}
```

---

## 7. TypeScript 型定義のルール

```tsx
// Meshのref
const meshRef = useRef<THREE.Mesh>(null!)

// RigidBodyのref
const rigidBodyRef = useRef<RapierRigidBody>(null!)

// クリックイベント
function handleClick(event: ThreeEvent<MouseEvent>) {
  event.stopPropagation()
}
```

---

## 8. ライティング（2.5Dトップダウン標準設定）

```tsx
<>
  <ambientLight intensity={0.6} />
  <directionalLight
    position={[5, 10, 5]}
    intensity={1.2}
    castShadow
    shadow-mapSize-width={2048}
    shadow-mapSize-height={2048}
  />
  <hemisphereLight skyColor="#87ceeb" groundColor="#228b22" intensity={0.3} />
</>
```

---

## 9. インストールコマンド（プロジェクト初期化時）

```bash
# コアゲームエンジン
npm install @react-three/fiber @react-three/drei @react-three/rapier three

# 状態管理・UI
npm install zustand react-i18next i18next i18next-http-backend i18next-browser-languagedetector

# 音声
npm install howler
npm install -D @types/howler

# バリデーション
npm install zod

# 開発・テスト
npm install -D vitest @vitest/coverage-v8 @react-three/test-renderer
npm install -D @testing-library/react @testing-library/user-event jsdom
npm install -D @playwright/test
npm install -D husky lint-staged eslint prettier typescript @types/three

# パフォーマンス監視（開発時のみ）
npm install r3f-perf
```

---

## 10. フォルダ構成（推奨）

```
src/
├── components/
│   ├── game/           # ゲーム用3Dコンポーネント
│   │   ├── Player/
│   │   ├── WordObject/
│   │   └── WorldMap/
│   └── ui/             # HTML/CSS UIコンポーネント
├── hooks/              # カスタムフック（ゲームロジック）
├── stores/             # Zustand ストア
├── types/              # TypeScript 型定義
├── lib/                # ユーティリティ（音声、暗号化等）
│   ├── audio/
│   ├── crypto/
│   └── validation/
├── content/            # 英語学習コンテンツデータ（UIと分離）
├── i18n/               # 国際化設定
└── test/               # テスト設定・ヘルパー
```

---

*最終更新: 2026-03-29*

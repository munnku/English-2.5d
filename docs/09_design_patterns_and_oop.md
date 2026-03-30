# GoFデザインパターン + モダンOOP 開発ガイドライン

本ドキュメントは、React Three Fiber (R3F) + TypeScript でゲームを開発する際に**常に守るべき設計原則**です。
Claude Code はコード生成・修正の際、必ずこのドキュメントの原則に従うこと。

---

## 1. 基本方針

| 原則 | 具体的な指針 |
|------|-------------|
| **Composition over Inheritance** | クラス継承ツリーを深くしない。React Hooks で機能を合成する |
| **SOLID原則** | 特に SRP（単一責任）と DIP（依存性逆転）を徹底する |
| **GoFパターン** | State / Observer / Command を積極的に活用する |
| **ECSは不採用** | 小中規模Webゲームにオーバーエンジニアリング。OOPベースで進める |

---

## 2. ゲーム状態管理 — State Pattern

### 問題
`Player.update()` の中が `if (isMoving) {...} else if (isAnsweringQuiz) {...}` の巨大if文になる。

### 解決: ステートマシン（Zustand + useGameStateMachine）

```
idle → countdown → playing → (question | paused | gameover)
                    ↑←←←←←←←←←←←←←←←←←←←←↓
```

```tsx
// hooks/useGameStateMachine.ts
type GamePhase = 'idle' | 'countdown' | 'playing' | 'paused' | 'question' | 'gameover'

const VALID_TRANSITIONS: Record<GamePhase, GamePhase[]> = {
  idle:       ['countdown'],
  countdown:  ['playing'],
  playing:    ['paused', 'question', 'gameover'],
  paused:     ['playing'],
  question:   ['playing', 'gameover'],
  gameover:   ['idle'],
}
```

**ルール**: `setPhase()` を直接呼ばない。必ず `transition()` を通すことで不正な状態遷移を防ぐ。

---

## 3. イベント駆動アーキテクチャ — Observer Pattern

### 問題
敵を倒した時、スコア・UI・音声が同一コンポーネントに密結合して汚くなる。

### 解決: イベントバス（mitt）

```tsx
// lib/eventBus.ts
import mitt from 'mitt'

type GameEvents = {
  'word:collected':  { wordId: string; word: string }
  'answer:correct':  { questionId: string; points: number }
  'answer:wrong':    { questionId: string }
  'level:up':        { level: number }
  'game:over':       { finalScore: number }
}

export const gameEvents = mitt<GameEvents>()
```

```tsx
// 発火側（WordObject）: イベントを発行するだけ
gameEvents.emit('word:collected', { wordId, word })

// 購読側（ScoreSystem）: 独立して反応
useEffect(() => {
  gameEvents.on('answer:correct', ({ points }) => addScore(points))
  return () => gameEvents.off('answer:correct', ...)
}, [])
```

**ルール**: コンポーネントをまたぐ副作用は必ずイベントバスを経由する。直接関数呼び出しでシステムをまたがない。

---

## 4. 入力の抽象化 — Command Pattern

### 問題
キー入力を直接キャラクター移動に結びつけると、キーコンフィグが困難になる。

### 解決: Commandオブジェクト

```tsx
// patterns/commands.ts
interface Command {
  execute(): void
  undo?(): void
}

class MoveCommand implements Command {
  constructor(
    private store: GameStore,
    private direction: { x: number; z: number }
  ) {}

  execute() {
    this.store.setPlayerVelocity(this.direction)
  }
}

// 入力マッピング（キーコンフィグ変更はここだけ修正）
const KEY_BINDINGS: Record<string, Command> = {
  ArrowUp:    new MoveCommand(store, { x: 0, z: -1 }),
  ArrowDown:  new MoveCommand(store, { x: 0, z: 1 }),
  ArrowLeft:  new MoveCommand(store, { x: -1, z: 0 }),
  ArrowRight: new MoveCommand(store, { x: 1, z: 0 }),
}
```

---

## 5. SOLID 原則の適用

### 5-1. Single Responsibility（単一責任の原則）

1コンポーネント = 1責任。以下のように分割する:

```tsx
// NG: 1つのコンポーネントがすべてを担当
function BadPlayer() { /* 描画 + 物理 + 入力 + 音声 + スコア */ }

// OK: 責任を分離
function Player() {
  return (
    <group>
      <PlayerMesh />      {/* 描画のみ */}
      <PlayerPhysics />   {/* 物理のみ */}
      <PlayerInput />     {/* 入力のみ */}
      <PlayerAudio />     {/* 音声のみ */}
    </group>
  )
}
```

### 5-2. Open/Closed（開放閉鎖の原則）

新しい問題タイプ追加時に既存コードを修正しない:

```tsx
// 新しい問題タイプはレンダラーを追加するだけでOK
const QUESTION_RENDERERS: Record<QuestionType, React.FC<QuestionProps>> = {
  'multiple-choice': MultipleChoiceRenderer,
  'fill-blank':      FillBlankRenderer,
  'matching':        MatchingRenderer,
  // ここに追加するだけ。既存コードを変更しない
}
```

### 5-3. Dependency Inversion（依存性逆転の原則）

具体クラスではなくインターフェースに依存する:

```tsx
// NG: Stripe に直接依存
class PaymentService {
  stripe = new StripeClient()
}

// OK: インターフェースに依存（決済サービス変更に対応）
interface IPaymentProcessor {
  createCheckout(priceId: string): Promise<string>
  cancelSubscription(subscriptionId: string): Promise<void>
}

class StripePaymentProcessor implements IPaymentProcessor { ... }
class MockPaymentProcessor implements IPaymentProcessor { ... }  // テスト用
```

---

## 6. Composition over Inheritance — React Hooks による合成

継承ツリーではなく、カスタムフックの組み合わせで機能を構築する:

```tsx
// 各フックは単一責任（テスト可能・再利用可能）
function usePosition(entityId: string) { ... }
function useFloatAnimation(speed = 1) { ... }
function useInteractable(onInteract: () => void) { ... }
function useHighlight() { ... }

// コンポーネントで合成
function WordObject({ wordId, word }) {
  const { position } = usePosition(wordId)
  const { offsetY }  = useFloatAnimation()
  const { isHovered } = useHighlight()
  const { ref }      = useInteractable(() => triggerQuestion(wordId))

  return (
    <mesh ref={ref} position={[position.x, position.y + offsetY, position.z]}>
      {/* ... */}
    </mesh>
  )
}
```

---

## 7. 型安全なゲームアーキテクチャ

```tsx
// types/game.ts — ゲーム全体の型定義（ここを最初に作る）

// エンティティの基底インターフェース
interface IGameEntity {
  id: string
  position: THREE.Vector3
  update(delta: number): void
}

// インタラクション可能
interface IInteractable {
  onInteract(player: PlayerState): void
  interactionRadius: number
}

// 英語コンテンツを持つ
interface IEnglishContent {
  wordId: string
  word: string
  translation: string
}

// 合成（実装は複数インターフェースをimplements）
interface WordObjectEntity extends IGameEntity, IInteractable, IEnglishContent {}
```

---

## 8. ファイル命名・構成ルール

```
components/game/WordObject/
  ├── WordObject.tsx        # メインコンポーネント（描画担当）
  ├── WordObject.physics.tsx # 物理担当
  ├── WordObject.stories.tsx # Storybook
  ├── WordObject.test.tsx    # テスト
  └── index.ts              # エクスポート
```

- コンポーネントファイルは **PascalCase**
- フック・ユーティリティは **camelCase**
- 型定義は `types/` ディレクトリに集約
- 1ファイルが200行を超えたら分割を検討する

---

## 9. 禁止事項

- `any` 型の使用（型安全を損なう）
- 深い継承ツリー（3階層以上の継承）
- コンポーネントをまたぐ直接的な副作用（必ずイベントバス経由）
- `useGameStore` をそのままサブスクライブ（セレクターを必ず使う）
- ゲームロジックをレンダリングレイヤーに直接書く

---

*最終更新: 2026-03-29*

/**
 * アプリのルートコンポーネント。
 * ゲームフェーズに応じてどの画面を表示するかをここで制御する（Stateパターンの入口）。
 *
 * なぜフェーズをここで分岐するか:
 * 各フェーズのコンポーネントを独立させることで、
 * 新しい画面の追加がこのファイルの1行変更で完結するようにするため。
 */
import { useGameStore } from './stores/gameStore'
import { GameCanvas } from './components/game/GameCanvas'

export default function App() {
  const phase = useGameStore((s) => s.phase)

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* 3Dゲームキャンバス（常にレンダリング、フェーズで表示制御） */}
      <GameCanvas />

      {/* フェーズ別UIオーバーレイ */}
      {phase === 'idle' && <IdleOverlay />}
      {phase === 'quiz' && <QuizOverlayPlaceholder />}
    </div>
  )
}

/**
 * アイドル状態のオーバーレイ（デバッグ・開発用）。
 * 本番ではタイトル画面に差し替える。
 */
function IdleOverlay() {
  const { transitionTo } = useGameStore()

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        color: 'white',
        background: 'rgba(0,0,0,0.7)',
        padding: '2rem',
        borderRadius: '1rem',
      }}
    >
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        🛸 宇宙人に英語を教えよう！
      </h1>
      <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#aaa' }}>
        （開発中 — トレーサーバレット）
      </p>
      <button
        onClick={() => transitionTo('playing')}
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          background: '#4ade80',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        プレイ開始
      </button>
    </div>
  )
}

/**
 * クイズオーバーレイのプレースホルダー。
 * Issue #6で本実装に差し替える。
 */
function QuizOverlayPlaceholder() {
  const { transitionTo, activeQuizTargetId } = useGameStore()

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
      }}
    >
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        クイズ: {activeQuizTargetId}
      </h2>
      <p style={{ color: '#aaa', marginBottom: '2rem' }}>
        （クイズUIはIssue #6で実装）
      </p>
      <button
        onClick={() => transitionTo('reward')}
        style={{
          padding: '0.75rem 2rem',
          fontSize: '1rem',
          background: '#60a5fa',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: 'pointer',
        }}
      >
        完了（仮）
      </button>
    </div>
  )
}

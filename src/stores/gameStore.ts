/**
 * ゲームのグローバル状態管理（Stateパターン + Zustand）。
 *
 * 設計方針:
 * - フェーズ遷移は必ず `transitionTo()` を経由する（直接setStateを呼ばない）
 * - useFrame内では `useGameStore.getState()` を使い、サブスクライブしない
 * - 必要なプロパティだけをセレクターで取得する（re-render最小化）
 *
 * @example
 * // コンポーネントでの使い方
 * const phase = useGameStore(s => s.phase)
 *
 * // useFrame内での使い方
 * const { phase } = useGameStore.getState()
 */
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { GamePhase } from '../types/game'
import { gameEvents } from '../lib/eventBus'

// ─────────────────────────────────────────────
// 許可されたフェーズ遷移の定義（Stateパターン）
// ─────────────────────────────────────────────

/**
 * 各フェーズから遷移可能な次フェーズの一覧。
 * 不正な遷移（例: idle→quiz）を実行時に検出して警告する。
 */
const VALID_TRANSITIONS: Record<GamePhase, readonly GamePhase[]> = {
  idle:     ['story', 'playing'],   // 初回はstory、2回目以降はplayingへ
  story:    ['tutorial'],
  tutorial: ['playing'],
  playing:  ['quiz'],
  quiz:     ['reward', 'playing'],  // 正誤に関わらずrewardへ、またはplayingに戻る
  reward:   ['playing'],
}

// ─────────────────────────────────────────────
// ストアの型定義
// ─────────────────────────────────────────────

interface GameState {
  /** 現在のゲームフェーズ */
  phase: GamePhase
  /** クイズ中の対象オブジェクトID */
  activeQuizTargetId: string | null
  /** フェーズを遷移させる（不正遷移はコンソール警告のみで続行） */
  transitionTo: (nextPhase: GamePhase) => void
  /** クイズを開始する */
  startQuiz: (targetId: string) => void
}

// ─────────────────────────────────────────────
// ストアの実装
// ─────────────────────────────────────────────

export const useGameStore = create<GameState>()(
  subscribeWithSelector((set, get) => ({
    phase: 'idle',
    activeQuizTargetId: null,

    transitionTo: (nextPhase) => {
      const { phase: currentPhase } = get()
      const allowed = VALID_TRANSITIONS[currentPhase]

      // 不正な遷移は警告して中断（クラッシュはさせない）
      if (!allowed.includes(nextPhase)) {
        console.warn(
          `[GameStore] 不正なフェーズ遷移: ${currentPhase} → ${nextPhase}。` +
          `許可された遷移先: ${allowed.join(', ')}`
        )
        return
      }

      // イベントバスにフェーズ変更を通知（他モジュールが購読できる）
      gameEvents.emit('phase:change', { from: currentPhase, to: nextPhase })

      set({ phase: nextPhase })
    },

    startQuiz: (targetId) => {
      const { transitionTo } = get()
      gameEvents.emit('quiz:start', { targetId })
      transitionTo('quiz')
      set({ activeQuizTargetId: targetId })
    },
  }))
)

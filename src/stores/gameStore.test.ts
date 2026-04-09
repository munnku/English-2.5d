/**
 * gameStore のテスト。
 * フェーズ遷移の振る舞いを公開インターフェース経由でテストする。
 * 実装の詳細（内部変数・プライベートメソッド）はテストしない。
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from './gameStore'

// 各テスト前にストアをリセットする
beforeEach(() => {
  useGameStore.setState({ phase: 'idle', activeQuizTargetId: null })
})

describe('gameStore — フェーズ遷移', () => {
  it('初期フェーズは idle である', () => {
    expect(useGameStore.getState().phase).toBe('idle')
  })

  it('idle → story への遷移が成功する', () => {
    useGameStore.getState().transitionTo('story')
    expect(useGameStore.getState().phase).toBe('story')
  })

  it('idle → quiz への不正遷移は無視される（phaseが変わらない）', () => {
    useGameStore.getState().transitionTo('quiz')
    expect(useGameStore.getState().phase).toBe('idle')
  })

  it('playing → quiz → reward → playing の正常フローが動作する', () => {
    useGameStore.setState({ phase: 'playing' })
    useGameStore.getState().transitionTo('quiz')
    expect(useGameStore.getState().phase).toBe('quiz')

    useGameStore.getState().transitionTo('reward')
    expect(useGameStore.getState().phase).toBe('reward')

    useGameStore.getState().transitionTo('playing')
    expect(useGameStore.getState().phase).toBe('playing')
  })
})

describe('gameStore — クイズ開始', () => {
  it('startQuiz を呼ぶとフェーズが quiz になり対象IDが設定される', () => {
    useGameStore.setState({ phase: 'playing' })
    useGameStore.getState().startQuiz('apple')

    const state = useGameStore.getState()
    expect(state.phase).toBe('quiz')
    expect(state.activeQuizTargetId).toBe('apple')
  })

  it('playing 以外から startQuiz を呼んでも phase は変わらない', () => {
    // idle状態からquizへの不正遷移
    useGameStore.getState().startQuiz('apple')
    expect(useGameStore.getState().phase).toBe('idle')
  })
})

/**
 * イベントバスのテスト。
 * Observerパターンの購読・発火・解除が正しく動作することを確認する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gameEvents } from './eventBus'

beforeEach(() => {
  // 各テスト後にイベントリスナーをクリア
  gameEvents.all.clear()
})

describe('gameEvents — イベントバス', () => {
  it('quiz:start イベントを発火すると購読者が受け取れる', () => {
    const handler = vi.fn()
    gameEvents.on('quiz:start', handler)

    gameEvents.emit('quiz:start', { targetId: 'apple' })

    expect(handler).toHaveBeenCalledOnce()
    expect(handler).toHaveBeenCalledWith({ targetId: 'apple' })
  })

  it('off で購読を解除するとイベントを受け取らなくなる', () => {
    const handler = vi.fn()
    gameEvents.on('quiz:start', handler)
    gameEvents.off('quiz:start', handler)

    gameEvents.emit('quiz:start', { targetId: 'apple' })

    expect(handler).not.toHaveBeenCalled()
  })

  it('複数の購読者が同じイベントを受け取れる', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    gameEvents.on('quiz:complete', handler1)
    gameEvents.on('quiz:complete', handler2)

    gameEvents.emit('quiz:complete', {
      result: { isCorrect: true, selectedIndex: 0, responseTimeMs: 1000 },
      wordId: 'apple',
    })

    expect(handler1).toHaveBeenCalledOnce()
    expect(handler2).toHaveBeenCalledOnce()
  })
})

/**
 * ゲーム全体のイベントバス（Observerパターン）。
 * コンポーネント間の直接依存を排除し、疎結合なイベント駆動設計を実現する。
 *
 * 使用方法:
 *   - 発火: gameEvents.emit('quiz:start', { targetId: 'apple' })
 *   - 購読: gameEvents.on('quiz:start', handler)
 *   - 解除: gameEvents.off('quiz:start', handler)
 */
import mitt from 'mitt'
import type { GameEvents } from '../types/game'

/**
 * mittのEventTypeはRecord<string | symbol, unknown>を要求するため、
 * GameEventsに文字列・シンボルインデックスシグネチャを追加した拡張型を使う。
 * これにより型安全性を保ちながらmittの制約を満たす。
 */
type MittCompatibleGameEvents = GameEvents & Record<string | symbol, unknown>

/** シングルトンのイベントバスインスタンス */
export const gameEvents = mitt<MittCompatibleGameEvents>()

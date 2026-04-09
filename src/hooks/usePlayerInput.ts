/**
 * プレイヤー入力の抽象化フック（Commandパターン）。
 *
 * なぜCommandパターンか:
 * MVPはタップ移動のみだが、将来キーボード・ゲームパッドを追加する際に
 * このフックだけを変更すればよく、他のコンポーネントへの影響がゼロになる。
 *
 * @returns 現在フレームでのプレイヤー入力コマンド
 */
import { useCallback } from 'react'
import type { Vector3 } from 'three'

/**
 * プレイヤーが発行できる入力コマンドの種類。
 * 将来の入力方式追加（キーボード・ゲームパッド）もここに追加するだけでよい。
 */
export type PlayerCommand =
  | { type: 'MOVE_TO'; destination: Vector3 }
  | { type: 'INTERACT'; targetId: string }
  | { type: 'NONE' }

/**
 * タップ/クリック座標を3D空間の目標地点に変換するユーティリティ。
 * R3Fのraycasting結果（worldPosition）をそのまま受け取る。
 */
export function createMoveCommand(worldPosition: Vector3): PlayerCommand {
  return { type: 'MOVE_TO', destination: worldPosition }
}

/**
 * オブジェクトIDからインタラクションコマンドを生成するユーティリティ。
 */
export function createInteractCommand(targetId: string): PlayerCommand {
  return { type: 'INTERACT', targetId }
}

/**
 * プレイヤー入力の処理フック。
 * UIイベント（タップ・クリック）をCommandに変換してゲームストアに渡す。
 */
export function usePlayerInput() {
  /**
   * 3D空間上のタップ座標を受け取り移動コマンドを発行する。
   * R3Fのonclick/onPointerDownコールバックから呼ばれる。
   */
  const handleTapMove = useCallback((worldPosition: Vector3) => {
    return createMoveCommand(worldPosition)
  }, [])

  /**
   * オブジェクトタップ時のインタラクションコマンドを発行する。
   */
  const handleInteract = useCallback((targetId: string) => {
    return createInteractCommand(targetId)
  }, [])

  return { handleTapMove, handleInteract }
}

/**
 * プレースホルダーシーン。
 * 実際の3Dアセットが揃うまでの骨格実装。
 * 宇宙人（ボックス）がタップした場所に移動し、
 * 食べ物オブジェクト（赤いボックス）をタップすると quiz:start イベントが発火する。
 *
 * なぜプレースホルダーを使うか:
 * アセット調達（Kenney.nl + Blender変換）が完了する前にゲームロジックを
 * テスト・検証できるようにするため。差し替えはこのファイルのみで完結する。
 */
import { useRef, useState, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Mesh } from 'three'
import { Vector3 } from 'three'
import { gameEvents } from '../../lib/eventBus'
import { useGameStore } from '../../stores/gameStore'

/** 宇宙人の移動速度（単位/秒） */
const ALIEN_SPEED = 3

/** プレースホルダー食べ物オブジェクトの定義 */
const FOOD_OBJECTS = [
  { id: 'apple', position: [2, 0, 1] as [number, number, number] },
  { id: 'banana', position: [-1, 0, 2] as [number, number, number] },
  { id: 'orange', position: [3, 0, -1] as [number, number, number] },
]

/**
 * プレースホルダーシーン全体。
 * 地面・宇宙人・食べ物オブジェクトを配置する。
 */
export function PlaceholderScene() {
  return (
    <>
      {/* 環境光（全体を均一に照らす） */}
      <ambientLight intensity={0.6} />
      {/* 方向光（影のために少し角度をつける） */}
      <directionalLight position={[5, 10, 5]} intensity={0.8} />

      {/* 地面（グリッド） */}
      <gridHelper args={[20, 20, '#444466', '#333355']} />

      {/* 宇宙人プレースホルダー */}
      <AlienPlaceholder />

      {/* 食べ物オブジェクトプレースホルダー */}
      {FOOD_OBJECTS.map((obj) => (
        <FoodObjectPlaceholder key={obj.id} id={obj.id} position={obj.position} />
      ))}

      {/* タップ移動のための透明な地面コライダー */}
      <GroundClickTarget />
    </>
  )
}

/**
 * 宇宙人プレースホルダー（緑のボックス）。
 * タップした場所に向かってスムーズに移動する。
 */
function AlienPlaceholder() {
  const meshRef = useRef<Mesh>(null)
  // 目標地点（タップした場所）
  const targetPosition = useRef(new Vector3(0, 0.5, 0))
  // 現在位置
  const currentPosition = useRef(new Vector3(0, 0.5, 0))

  // quiz:start イベントを受け取って移動を止める（クイズ中は動かない）
  const phase = useGameStore((s) => s.phase)

  useFrame((_, delta) => {
    if (!meshRef.current || phase === 'quiz' || phase === 'reward') return

    // 目標地点に向けてスムーズ移動（lerp）
    currentPosition.current.lerp(targetPosition.current, delta * ALIEN_SPEED)
    meshRef.current.position.copy(currentPosition.current)
  })

  // イベントバスから移動コマンドを受け取る
  // （GroundClickTargetがemitする'alien:move-to'カスタムイベントの代わりに
  //   ここではシンプルにstateで管理）
  const handleMoveTarget = useCallback((pos: Vector3) => {
    targetPosition.current.set(pos.x, 0.5, pos.z)
  }, [])

  // グローバルに移動先を設定できるようにする
  // （本番実装ではCommandパターンのキューを使う）
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__alienMoveTo = handleMoveTarget
  }

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      {/* 宇宙人の仮ボックス（緑色） */}
      <boxGeometry args={[0.6, 1, 0.6]} />
      <meshStandardMaterial color="#4ade80" />
    </mesh>
  )
}

/**
 * 食べ物オブジェクトプレースホルダー（赤いボックス）。
 * タップすると quiz:start イベントを発火する。
 */
function FoodObjectPlaceholder({
  id,
  position,
}: {
  id: string
  position: [number, number, number]
}) {
  const [hovered, setHovered] = useState(false)
  const { startQuiz } = useGameStore()

  const handleClick = useCallback(() => {
    startQuiz(id)
    gameEvents.emit('quiz:start', { targetId: id })
    console.log(`[PlaceholderScene] quiz:start イベント発火 — targetId: ${id}`)
  }, [id, startQuiz])

  return (
    <mesh
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[0.8, 0.8, 0.8]} />
      {/* ホバー時に明るくなることでインタラクティブだと伝える */}
      <meshStandardMaterial color={hovered ? '#fca5a5' : '#ef4444'} />
    </mesh>
  )
}

/**
 * タップ移動のための透明な地面コライダー。
 * クリック/タップした3D座標を取得して宇宙人を移動させる。
 */
function GroundClickTarget() {
  const { camera, raycaster } = useThree()

  const handleClick = useCallback(
    (event: { point: Vector3 }) => {
      // クイズ中は移動不可
      const { phase } = useGameStore.getState()
      if (phase === 'quiz' || phase === 'reward') return

      void camera // raycasterの型エラー回避
      void raycaster

      // グローバルに公開した移動コマンド関数を呼ぶ
      // （本番実装ではCommandパターンのキューに積む）
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const moveTo = (window as any).__alienMoveTo
      if (typeof moveTo === 'function') {
        moveTo(event.point)
      }
    },
    [camera, raycaster]
  )

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={handleClick}>
      {/* 透明な大きな地面（クリック検出用） */}
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial transparent opacity={0} />
    </mesh>
  )
}

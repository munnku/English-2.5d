/**
 * R3Fのメインキャンバスコンポーネント。
 * トップダウン2.5Dカメラを設定し、ゲームシーンをレンダリングする。
 *
 * なぜCanvasをラップするか:
 * カメラ設定・パフォーマンス設定（dpr・shadows）を一か所に集約し、
 * 将来のモバイル最適化変更を最小コストで行えるようにするため。
 */
import { Canvas } from '@react-three/fiber'
import { PlaceholderScene } from './PlaceholderScene'

/**
 * ゲームキャンバス。
 * dpr=[1,2] でモバイルの解像度を自動調整する。
 */
export function GameCanvas() {
  return (
    <Canvas
      // トップダウン視点のOrthographicカメラ設定
      orthographic
      camera={{
        position: [0, 10, 0],
        zoom: 50,
        near: 0.1,
        far: 100,
      }}
      // モバイル: dpr=1、PC: dpr=2 で自動調整（パフォーマンスとクオリティのバランス）
      dpr={[1, 2]}
      style={{ width: '100%', height: '100vh', background: '#1a1a2e' }}
    >
      <PlaceholderScene />
    </Canvas>
  )
}

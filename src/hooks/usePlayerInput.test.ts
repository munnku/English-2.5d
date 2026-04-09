/**
 * usePlayerInput のテスト。
 * Commandパターンの振る舞い（正しいコマンドが生成されるか）をテストする。
 */
import { describe, it, expect } from 'vitest'
import { Vector3 } from 'three'
import { createMoveCommand, createInteractCommand } from './usePlayerInput'

describe('PlayerInput — Commandパターン', () => {
  it('createMoveCommand は MOVE_TO コマンドを返す', () => {
    const destination = new Vector3(3, 0, 5)
    const command = createMoveCommand(destination)

    expect(command.type).toBe('MOVE_TO')
    if (command.type === 'MOVE_TO') {
      expect(command.destination).toBe(destination)
    }
  })

  it('createInteractCommand は INTERACT コマンドを返す', () => {
    const command = createInteractCommand('apple')

    expect(command.type).toBe('INTERACT')
    if (command.type === 'INTERACT') {
      expect(command.targetId).toBe('apple')
    }
  })

  it('異なる目標地点で別々のコマンドが生成される', () => {
    const pos1 = new Vector3(1, 0, 1)
    const pos2 = new Vector3(5, 0, 5)

    const cmd1 = createMoveCommand(pos1)
    const cmd2 = createMoveCommand(pos2)

    expect(cmd1.type).toBe('MOVE_TO')
    expect(cmd2.type).toBe('MOVE_TO')
    if (cmd1.type === 'MOVE_TO' && cmd2.type === 'MOVE_TO') {
      expect(cmd1.destination).not.toBe(cmd2.destination)
    }
  })
})

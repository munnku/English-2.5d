/**
 * バリデーションスキーマのテスト。
 * 正常データの通過と不正データの弾き方をテストする。
 */
import { describe, it, expect } from 'vitest'
import { SubmitAnswerRequestSchema, LearningObjectSchema } from './gameSchemas'

describe('SubmitAnswerRequestSchema — クイズ回答バリデーション', () => {
  const validRequest = {
    wordId: '550e8400-e29b-41d4-a716-446655440000',
    isCorrect: true,
    selectedIndex: 0,
    responseTimeMs: 1500,
  }

  it('正常なリクエストを通過させる', () => {
    const result = SubmitAnswerRequestSchema.safeParse(validRequest)
    expect(result.success).toBe(true)
  })

  it('UUIDでないwordIdを弾く', () => {
    const result = SubmitAnswerRequestSchema.safeParse({
      ...validRequest,
      wordId: 'not-a-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('200ms未満の回答時間（ボット疑い）を弾く', () => {
    const result = SubmitAnswerRequestSchema.safeParse({
      ...validRequest,
      responseTimeMs: 100,
    })
    expect(result.success).toBe(false)
  })

  it('範囲外の選択インデックス（4以上）を弾く', () => {
    const result = SubmitAnswerRequestSchema.safeParse({
      ...validRequest,
      selectedIndex: 4,
    })
    expect(result.success).toBe(false)
  })

  it('60秒を超える回答時間を弾く', () => {
    const result = SubmitAnswerRequestSchema.safeParse({
      ...validRequest,
      responseTimeMs: 61000,
    })
    expect(result.success).toBe(false)
  })
})

describe('LearningObjectSchema — 単語データバリデーション', () => {
  it('正常な学習オブジェクトを通過させる', () => {
    const result = LearningObjectSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      englishWord: 'apple',
      japaneseName: 'りんご',
      audioUrl: null,
      modelPath: 'placeholder:apple',
      category: 'food',
    })
    expect(result.success).toBe(true)
  })

  it('不正なカテゴリを弾く', () => {
    const result = LearningObjectSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      englishWord: 'apple',
      japaneseName: 'りんご',
      audioUrl: null,
      modelPath: 'placeholder:apple',
      category: 'invalid_category',
    })
    expect(result.success).toBe(false)
  })
})

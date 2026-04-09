/**
 * Zodによるバリデーションスキーマ。
 *
 * なぜZodを使うか:
 * フロントエンドはサーバーを信頼できないが、逆もまた然り。
 * APIレスポンス・ユーザー入力・Edge Functionへのリクエストを
 * 全てZodで検証することで、不正データによるバグを防ぐ。
 */
import { z } from 'zod'

// ─────────────────────────────────────────────
// 単語（LearningObject）のスキーマ
// ─────────────────────────────────────────────

export const WordCategorySchema = z.enum(['food', 'nature', 'vehicle', 'furniture'])

export const LearningObjectSchema = z.object({
  id: z.string().uuid(),
  englishWord: z.string().min(1).max(50),
  japaneseName: z.string().min(1).max(50),
  audioUrl: z.string().url().nullable(),
  modelPath: z.string().min(1),
  category: WordCategorySchema,
})

// ─────────────────────────────────────────────
// クイズ回答（Edge Functionへの送信データ）
// ─────────────────────────────────────────────

/**
 * クイズ回答のバリデーションスキーマ。
 * Edge Functionでこのスキーマを使って入力を検証し、
 * 改ざんされたデータを弾く。
 */
export const SubmitAnswerRequestSchema = z.object({
  /** 回答した単語のID（Supabase words.id） */
  wordId: z.string().uuid(),
  /** 正解かどうか */
  isCorrect: z.boolean(),
  /** 選択したインデックス（0〜3） */
  selectedIndex: z.number().int().min(0).max(3),
  /** 回答時間（ミリ秒。負の値や極端に短い値は不正） */
  responseTimeMs: z.number().int().min(200).max(60000),
})

export type SubmitAnswerRequest = z.infer<typeof SubmitAnswerRequestSchema>

// ─────────────────────────────────────────────
// SM-2アルゴリズムの計算結果
// ─────────────────────────────────────────────

export const SM2ResultSchema = z.object({
  nextReviewAt: z.string().datetime(),
  easinessFactor: z.number().min(1.3).max(2.5),
  intervalDays: z.number().int().min(1),
  repetitionCount: z.number().int().min(0),
})

export type SM2Result = z.infer<typeof SM2ResultSchema>

// ─────────────────────────────────────────────
// 報酬計算結果
// ─────────────────────────────────────────────

export const RewardResultSchema = z.object({
  coinsEarned: z.number().int().min(0),
  xpEarned: z.number().int().min(0),
  bonusMultiplier: z.number().min(1).max(3),
  reason: z.enum(['first_encounter', 'spaced_repetition', 'normal']),
})

export type RewardResult = z.infer<typeof RewardResultSchema>

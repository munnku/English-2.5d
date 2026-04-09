/**
 * Supabaseクライアントの初期化。
 *
 * なぜシングルトンにするか:
 * 複数のコンポーネントから同じクライアントを使い回すことで、
 * 接続数を最小化しパフォーマンスを保つため。
 *
 * セキュリティ注意:
 * VITE_SUPABASE_ANON_KEY は公開可能なキー（匿名ユーザー用）。
 * service_role_key は絶対にクライアントに露出させないこと。
 * 重要な操作（コイン更新・ガチャ抽選）はEdge Functionでのみ実行する。
 */
import { createClient } from '@supabase/supabase-js'
import type { Database } from './supabase.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase] 環境変数が設定されていません。' +
    '.env.local に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。'
  )
}

/**
 * アプリ全体で使用するSupabaseクライアント（シングルトン）。
 * Database型でスキーマの型安全性を保証する。
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

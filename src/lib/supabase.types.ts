/**
 * Supabaseスキーマの型定義。
 * 本来はSupabase CLIの `supabase gen types typescript` で自動生成するが、
 * 開発初期のため手動で定義する。
 *
 * スキーマが変わったら supabase/migrations/ のSQLと合わせてこのファイルも更新する。
 */

export interface Database {
  public: {
    Tables: {
      words: {
        Row: {
          id: string
          english_word: string
          japanese_name: string
          audio_url: string | null
          model_path: string
          category: string
          difficulty: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['words']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['words']['Insert']>
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          word_id: string
          easiness_factor: number
          interval_days: number
          repetition_count: number
          next_review_at: string
          last_reviewed_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_progress']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['user_progress']['Insert']>
      }
      user_currency: {
        Row: {
          user_id: string
          coins: number
          updated_at: string
        }
        Insert: Database['public']['Tables']['user_currency']['Row']
        Update: Partial<Database['public']['Tables']['user_currency']['Row']>
      }
      user_xp: {
        Row: {
          user_id: string
          xp_total: number
          level: number
          streak_days: number
          last_active_date: string | null
          updated_at: string
        }
        Insert: Database['public']['Tables']['user_xp']['Row']
        Update: Partial<Database['public']['Tables']['user_xp']['Row']>
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          earned_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_badges']['Row'], 'id' | 'earned_at'>
        Update: never
      }
      word_encyclopedia: {
        Row: {
          user_id: string
          word_id: string
          discovered_at: string
        }
        Insert: Database['public']['Tables']['word_encyclopedia']['Row']
        Update: never
      }
      gacha_probability_table: {
        Row: {
          id: string
          gacha_type: string
          rarity: string
          probability: number
          reward_type: string
          description: string | null
          updated_at: string
        }
        Insert: never  // 管理者のみ挿入可能
        Update: never
      }
      user_inventory: {
        Row: {
          id: string
          user_id: string
          item_type: string
          item_id: string
          is_equipped: boolean
          acquired_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_inventory']['Row'], 'id' | 'acquired_at'>
        Update: Partial<Pick<Database['public']['Tables']['user_inventory']['Row'], 'is_equipped'>>
      }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

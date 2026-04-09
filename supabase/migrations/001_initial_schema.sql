-- ============================================================
-- 初期スキーマ（マイグレーション 001）
-- 英語学習ゲームの全テーブルを定義する。
--
-- 設計方針:
-- - 全テーブルにRLS（Row Level Security）を有効化
-- - ユーザーデータは本人のみアクセス可能
-- - wordsとgacha_probability_tableは全ユーザーが読み取り可能（学習コンテンツのため）
-- ============================================================

-- ============================================================
-- 単語マスタ（コンテンツ管理者が管理・全ユーザー閲覧可）
-- ============================================================
CREATE TABLE IF NOT EXISTS words (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  english_word   TEXT NOT NULL,
  japanese_name  TEXT NOT NULL,
  audio_url      TEXT,                    -- nullの場合はWeb Speech APIを使用
  model_path     TEXT NOT NULL,           -- 3Dモデルのパスまたはプレースホルダー識別子
  category       TEXT NOT NULL,           -- 'food' | 'nature' | 'vehicle' | 'furniture'
  difficulty     INTEGER NOT NULL DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- wordsは全ユーザーが読み取り可能（学習コンテンツのため）
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
CREATE POLICY "words_public_read" ON words FOR SELECT USING (true);

-- ============================================================
-- ユーザー学習進捗（SM-2アルゴリズムのデータ）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word_id           UUID REFERENCES words(id) ON DELETE CASCADE NOT NULL,
  -- SM-2アルゴリズムのパラメータ
  easiness_factor   FLOAT NOT NULL DEFAULT 2.5,   -- 難易度係数（最小1.3）
  interval_days     INTEGER NOT NULL DEFAULT 1,   -- 次の復習までの日数
  repetition_count  INTEGER NOT NULL DEFAULT 0,   -- 正解した連続回数
  next_review_at    TIMESTAMPTZ NOT NULL DEFAULT now(), -- 次回復習日時
  last_reviewed_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, word_id)                       -- 1ユーザー1単語につき1レコード
);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_progress_own_data" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ユーザーインベントリ（ガチャで獲得したアイテム）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_inventory (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_type     TEXT NOT NULL,    -- 'hat' | 'outfit' | 'accessory' | 'streak_recovery'
  item_id       TEXT NOT NULL,    -- アイテムの識別子（例: 'hat_space_helmet'）
  is_equipped   BOOLEAN NOT NULL DEFAULT false,
  acquired_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_inventory_own_data" ON user_inventory
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ユーザー通貨（コイン残高）
-- コイン更新はEdge Functionのみ許可（クライアント直接更新禁止）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_currency (
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  coins         INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_currency ENABLE ROW LEVEL SECURITY;
-- 読み取りは本人のみ可能
CREATE POLICY "user_currency_own_read" ON user_currency
  FOR SELECT USING (auth.uid() = user_id);
-- 書き込みはEdge Function（service role）のみ。クライアントは更新不可。

-- ============================================================
-- ユーザーXP・レベル・ストリーク
-- ============================================================
CREATE TABLE IF NOT EXISTS user_xp (
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  xp_total          INTEGER NOT NULL DEFAULT 0 CHECK (xp_total >= 0),
  level             INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  -- 全レベルで同じXP（100XP/レベル）なのでlevel = floor(xp_total / 100) + 1
  streak_days       INTEGER NOT NULL DEFAULT 0 CHECK (streak_days >= 0),
  last_active_date  DATE,                     -- ストリーク計算の基準日
  updated_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_xp_own_read" ON user_xp
  FOR SELECT USING (auth.uid() = user_id);
-- 書き込みはEdge Function（service role）のみ

-- ============================================================
-- ユーザーバッジ
-- ============================================================
CREATE TABLE IF NOT EXISTS user_badges (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  badge_id    TEXT NOT NULL,       -- バッジ識別子（例: 'tutorial_complete'）
  earned_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, badge_id)       -- 同じバッジは1回のみ付与
);

ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_own_data" ON user_badges
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 単語図鑑（発見済み単語の管理）
-- ============================================================
CREATE TABLE IF NOT EXISTS word_encyclopedia (
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word_id       UUID REFERENCES words(id) ON DELETE CASCADE NOT NULL,
  discovered_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, word_id)
);

ALTER TABLE word_encyclopedia ENABLE ROW LEVEL SECURITY;
CREATE POLICY "encyclopedia_own_data" ON word_encyclopedia
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- ガチャ確率テーブル（全ユーザー閲覧可能・確率公開のため）
-- ============================================================
CREATE TABLE IF NOT EXISTS gacha_probability_table (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gacha_type   TEXT NOT NULL,       -- 'stardrop' | 'standard'
  rarity       TEXT NOT NULL,       -- 'common' | 'rare' | 'epic' | 'legendary'
  probability  FLOAT NOT NULL CHECK (probability > 0 AND probability <= 1),
  reward_type  TEXT NOT NULL,       -- 'coins' | 'item' | 'decoration'
  description  TEXT,                -- ユーザー向けの説明
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- 確率テーブルは全ユーザーが閲覧可能（ホワイトハット設計: 確率を隠さない）
ALTER TABLE gacha_probability_table ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gacha_probability_public_read" ON gacha_probability_table
  FOR SELECT USING (true);

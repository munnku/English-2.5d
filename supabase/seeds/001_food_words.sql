-- ============================================================
-- 食べ物カテゴリ単語シードデータ（MVP: 35単語）
-- MVPのターゲットは30〜50単語。
-- model_pathは暫定的にプレースホルダー識別子を使用し、
-- Kenney.nlのアセット取得後に実際のglbパスに更新する。
-- ============================================================

INSERT INTO words (english_word, japanese_name, audio_url, model_path, category, difficulty) VALUES
  -- 難易度1: 基本的な食べ物（子供でも知っている）
  ('apple',      'りんご',         NULL, 'placeholder:apple',      'food', 1),
  ('banana',     'バナナ',         NULL, 'placeholder:banana',     'food', 1),
  ('orange',     'オレンジ',       NULL, 'placeholder:orange',     'food', 1),
  ('bread',      'パン',           NULL, 'placeholder:bread',      'food', 1),
  ('milk',       'ぎゅうにゅう',   NULL, 'placeholder:milk',       'food', 1),
  ('egg',        'たまご',         NULL, 'placeholder:egg',        'food', 1),
  ('rice',       'ごはん',         NULL, 'placeholder:rice',       'food', 1),
  ('water',      'みず',           NULL, 'placeholder:water',      'food', 1),
  ('cake',       'ケーキ',         NULL, 'placeholder:cake',       'food', 1),
  ('cookie',     'クッキー',       NULL, 'placeholder:cookie',     'food', 1),

  -- 難易度1: 野菜
  ('carrot',     'にんじん',       NULL, 'placeholder:carrot',     'food', 1),
  ('tomato',     'トマト',         NULL, 'placeholder:tomato',     'food', 1),
  ('potato',     'じゃがいも',     NULL, 'placeholder:potato',     'food', 1),
  ('onion',      'たまねぎ',       NULL, 'placeholder:onion',      'food', 1),
  ('corn',       'とうもろこし',   NULL, 'placeholder:corn',       'food', 1),

  -- 難易度2: 少し難しい食べ物
  ('strawberry', 'いちご',         NULL, 'placeholder:strawberry', 'food', 2),
  ('grape',      'ぶどう',         NULL, 'placeholder:grape',      'food', 2),
  ('watermelon', 'すいか',         NULL, 'placeholder:watermelon', 'food', 2),
  ('pineapple',  'パイナップル',   NULL, 'placeholder:pineapple',  'food', 2),
  ('cherry',     'さくらんぼ',     NULL, 'placeholder:cherry',     'food', 2),
  ('lemon',      'レモン',         NULL, 'placeholder:lemon',      'food', 2),
  ('peach',      'もも',           NULL, 'placeholder:peach',      'food', 2),
  ('melon',      'メロン',         NULL, 'placeholder:melon',      'food', 2),
  ('cheese',     'チーズ',         NULL, 'placeholder:cheese',     'food', 2),
  ('butter',     'バター',         NULL, 'placeholder:butter',     'food', 2),

  -- 難易度2: 料理・加工食品
  ('pizza',      'ピザ',           NULL, 'placeholder:pizza',      'food', 2),
  ('hamburger',  'ハンバーガー',   NULL, 'placeholder:hamburger',  'food', 2),
  ('sandwich',   'サンドイッチ',   NULL, 'placeholder:sandwich',   'food', 2),
  ('salad',      'サラダ',         NULL, 'placeholder:salad',      'food', 2),
  ('soup',       'スープ',         NULL, 'placeholder:soup',       'food', 2),

  -- 難易度3: やや難しい単語
  ('broccoli',   'ブロッコリー',   NULL, 'placeholder:broccoli',   'food', 3),
  ('mushroom',   'きのこ',         NULL, 'placeholder:mushroom',   'food', 3),
  ('eggplant',   'なす',           NULL, 'placeholder:eggplant',   'food', 3),
  ('cucumber',   'きゅうり',       NULL, 'placeholder:cucumber',   'food', 3),
  ('pumpkin',    'かぼちゃ',       NULL, 'placeholder:pumpkin',    'food', 3)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ガチャ確率テーブル初期データ（スタードロップ）
-- 確率は全て公開（ホワイトハット設計）
-- ============================================================
INSERT INTO gacha_probability_table (gacha_type, rarity, probability, reward_type, description) VALUES
  ('stardrop', 'common',    0.60, 'coins',       '60%: コインを獲得（5〜20枚）'),
  ('stardrop', 'rare',      0.25, 'item',        '25%: 小アイテムを獲得'),
  ('stardrop', 'epic',      0.12, 'decoration',  '12%: 宇宙人の装飾品を獲得'),
  ('stardrop', 'legendary', 0.03, 'decoration',  '3%: レアな宇宙人の装飾品を獲得')
ON CONFLICT DO NOTHING;

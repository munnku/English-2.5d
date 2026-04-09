/**
 * ゲーム全体で共有する型定義。
 * このファイルを中心に型を管理することで、変更の影響範囲を一か所に集約する。
 */

// ─────────────────────────────────────────────
// ゲームフェーズ（Stateパターンの状態一覧）
// ─────────────────────────────────────────────

/**
 * ゲームの進行フェーズ。
 * Stateパターンで管理し、不正な遷移をコンパイル時に検出できるようにする。
 */
export type GamePhase =
  | 'idle'      // アプリ初期化中
  | 'story'     // ストーリー・ビジュアルノベル表示中
  | 'tutorial'  // チュートリアル実行中
  | 'playing'   // マップ探索中
  | 'quiz'      // クイズオーバーレイ表示中
  | 'reward'    // スタードロップ・報酬演出中

// ─────────────────────────────────────────────
// 学習オブジェクト（LearningObjectインターフェース）
// ─────────────────────────────────────────────

/**
 * ゲーム内の全学習対象オブジェクト（リンゴ・犬・車など）が実装する基底インターフェース。
 * 新カテゴリ・エリアの追加はこのインターフェースを実装するだけでよい（OCP原則）。
 */
export interface LearningObject {
  /** ユニークID（Supabase wordsテーブルのID） */
  readonly id: string
  /** 英語の単語（例: "apple"） */
  readonly englishWord: string
  /** 日本語名（例: "りんご"） */
  readonly japaneseName: string
  /** 音声ファイルURL（Web Speech APIを使う場合はnull） */
  readonly audioUrl: string | null
  /** 3Dモデルのglbファイルパスまたはプレースホルダー識別子 */
  readonly modelPath: string
  /** 所属カテゴリ（エリアとの対応に使う） */
  readonly category: WordCategory
}

/**
 * 単語カテゴリ。
 * エリアと1対1で対応させることで、エリアごとに学ぶ単語を管理する。
 */
export type WordCategory =
  | 'food'       // 食べ物（MVP: 町エリア）
  | 'nature'     // 自然（Phase 2: 公園エリア）
  | 'vehicle'    // 乗り物（Phase 2: 駅エリア）
  | 'furniture'  // 家具（Phase 3: 家エリア）

// ─────────────────────────────────────────────
// クイズ（QuizEngineの型）
// ─────────────────────────────────────────────

/**
 * クイズ1問分のデータ。
 * QuizStrategyが生成し、UIコンポーネントに渡す。
 */
export interface QuizQuestion {
  /** 問題対象の学習オブジェクト */
  readonly target: LearningObject
  /** 4択の選択肢（正解1つ + 誤答3つ） */
  readonly choices: readonly LearningObject[]
  /** 正解インデックス（0〜3） */
  readonly correctIndex: number
}

/**
 * クイズの回答結果。
 * UIから受け取りEdge Functionに送信する。
 */
export interface QuizResult {
  /** 正解かどうか */
  readonly isCorrect: boolean
  /** 選択したインデックス（0〜3） */
  readonly selectedIndex: number
  /** 回答にかかった時間（ミリ秒） */
  readonly responseTimeMs: number
}

// ─────────────────────────────────────────────
// 報酬（RewardSystemの型）
// ─────────────────────────────────────────────

/**
 * スタードロップのレア度。
 * Brawl Starsと同様に、タップするたびに確率で上位レア度に昇格する。
 */
export type StarDropRarity = 'common' | 'rare' | 'epic' | 'legendary'

/**
 * スタードロップの報酬内容。
 */
export type StarDropReward =
  | { type: 'coins'; amount: number }
  | { type: 'item'; itemId: string }
  | { type: 'decoration'; decorationId: string }

// ─────────────────────────────────────────────
// エリア（WorldMapの型）
// ─────────────────────────────────────────────

/**
 * マップエリアの定義。
 * 設定データとして管理し、新エリア追加時はコード変更不要にする。
 */
export interface AreaDefinition {
  /** エリアID */
  readonly id: string
  /** 表示名 */
  readonly displayName: string
  /** 対応する単語カテゴリ */
  readonly category: WordCategory
  /** アンロック条件（undefinedの場合は最初からアンロック済み） */
  readonly unlockCondition?: AreaUnlockCondition
  /** 3Dシーンのパス */
  readonly scenePath: string
}

/**
 * エリアのアンロック条件。
 */
export interface AreaUnlockCondition {
  /** 必要な習得単語数 */
  readonly requiredWordCount: number
  /** 前提エリアID */
  readonly requiredAreaId?: string
}

// ─────────────────────────────────────────────
// イベントバス（mittのイベント型定義）
// ─────────────────────────────────────────────

/**
 * ゲーム内で流れる全イベントの型定義。
 * mittのジェネリクスに渡すことで、イベント名とペイロードを型安全にする。
 */
export interface GameEvents {
  /** クイズ開始（対象オブジェクトをタップした時） */
  'quiz:start': { targetId: string }
  /** クイズ完了（正誤に関わらず） */
  'quiz:complete': { result: QuizResult; wordId: string }
  /** ゲームフェーズ変更 */
  'phase:change': { from: GamePhase; to: GamePhase }
  /** コイン獲得 */
  'coins:earned': { amount: number; reason: 'quiz_correct' | 'daily_bonus' | 'streak_bonus' }
  /** XP獲得 */
  'xp:earned': { amount: number }
  /** レベルアップ */
  'level:up': { newLevel: number }
  /** バッジ獲得 */
  'badge:earned': { badgeId: string }
  /** 新単語発見（図鑑に追加） */
  'word:discovered': { wordId: string }
}

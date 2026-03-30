# CLAUDE.md — English Learning Game 開発ガイドライン

このファイルは Claude Code が**全ての作業を開始する前に必ず読む**プロジェクト憲法です。
コード生成・修正・設計をする際は常にこのドキュメントの原則に従ってください。

---

## プロジェクト概要

**トップダウン視点2.5D英語学習ゲーム（Webブラウザ動作）**

- ターゲット: 子供（小学生）+ その親
- プラットフォーム: Web (PC + モバイル)
- 技術スタック: React Three Fiber (R3F) + TypeScript + Supabase

---

## ドキュメント構成（詳細はこちらを参照）

| ファイル | 内容 |
|---------|------|
| [docs/08_r3f_tech_stack.md](docs/08_r3f_tech_stack.md) | R3F技術スタック詳細・カメラ設定・パフォーマンス最適化 |
| [docs/09_design_patterns_and_oop.md](docs/09_design_patterns_and_oop.md) | **GoFパターン・SOLID原則・OOP設計ルール（必読）** |
| [docs/10_cicd_dev_flow.md](docs/10_cicd_dev_flow.md) | CI/CD・テスト戦略・ブランチ戦略・開発フロー |
| [docs/11_security_requirements.md](docs/11_security_requirements.md) | **セキュリティ要件（チート対策・認証・決済）（必読）** |
| [docs/01_tech_stack.md](docs/01_tech_stack.md) | 初期技術スタック調査 |
| [docs/02_risks_and_security.md](docs/02_risks_and_security.md) | 法的リスク・COPPA・個人情報保護 |
| [docs/03_oop_benefits.md](docs/03_oop_benefits.md) | OOPメリット・ECSとの比較 |
| [docs/04_how_to_leverage_oop.md](docs/04_how_to_leverage_oop.md) | GoFパターン詳細・SOLID原則 |
| [docs/05_business_expansion.md](docs/05_business_expansion.md) | ビジネス展開戦略 |
| [docs/06_monetization_strategy.md](docs/06_monetization_strategy.md) | マネタイズ戦略 |
| [docs/07_marketing_research.md](docs/07_marketing_research.md) | マーケティング調査 |

---

## 必須技術スタック（変更禁止）

```
Vite + React 18 + TypeScript
├── @react-three/fiber (R3F v8)
├── @react-three/drei
├── @react-three/rapier (物理エンジン)
├── Zustand + subscribeWithSelector
├── howler.js (音声)
├── react-i18next (UI国際化)
├── zod (バリデーション)
└── Supabase (BaaS)
```

---

## 設計原則（常に守ること）

### 1. アーキテクチャ原則

- **Composition over Inheritance**: 継承ツリーを深くしない。React Hooks で機能を合成する
- **単一責任の原則 (SRP)**: 1コンポーネント = 1責任（描画/物理/入力/音声を分離）
- **ECSは使わない**: 小中規模Webゲームにはオーバーエンジニアリング

### 2. GoFパターン（積極的に使う）

| パターン | 使用場面 |
|---------|---------|
| **State** | ゲームフェーズ管理（idle→playing→question→gameover） |
| **Observer** | クロスコンポーネントイベント（mitt イベントバス経由） |
| **Command** | プレイヤー入力の抽象化・キーコンフィグ対応 |
| **Strategy** | 問題タイプの切り替え（多肢選択/穴埋め/マッチング） |

### 3. R3F 特有のルール

- `useFrame` 内では React state を経由せず Three.js オブジェクトを**直接更新**（re-render回避）
- `useGameStore.getState()` を `useFrame` 内で使う（サブスクライブしない）
- セレクターで必要なプロパティのみをサブスクライブする

```tsx
// NG
const state = useGameStore()  // 全てサブスクライブ → 毎回re-render

// OK
const score = useGameStore(s => s.score)  // 必要なものだけ
```

### 4. 禁止事項

- `any` 型の使用
- 3階層以上の継承
- コンポーネントをまたぐ直接的な副作用（必ず `gameEvents.emit()` を経由）
- `dangerouslySetInnerHTML` の使用
- `service role key` のクライアントへの露出
- スコア・進捗のクライアントサイドのみでの更新（必ずサーバー検証）

---

## セキュリティ原則（開発中常に意識）

> **フロントエンドは信頼できない。重要なデータは必ずサーバーサイドで検証する。**

1. 認証: Supabase Auth に完全委任（自作しない）
2. スコア提出: Edge Function で必ず検証（時間・レート・ログ整合性）
3. DB操作: Row Level Security (RLS) で本人のみのアクセスを保証
4. 決済: Stripe Webhook → Edge Function → 署名検証後にアンロック
5. 子供データ: ニックネームのみ収集（COPPA準拠）

詳細: [docs/11_security_requirements.md](docs/11_security_requirements.md)

---

## CI/CD フロー

```
feature/ ブランチ
  → pre-commit (Husky: lint + prettier)
  → PR作成
  → GitHub Actions CI (型チェック + テスト + ビルド)
  → Vercel Preview Deploy
  → レビュー → develop/main マージ
  → 本番デプロイ
```

**テストカバレッジ基準**:
- ゲームロジック（ストア・フック）: 80%以上
- UIコンポーネント: 60%以上

詳細: [docs/10_cicd_dev_flow.md](docs/10_cicd_dev_flow.md)

---

## パフォーマンス目標

- 初期ロード: 3秒以内（モバイル 4G回線）
- ゲームFPS: 60fps (PC) / 30fps以上 (モバイル)
- バンドルサイズ: メインチャンク 500KB 以下（gzip後）

最適化手法: Instances でドローコール削減、LOD使用、`dpr={[1, 2]}` でモバイル対応

---

## コード品質基準

- **TypeScript strict モード**（`tsconfig.json` で `"strict": true`）
- コンポーネントが200行を超えたら分割を検討
- 1ファイル1責任
- テストファイルは実装ファイルと同じディレクトリに置く（`.test.tsx`）

---

## フォルダ構成

```
src/
├── components/
│   ├── game/       # 3Dゲームコンポーネント（R3F）
│   └── ui/         # HTML/CSS UIコンポーネント
├── hooks/          # カスタムフック（ゲームロジック）
├── stores/         # Zustand ストア
├── types/          # TypeScript 型定義（game.ts を中心に）
├── lib/
│   ├── audio/      # AudioManager (Singleton)
│   ├── crypto/     # セーブデータ暗号化
│   ├── eventBus.ts # Observer (mitt)
│   └── validation/ # Zod スキーマ
├── content/        # 英語学習コンテンツデータ（UIと完全分離）
├── i18n/           # 国際化設定
└── test/           # テスト設定・ヘルパー
```

---

## 開発サイクルのルール

1. 新機能開始前: `feature/` ブランチを切り、必要なら `docs/` に設計メモ
2. TDDを推奨: ゲームロジック（ストア・フック）はテストを先に書く
3. 実装前に: このCLAUDE.mdとdocs/09（設計原則）を確認
4. PR前に: `npm run type-check` と `npm run test:coverage` をローカルで通す
5. セキュリティ: 機能実装のたびに `docs/11_security_requirements.md` のチェックリストを確認

---

*最終更新: 2026-03-29*

# セキュリティ要件（ゲーム特有 + Web一般）

本ドキュメントは、このゲームプロジェクトにおける**すべてのセキュリティ要件**を定義します。
要件定義フェーズで一度決めておき、開発全体を通じて常に参照すること。

---

## 1. セキュリティの大原則

> **「フロントエンドは信頼できない。重要なデータはサーバーサイドで検証する」**

クライアント側（ブラウザ）で行うことはすべてユーザーに見え、改ざん可能である。
スコア・進捗・課金状態の判定は**必ずサーバーサイド（Supabase Edge Functions）で行う**。

---

## 2. 認証・ユーザー管理

### 方針
- 認証実装は **Supabase Auth に完全委任**（自作しない）
- パスワードはハッシュ化された状態で保管（自動対応）

### 子供向けアカウント設計（COPPA/個人情報保護法対応）
```
親アカウント（メールアドレス・パスワード）
  └─ 子供プロフィール（ニックネームのみ。本名・メアド不要）
```
- 13歳未満の子供から直接個人情報を取得しない
- Netflixのキッズアカウント方式を参考にする

### JWT トークン管理
- `service role key` は絶対にクライアントに公開しない
- クライアントには `anon key` のみを使う（`.env` で `VITE_` プレフィックスで管理）
- セッションの有効期限はSupabaseのデフォルト設定を使用

---

## 3. ゲームデータのチート対策（多層防御）

### Layer 1: クライアントサイド（軽微な抑止）
- スコアの直接書き換えを難しくする（難読化）
- ゲームロジックは UI から分離してテスト可能に保つ

### Layer 2: サーバーサイド検証（Supabase Edge Functions）
```
スコア提出時の検証項目:
1. ゲーム時間に対してスコアが物理的に不可能でないか
   （例: 1秒あたり最大10点 × ゲーム時間 ≥ 提出スコア）
2. アクションログの整合性チェック（クライアントからログを送信）
3. 連続送信・ボット検出（レートリミット）
```

### Layer 3: データベース制約（Supabase RLS）
```sql
-- スコアの直接INSERTをクライアントから禁止
CREATE POLICY "No direct insert from client"
  ON scores FOR INSERT WITH CHECK (false);
-- Edge Function（Service Role）経由のみ許可

-- ユーザーは自分のデータのみ参照可能
CREATE POLICY "Own data only"
  ON user_progress USING (auth.uid() = user_id);
```

---

## 4. 決済セキュリティ

### 方針
- 決済は **Stripe Checkout** を使用（カード情報が自サーバーを通過しない）
- 決済完了の確認は **Stripe Webhook → Edge Function** 経由で行う

### 課金回避攻撃への対策
```
❌ NG（脆弱）: クライアントの「決済完了」シグナルを信じてアンロック
✅ OK（安全）: Stripe Webhook → Edge Function → 署名検証 → DB更新 → アンロック
```

### 資金決済法対応
- ゲーム内通貨を有償で販売しない
- 課金は「月額サブスク」または「アイテム直接購入」のみ
（「コイン」→「アイテム」の2段階は資金決済法の対象になるリスクあり）

---

## 5. Content Security Policy (CSP)

WebGL + WebAssembly（Rapier）対応のCSP設定:

**vercel.json**:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com; worker-src blob:; child-src blob:; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'"
        },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(self), geolocation=()" }
      ]
    }
  ]
}
```

**ポイント**:
- `wasm-unsafe-eval`: Rapier (WebAssembly) に必要（`unsafe-eval` より安全）
- `blob:`: Three.js の動的シェーダーコンパイル・Worker に必要
- `microphone=(self)`: 音声認識（発音チェック機能）に必要

---

## 6. セーブデータの整合性

```ts
// セーブデータ保存時
const checksum = await generateChecksum(saveData)  // SHA-256
localStorage.setItem('game-save', JSON.stringify({ ...saveData, checksum }))

// ロード時
const loaded = JSON.parse(localStorage.getItem('game-save'))
const { checksum, ...data } = loaded
const isValid = (await generateChecksum(data)) === checksum
// 改ざん検出時はサーバーのデータで上書き
```

**注意**: ローカルストレージの整合性チェックは**デバッグ困難化・軽微な改ざん防止**のみ。
重要な進捗・スコアは**必ずSupabaseにも同期する**（サーバーが正**となる）。

---

## 7. データバリデーション（Zodスキーマ）

クライアントからサーバーに送る**全てのデータは Zod でバリデーション**する:

```ts
// lib/validation/schemas.ts
export const ScoreSubmissionSchema = z.object({
  userId:       z.string().uuid(),
  score:        z.number().int().min(0).max(9999),
  gameDuration: z.number().positive().max(300),    // 最大5分
  level:        z.number().int().min(1).max(100),
  actions:      z.array(ActionSchema).max(10000),  // アクションログ上限
})

export const UserProgressSchema = z.object({
  userId:           z.string().uuid(),
  completedLessons: z.array(z.string()).max(1000),
  unlockedWords:    z.array(z.string()).max(10000),
  level:            z.number().int().min(1).max(100),
})
```

---

## 8. XSS・CSRF 対策

- XSS: React/Vite の標準機能で防御済み（JSX はデフォルトエスケープ）
- CSRF: Supabase Auth の JWT ベース認証のため、セッションCookieを使わないので CSRF リスクが低い
- ただし `dangerouslySetInnerHTML` は**絶対に使用禁止**

---

## 9. 個人情報・プライバシー（COPPA / 個人情報保護法）

| 収集データ | 保存先 | 注意 |
|-----------|--------|------|
| 親のメールアドレス | Supabase Auth | 必須。目的以外に使用しない |
| 子供のニックネーム | Supabase DB | ニックネームのみ。本名不可 |
| 学習進捗・スコア | Supabase DB | RLSで本人のみ閲覧 |
| ゲームログ（チート検証用） | Edge Function で処理後破棄 | 長期保存しない |

- **チャット・フリーテキスト機能は実装しない**（定型文スタンプのみ）
- プライバシーポリシーに収集データと目的を明記する

---

## 10. 特定商取引法対応

有料サービス（サブスク・アイテム販売）を提供する場合:
- **バーチャルオフィスの住所・電話番号を使用**（実家の住所は公開しない）
- 表記必須項目: 事業者名、住所、電話番号、価格、支払方法、返品ポリシー

---

## 11. セキュリティチェックリスト（機能実装時）

機能を実装するたびに以下を確認:

- [ ] 認証が必要なエンドポイントに認証チェックがあるか
- [ ] ユーザーが他人のデータにアクセスできないか（RLS確認）
- [ ] ユーザー入力はバリデーション済みか（Zod）
- [ ] サーバーサイドで重要ロジックを検証しているか
- [ ] 環境変数にシークレットが含まれていないか（`VITE_` 以外はクライアントに露出しない）
- [ ] `dangerouslySetInnerHTML` を使っていないか
- [ ] 子供データの取り扱いがCOPPA準拠か

---

*最終更新: 2026-03-29*

# VRChat Photo Journey リファクタリング計画

## 概要

コードベース分析により特定されたリファクタリング候補の優先順位付けと実施計画です。

## 🚨 高優先度（High Priority）

### 1. LocationGroupHeader.tsx の分割 (733行)

**現在の問題:**
- 単一コンポーネントに以下の機能が集約されている:
  - プレビュー生成機能
  - 画像シェア機能
  - コンテキストメニュー
  - ダウンロード機能
  - UI状態管理

**リファクタリング提案:**
```
src/v2/components/LocationGroupHeader/
├── index.tsx                 # メインコンポーネント (100-150行)
├── PreviewGenerator.tsx      # プレビュー生成機能
├── ShareDialog.tsx          # シェア機能ダイアログ
├── ContextMenu.tsx          # コンテキストメニュー
└── hooks/
    ├── usePreviewGeneration.ts
    └── useShareActions.ts
```

**期待効果:**
- 保守性の大幅向上
- テスト容易性の向上
- 機能の再利用性向上

### 2. vrchatLog/service.ts の分割 (639行)

**現在の問題:**
- ログファイル処理、パース処理、DB操作が混在
- 単一ファイルに複数の責任

**リファクタリング提案:**
```
electron/module/vrchatLog/
├── service.ts               # 公開API (100-150行)
├── parsers/
│   ├── worldJoinParser.ts   # ワールド参加ログパーサー
│   ├── playerActionParser.ts # プレイヤーアクションパーサー
│   └── baseParser.ts        # 共通パーサーロジック
├── fileHandlers/
│   ├── logFileReader.ts     # ログファイル読み込み
│   └── logStorageManager.ts # ログストレージ管理
└── dbOperations/
    └── logDbWriter.ts       # DB書き込み操作
```

**期待効果:**
- 単一責任原則の遵守
- デバッグ効率の向上
- テスト粒度の細分化

### 3. useStartUpStage.ts の簡素化 (363行)

**現在の問題:**
- console.log が19箇所で過多
- 複雑な状態管理ロジック
- エラーハンドリングとログ同期が混在

**リファクタリング提案:**
```
src/v2/hooks/startup/
├── useStartUpStage.ts       # メインフック (150-200行)
├── useLogSync.ts           # ログ同期専用 (既存)
├── useErrorTracking.ts     # エラー追跡
└── useStartupLogger.ts     # 構造化ログ管理
```

**期待効果:**
- デバッグ効率の向上
- フックの再利用性向上
- ログ出力の構造化

## 🔶 中優先度（Medium Priority）

### 4. previewGenerator.ts の機能分割 (510行)

**現在の問題:**
- Canvas操作、画像生成、レイアウト計算が混在
- 複雑な描画ロジック

**リファクタリング提案:**
```
src/v2/utils/preview/
├── previewGenerator.ts      # 公開API
├── layoutCalculator.ts      # レイアウト計算
├── canvasRenderer.ts        # Canvas描画
└── imageProcessor.ts        # 画像処理
```

### 5. PhotoCard.tsx の最適化 (408行)

**現在の問題:**
- useMemo/useCallback の過剰使用 (4箇所)
- 複雑なレンダリングロジック

**リファクタリング提案:**
- メモ化の必要性再評価
- サブコンポーネントへの分割
- パフォーマンス測定による最適化

### 6. PathSettings.tsx の分離 (395行)

**現在の問題:**
- UI表示とビジネスロジックが混在

**リファクタリング提案:**
```
src/v2/components/settings/
├── PathSettings.tsx         # UI層
└── hooks/
    └── usePathSettings.ts   # ビジネスロジック
```

## 🔷 低優先度（Low Priority）

### 7. electronUtil.ts の FIXME 対応

**問題箇所:**
```typescript
// FIXME: このexport はやめたい (line 201)
```

**対応:**
- 不適切なexportパターンの見直し
- 適切なAPIインターフェース設計

### 8. TypeScript 型安全性強化

**対象ファイル:**
- 複数ファイルでの `any` 型使用
- `unknown` 型の適切な活用

**対応:**
- 具体的な型定義への置き換え
- 型ガードの実装

### 9. console.log の整理

**対象ファイル:**
- useStartUpStage.ts (19箇所)
- その他デバッグログ過多ファイル

**対応:**
- 構造化ログへの移行
- 開発/本番環境でのログレベル分離

## 実施スケジュール

### Phase 1: アーキテクチャ改善 (2-3週間)
1. **LocationGroupHeader.tsx 分割**
   - 最も効果が大きく、他コンポーネントのお手本となる
   - 完了後、他の大きなコンポーネント分割の参考にする

2. **useStartUpStage.ts のログ整理**
   - デバッグ効率の大幅改善
   - 構造化ログパターンの確立

### Phase 2: サービス層改善 (2-3週間)
3. **vrchatLog/service.ts 分割**
   - アーキテクチャの健全性向上
   - 他のサービス層への適用

### Phase 3: パフォーマンス最適化 (1-2週間)
4. **PhotoCard.tsx 最適化**
   - ユーザー体験の向上
   - パフォーマンス測定とベンチマーク

### Phase 4: 継続的改善 (随時)
5. **型安全性向上**
6. **その他の技術的負債解消**

## 成功指標

### 定量的指標
- **ファイルサイズ**: 500行を超えるファイルを50%削減
- **テストカバレッジ**: 新規分割されたモジュールで80%以上
- **TypeScript厳密度**: `any` 型使用を50%削減

### 定性的指標
- **開発者体験**: コード理解時間の短縮
- **デバッグ効率**: 問題特定時間の短縮
- **保守性**: 新機能追加時の影響範囲の明確化

## 注意事項

### リファクタリング実施時の原則
1. **CLAUDE.md のガイドライン遵守**
   - ログ同期アーキテクチャの保持
   - データ整合性の確保

2. **既存テストの保持**
   - リファクタリング前にテスト実行
   - 分割後も同じテストが通ることを確認

3. **段階的実装**
   - 一度に大きく変更せず、小さな単位で進める
   - 各段階でテストとレビューを実施

4. **パフォーマンス測定**
   - リファクタリング前後でベンチマーク実施
   - パフォーマンス劣化がないことを確認

### リスク管理
- **データ整合性**: ログ同期処理は特に慎重に
- **UI/UX**: ユーザー体験に影響しないよう段階的実装
- **テストカバレッジ**: 分割により既存テストが不十分になる可能性

## 関連ドキュメント
- [ログ同期アーキテクチャ](./log-sync-architecture.md)
- [CLAUDE.md](../CLAUDE.md) - 開発ガイドライン
- [エラーハンドリング](./error-handling.md)
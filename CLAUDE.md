# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CLAUDE.md 自動更新ルール

Claude Code は以下の場合にこのファイルを自動的に更新してください：

### 更新が必要なケース
1. **新しいアーキテクチャパターンの発見・実装時**
   - データ整合性に関わる重要なパターン
   - 実行順序が重要な処理フロー
   - 複数のコンポーネント間で統一すべきパターン

2. **重要な制約・ルールの発見時**
   - データ破損やバグを防ぐための制約
   - 開発者が守るべき必須のガイドライン
   - 過去の問題を再発させないためのルール

3. **新しい開発プラクティスの確立時**
   - テストパターンや品質保証の手法
   - デバッグやトラブルシューティングの手法
   - パフォーマンス最適化のベストプラクティス

4. **技術スタックの変更・追加時**
   - 新しいライブラリやフレームワークの導入
   - 既存技術の重要な使用方法の変更
   - 環境要件の変更

### 更新時の原則
- **Critical な情報**: データ整合性やセキュリティに関わる情報は必ず記載
- **Future-proof**: 将来の開発者が同じ問題を避けられるよう具体的に記載
- **Reference**: 詳細なドキュメントがある場合は適切に参照を追加
- **Warning**: 絶対にやってはいけないことは強調して記載

## Pre-Pull Request Requirements

Before creating any pull request, you MUST run the following commands and ensure they pass:

```bash
# Install dependencies
yarn install

# Run linting and type checking
yarn lint

# Run tests
yarn test
```

## Development Commands

### Essential Commands
- `yarn dev` - Start development environment with hot reload
- `yarn lint` - Run all linting (biome + TypeScript + actionlint)
- `yarn lint:fix` - Auto-fix biome issues and run type checking
- `yarn test` - Run all tests
- `yarn build` - Create production build
- `yarn dist` - Build and package for distribution

### Testing Commands
- `yarn test:web` - Run frontend tests (Vitest with jsdom)
- `yarn test:electron` - Run Electron/Node tests (Vitest with node)
- `yarn test:playwright` - Run E2E tests (requires build first)

### Development Utilities
- `yarn generate:debug-data` - Generate debug data for development
- `yarn license-check:generate` - Generate license info (updates src/assets/licenses.json)

## High-Level Architecture

This is an Electron desktop application for organizing VRChat photos by automatically associating them with log files to track when and where photos were taken.

### Tech Stack
- **Desktop Framework**: Electron
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **API Layer**: tRPC for type-safe communication between main/renderer processes
- **Database**: SQLite with Sequelize ORM
- **UI**: Tailwind CSS + Radix UI components

### Project Structure
```
/electron/        # Main process (Node.js/Electron)
  /api.ts        # tRPC router definition - all API endpoints
  /index.ts      # Main entry point
  /lib/          # Core utilities (DB, logging, file system wrappers)
  /module/       # Business logic modules (VRChat logs, photos, settings)
  
/src/            # Renderer process (React)
  /v2/           # Main app code
    /components/ # React components
    /hooks/      # Custom React hooks
    /i18n/       # Internationalization (Japanese/English)
  /components/ui/ # Shadcn UI components
```

### Key Architectural Patterns

1. **tRPC Communication**: All communication between Electron main and renderer processes goes through tRPC routers defined in `electron/api.ts`

2. **Error Handling**: 
   - Service layer uses neverthrow Result pattern for detailed error handling
   - tRPC layer uses UserFacingError pattern for user-friendly messages
   - Helper functions in `electron/lib/errorHelpers.ts` bridge Result types to UserFacingErrors

3. **Database Access**: 
   - Sequelize models in `/electron/module/*/model.ts` files
   - Services wrap DB operations with Result types for error handling
   - DB queue system prevents concurrent write issues

4. **Photo Processing**:
   - EXIF data extraction using exiftool-vendored
   - Image processing with sharp for thumbnails
   - Automatic association with VRChat log files based on timestamps

5. **🚨 Log Synchronization Architecture** (CRITICAL - データ整合性必須):
   - **Execution Order**: `appendLoglines` → `loadLogInfo` → cache invalidation (厳守必須)
   - **Data Corruption Risk**: 順序違反で写真が間違ったワールドに分類される
   - **Sync Modes**: 
     - `FULL`: Complete processing (初回起動、設定更新時)
     - `INCREMENTAL`: Delta processing (通常更新、バックグラウンド)
   - **Unified Pattern**: `useLogSync` hook (frontend) / `syncLogs` service (backend)
   - **Initial Launch Detection**: 既存ログ件数によるDB状態判定
   - **Cache Strategy**: startup detection (staleTime: 0) vs regular data (5min)
   - **Reference**: `docs/log-sync-architecture.md` (詳細実装パターン)

## ⚠️ CRITICAL GUIDELINES - データ整合性必須事項

### 🚨 Task Completion Requirements (品質保証必須)
**全てのタスク完了時に必ず実行してください - 実行しないとデータ破損やビルド失敗のリスクがあります**

#### 必須実行項目 (MANDATORY BEFORE TASK COMPLETION)
- ✅ **Testing**: `yarn test` (ALL tests must pass)
- ✅ **Linting**: `yarn lint` (no remaining issues)
- ✅ **Type Checking**: included in lint command
- ✅ **Auto-fix**: `yarn lint:fix` if formatting issues exist

#### タスク完了プロセス (TASK COMPLETION PROCESS)
```
1. Code Implementation (コード実装)
   ↓
2. yarn lint:fix (自動修正)
   ↓
3. yarn lint (検証)
   ↓
4. yarn test (テスト実行)
   ↓
5. Task Completion (完了宣言)
```
**このプロセスを省略するとPRでCI失敗やデータ整合性問題が発生します**

### 🚨 Log Synchronization Rules (データ破損防止のため厳守)
**違反するとVRChat写真が間違ったワールドに分類され、データ整合性が破壊されます**

#### 絶対禁止事項 (NEVER DO)
- ❌ `appendLoglinesToFileFromLogFilePathList` と `loadLogInfoIndexFromVRChatLog` を個別に呼び出す
- ❌ 手動でのキャッシュ無効化処理
- ❌ 初回起動判定にマニュアルフラグを使用
- ❌ 古いパターンの個別ミューテーション使用

#### 必須使用パターン (ALWAYS DO)
- ✅ **Frontend**: `useLogSync` hook with `LOG_SYNC_MODE.FULL` or `LOG_SYNC_MODE.INCREMENTAL`
- ✅ **Backend**: `syncLogs(mode)` or `syncLogsInBackground()` service functions
- ✅ **Initial Launch Detection**: Database log count based detection
- ✅ **Reference**: `docs/log-sync-architecture.md` for implementation details

#### 重要な実行順序 (CRITICAL EXECUTION ORDER)
```
1. appendLoglines (ログファイル抽出)
   ↓
2. loadLogInfo (DB保存)
   ↓  
3. cache invalidation (UI更新)
```
**この順序が崩れると新しい写真が古いワールドグループに誤って分類されます**

### File Modification Safety Rules
#### 🚨 絶対に変更禁止 (AUTO-GENERATED)
- `src/assets/licenses.json` (license-check:generate)
- `yarn.lock` (Yarn managed)
- `CHANGELOG.md` (git-cliff generated)
- `debug/` directory files

**これらを変更すると次回ビルド時に上書きされます**

### Code Quality & Safety Rules

#### Code Style Standards
- **Docstrings**: 日本語で記述 (Japanese comments for business logic)
- **TypeScript**: Strict mode enabled (型安全性確保)
- **Decorators**: Enabled for Sequelize models
- **Pattern Consistency**: 既存コードベースのパターンに従う

#### 🔒 Development Workflow (品質保証必須)
1. **Code Changes**: Make your modifications
2. **Auto-fix**: `yarn lint:fix` (formatting issues)
3. **Validation**: `yarn lint` (ensure no remaining issues) 
4. **Testing**: `yarn test` (ALL tests must pass)
5. **PR Creation**: Only after all checks pass

**Pre-commit hooks automatically run `yarn lint` - 失敗時はcommit不可**

## Environment Requirements & Troubleshooting

### 必須環境 (Required Environment)
- **Node.js 20** (LTS required - 他バージョンでビルドエラーの可能性)
- **Yarn 4** (Yarn Modern required - npm使用禁止)
- **Pre-commit hooks**: `yarn lint` automatic execution

### よくある問題と解決方法 (Common Issues)

#### Build/Lint Failures
```bash
# Node version mismatch
nvm use 20  # or install Node.js 20 LTS

# Yarn version issues  
yarn set version stable
yarn install

# Dependency conflicts
rm -rf node_modules yarn.lock
yarn install
```

#### Development Environment Issues
```bash
# Hot reload not working
yarn dev  # Restart dev server

# Type errors after changes
yarn lint  # Check TypeScript issues
yarn test  # Verify all tests pass
```

#### Database/Log Sync Issues
- **Photos in wrong worlds**: Check log sync execution order
- **Cache not updating**: Use unified `useLogSync` pattern
- **Initial startup issues**: Verify database log count detection

## Database Testing Patterns

### 🔧 Database Test Setup (必須パターン)
**データベーステストを書く際は以下のパターンに従ってください**

#### 基本テンプレート
```typescript
import * as datefns from 'date-fns';
import * as client from '../../lib/sequelize';
import * as service from '../VRChatPlayerJoinLogModel/playerJoinLog.service';

describe('service with database', () => {
  describe('functionName', () => {
    beforeAll(async () => {
      client.__initTestRDBClient();
    }, 10000);
    
    beforeEach(async () => {
      await client.__forceSyncRDBClient();
    });
    
    afterAll(async () => {
      await client.__cleanupTestRDBClient();
    });

    it('test case description', async () => {
      // テストデータの準備
      const testData = [
        {
          joinDate: datefns.parseISO('2024-01-01T00:00:00Z'),
          playerName: 'TestPlayer',
          logType: 'playerJoin' as const,
          playerId: 'id1',
        },
      ];
      
      await service.createVRChatPlayerJoinLogModel(testData);
      
      // テスト対象関数の実行
      const result = await yourFunction();
      
      // 期待値の検証
      expect(result).toEqual(expectedValue);
    });
  });
});
```

#### 重要なポイント
- **Setup/Teardown**: `__initTestRDBClient`, `__forceSyncRDBClient`, `__cleanupTestRDBClient` を必ず使用
- **Timeout**: `beforeAll` に 10000ms のタイムアウトを設定
- **Data Cleanup**: `beforeEach` で `__forceSyncRDBClient` を呼び出してデータベースを初期化
- **Test Data**: `datefns.parseISO` を使用して一貫したISO形式の日時を作成
- **Service Usage**: 既存のサービス関数を使ってテストデータを作成

#### 参考ファイル
- **基本パターン**: `electron/module/VRChatPlayerJoinLogModel/playerJoinLog.service.spec.ts`
- **実装例**: `electron/module/logInfo/service.spec.ts`

#### 🚨 テスト作成時の注意点
- ❌ 直接SQLを書かない（既存のサービス関数を使用）
- ❌ テストごとの独立性を保つ（前のテストの影響を受けないよう初期化）
- ❌ ハードコードされた期待値ではなく、ロジックベースの検証を行う
- ✅ 実際のデータベースを使用したintegrationテストを書く
- ✅ エッジケースやエラーケースもテストに含める
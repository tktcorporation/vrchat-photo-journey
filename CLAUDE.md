# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## High-Level Architecture

Electron desktop app for organizing VRChat photos by automatically associating them with log files.

**Tech Stack**: Electron + React 18 + TypeScript + Vite + tRPC + SQLite/Sequelize + Tailwind/Radix UI

**Structure**:
- `/electron/` - Main process (tRPC router in api.ts, business logic in /module/)
- `/src/v2/` - Renderer process (React components, hooks, i18n)

## ⚠️ CRITICAL GUIDELINES

### 🚨 Log Synchronization (データ整合性必須)
**Execution Order**: `appendLoglines` → `loadLogInfo` → cache invalidation
**違反すると写真が間違ったワールドに分類されます**

- ✅ Use: `useLogSync` hook (frontend) / `syncLogs()` service (backend)
- ❌ Never: Call append/load functions individually
- 📖 Reference: `docs/log-sync-architecture.md`

### 🚨 Task Completion Process
```
1. Code Implementation
2. yarn lint:fix
3. yarn lint
4. yarn test
5. Task Completion
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


### Auto-Generated Files (変更禁止)
- `src/assets/licenses.json`
- `yarn.lock`
- `CHANGELOG.md`
- `debug/` directory

### Git Branch Format
`{issue-number}/{type}/{summary}`
Example: `123/feat/add-user-search`

Types: `feat`, `fix`, `chore`, `docs`, `style`, `refactor`, `perf`, `test`

## Environment Requirements
- Node.js 20 LTS
- Yarn 4 (npm禁止)

## Database Testing Pattern

```typescript
describe('service with database', () => {
  beforeAll(async () => {
    client.__initTestRDBClient();
  }, 10000);
  
  beforeEach(async () => {
    await client.__forceSyncRDBClient();
  });
  
  afterAll(async () => {
    await client.__cleanupTestRDBClient();
  });

  it('test case', async () => {
    // Use existing service functions for test data
    // Use datefns.parseISO for dates
  });
});
```

Reference: `electron/module/logInfo/service.spec.ts`

## CLAUDE.md 更新ルール

以下の場合に更新:
- データ整合性に関わる重要パターンの発見
- データ破損やバグを防ぐ制約の発見
- 新しい技術スタックやアーキテクチャパターンの導入

更新原則: Critical情報を簡潔に記載、詳細は別ドキュメントへ参照

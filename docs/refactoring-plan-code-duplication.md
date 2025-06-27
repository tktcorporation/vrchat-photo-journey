# Code Duplication Refactoring Plan

Date: 2025-06-26

## Overview

This document outlines the refactoring plan based on code duplication analysis using `similarity-ts`. The analysis identified 13 duplicate pairs across the codebase with similarity scores ranging from 87% to 96%.

## Priority Refactoring Opportunities

### 1. Error Helpers Consolidation (HIGH PRIORITY)
**Files**: `electron/lib/errorHelpers.ts`
- **Similarity**: 90.00% (56.7 points)
- **Functions**: `handleResultError` vs `handleResultErrorWithSilent`
- **Approach**: Extract common error handling logic into a single function with a `silent` parameter
- **Benefit**: Reduces duplication across 68 lines, improves consistency in error handling
- **Complexity**: Low - straightforward parameter addition

### 2. Log File Reader Streaming Consolidation (HIGH IMPACT)
**Files**: `electron/module/vrchatLog/fileHandlers/logFileReader.ts`
- **Similarity**: 88.70% (73.2 points)
- **Functions**: `getLogLinesByLogFilePathList` vs `getLogLinesByLogFilePathListStreaming`
- **Approach**: Create a base function with streaming as an optional feature
- **Benefit**: Eliminates ~100 lines of duplicate code
- **Complexity**: Medium - requires careful handling of streaming vs non-streaming logic

### 3. Player Action Parser Unification (QUICK WIN)
**Files**: `electron/module/vrchatLog/parsers/playerActionParser.ts`
- **Similarity**: 96.00% (32.6 points)
- **Functions**: `extractPlayerJoinInfoFromLog` vs `extractPlayerLeaveInfoFromLog`
- **Approach**: Create generic `extractPlayerActionFromLog` with action type parameter
- **Benefit**: Reduces near-identical parsing logic
- **Complexity**: Low - only differs in regex patterns and action types

### 4. VRChat World Join Log Service Methods (MEDIUM PRIORITY)
**Files**: `electron/module/vrchatWorldJoinLog/service.ts`
- **Similarity**: 87-95% across three functions
- **Functions**: `findRecentVRChatWorldJoinLog`, `findNextVRChatWorldJoinLog`, `findLatestWorldJoinLog`
- **Approach**: Create base query builder with direction/ordering parameters
- **Benefit**: Standardizes database query patterns
- **Complexity**: Medium - requires understanding of Sequelize query patterns

### 5. Electron Dialog Functions (LOW HANGING FRUIT)
**Files**: `electron/module/electronUtil/service.ts`
- **Similarity**: 87.07% (9.6 points)
- **Functions**: `openGetDirDialog` vs `openGetFileDialog`
- **Approach**: Use existing `openElectronDialog` function with appropriate properties
- **Benefit**: Removes redundant wrapper functions
- **Complexity**: Low - existing solution already available

### 6. Setting Store Accessors (MINOR)
**Files**: `electron/module/settingStore.ts`
- **Similarity**: 89.44% (8.9 points)
- **Functions**: `getStr` vs `getBool`
- **Approach**: Create generic `getValue<T>` with type parameter
- **Benefit**: Type-safe generic getter
- **Complexity**: Low - simple generics implementation

## Implementation Strategy

1. **Phase 1 - Quick Wins** (1-2 days)
   - Error Helpers consolidation
   - Player Action Parser unification
   - Electron Dialog functions

2. **Phase 2 - High Impact** (2-3 days)
   - Log File Reader streaming consolidation
   - VRChat World Join Log service methods

3. **Phase 3 - Nice to Have** (1 day)
   - Setting Store accessors
   - Any remaining minor duplications

## Expected Benefits

- **Code Reduction**: ~250-300 lines of duplicate code removed
- **Maintainability**: Single source of truth for common patterns
- **Consistency**: Standardized error handling and data access patterns
- **Type Safety**: Better use of TypeScript generics and type inference
- **Testing**: Easier to test consolidated functions

## Notes

- All refactoring should maintain existing functionality
- Ensure comprehensive tests are in place before refactoring
- Use ts-pattern for complex conditional logic as per CLAUDE.md guidelines
- Follow the existing error handling patterns with neverthrow Result types
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// useLogSyncのモック
const mockUseLogSync = {
  sync: vi.fn(),
};

vi.mock('@/trpc', () => ({
  trpcReact: {
    settings: {
      isDatabaseReady: {
        useQuery: vi.fn(),
      },
      syncDatabase: {
        useMutation: vi.fn(),
      },
    },
    getVRChatLogFilesDir: {
      useQuery: vi.fn(),
    },
    vrchatWorldJoinLog: {
      getVRChatWorldJoinLogList: {
        useQuery: vi.fn(),
      },
    },
  },
}));

vi.mock('../useLogSync', () => ({
  useLogSync: vi.fn(() => mockUseLogSync),
  LOG_SYNC_MODE: {
    FULL: 'FULL',
    INCREMENTAL: 'INCREMENTAL',
  },
}));

// テスト内でのtRPCモックのアクセス
import { trpcReact } from '@/trpc';
import { useStartupStage } from '../useStartUpStage';

// モック型の定義
interface MockTrpcReact {
  settings: {
    isDatabaseReady: {
      useQuery: ReturnType<typeof vi.fn>;
    };
    syncDatabase: {
      useMutation: ReturnType<typeof vi.fn>;
    };
  };
  getVRChatLogFilesDir: {
    useQuery: ReturnType<typeof vi.fn>;
  };
  vrchatWorldJoinLog: {
    getVRChatWorldJoinLogList: {
      useQuery: ReturnType<typeof vi.fn>;
    };
  };
}

const mockTrpcReact = trpcReact as unknown as MockTrpcReact;

describe('useStartupStage - logFilesDirData.error handling', () => {
  const mockCallbacks = {
    onError: vi.fn(),
    onComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // デフォルトのモック設定
    mockTrpcReact.settings.isDatabaseReady.useQuery.mockReturnValue({
      data: true, // マイグレーション不要（trueに変更）
      refetch: vi.fn(),
    });

    mockTrpcReact.settings.syncDatabase.useMutation.mockReturnValue({
      mutate: vi.fn(),
    });

    mockTrpcReact.getVRChatLogFilesDir.useQuery.mockReturnValue({
      data: { error: null },
    });

    mockTrpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery.mockReturnValue(
      {
        data: [],
        isError: false,
      },
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logFileDirNotFound エラーの場合、ログ数に関係なく logsStored を error にする', async () => {
    // 既存ログがある状態をモック (selectで長さが返される)
    mockTrpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery.mockReturnValue(
      {
        data: 2, // select: (data) => data?.length || 0 の結果
        isError: false,
      },
    );

    // logFilesDirData にエラーを設定
    mockTrpcReact.getVRChatLogFilesDir.useQuery.mockReturnValue({
      data: { error: 'logFileDirNotFound' },
    });

    const { result } = renderHook(() => useStartupStage(mockCallbacks));

    // executeLogOperations が実行されるまで待機
    await waitFor(
      () => {
        expect(result.current.stages.logsStored).toBe('error');
      },
      { timeout: 3000 },
    );

    // エラーコールバックが呼ばれることを確認
    expect(mockCallbacks.onError).toHaveBeenCalledWith({
      stage: 'logsStored',
      message: 'フォルダの読み取りに失敗しました',
    });
  });

  it('logFilesNotFound エラーの場合、ログ数に関係なく logsStored を error にする', async () => {
    // 既存ログがある状態をモック
    mockTrpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery.mockReturnValue(
      {
        data: 3, // select: (data) => data?.length || 0 の結果
        isError: false,
      },
    );

    // logFilesDirData にエラーを設定
    mockTrpcReact.getVRChatLogFilesDir.useQuery.mockReturnValue({
      data: { error: 'logFilesNotFound' },
    });

    const { result } = renderHook(() => useStartupStage(mockCallbacks));

    await waitFor(
      () => {
        expect(result.current.stages.logsStored).toBe('error');
      },
      { timeout: 3000 },
    );

    // エラーコールバックが呼ばれることを確認
    expect(mockCallbacks.onError).toHaveBeenCalledWith({
      stage: 'logsStored',
      message: 'ログファイルが見つかりませんでした',
    });
  });

  it('未知のエラーの場合、汎用エラーメッセージを表示する', async () => {
    mockTrpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery.mockReturnValue(
      {
        data: 1,
        isError: false,
      },
    );

    mockTrpcReact.getVRChatLogFilesDir.useQuery.mockReturnValue({
      data: { error: 'unknownError' },
    });

    const { result } = renderHook(() => useStartupStage(mockCallbacks));

    await waitFor(
      () => {
        expect(result.current.stages.logsStored).toBe('error');
      },
      { timeout: 3000 },
    );

    // エラーコールバックが呼ばれることを確認
    expect(mockCallbacks.onError).toHaveBeenCalledWith({
      stage: 'logsStored',
      message: '不明なエラーが発生しました',
    });
  });

  it('logFilesDirData.error は existingLogCount の確認より優先される', async () => {
    // existingLogCount が undefined でも logFilesDirData.error があれば処理される
    mockTrpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery.mockReturnValue(
      {
        data: undefined, // ログカウント未取得
        isError: false,
      },
    );

    mockTrpcReact.getVRChatLogFilesDir.useQuery.mockReturnValue({
      data: { error: 'logFileDirNotFound' },
    });

    const { result } = renderHook(() => useStartupStage(mockCallbacks));

    await waitFor(
      () => {
        expect(result.current.stages.logsStored).toBe('error');
      },
      { timeout: 3000 },
    );

    // エラーコールバックが呼ばれることを確認
    expect(mockCallbacks.onError).toHaveBeenCalledWith({
      stage: 'logsStored',
      message: 'フォルダの読み取りに失敗しました',
    });
    // ログ同期は実行されない
    expect(mockUseLogSync.sync).not.toHaveBeenCalled();
  });

  it('logFilesDirData.error がない場合は通常処理が継続される', async () => {
    // 既存ログがある状態をモック（INCREMENTAL モードになる）
    mockTrpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery.mockReturnValue(
      {
        data: 2, // select: (data) => data?.length || 0 の結果
        isError: false,
      },
    );

    // logFilesDirData にエラーなし
    mockTrpcReact.getVRChatLogFilesDir.useQuery.mockReturnValue({
      data: { error: null },
    });

    const { result } = renderHook(() => useStartupStage(mockCallbacks));

    // logsStored が inProgress になることを確認（エラーにならない）
    await waitFor(
      () => {
        expect(result.current.stages.logsStored).toBe('inProgress');
      },
      { timeout: 3000 },
    );

    // INCREMENTAL モードでログ同期が呼ばれることを確認
    expect(mockUseLogSync.sync).toHaveBeenCalledWith('INCREMENTAL');
  });

  it('初回起動時は FULL モードでログ同期を実行する', async () => {
    mockTrpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery.mockReturnValue(
      {
        data: 0, // select: (data) => data?.length || 0 の結果でログなし
        isError: false,
      },
    );

    mockTrpcReact.getVRChatLogFilesDir.useQuery.mockReturnValue({
      data: { error: null },
    });

    const { result } = renderHook(() => useStartupStage(mockCallbacks));

    await waitFor(
      () => {
        expect(result.current.stages.logsStored).toBe('inProgress');
      },
      { timeout: 3000 },
    );

    // FULL モードでログ同期が呼ばれることを確認
    expect(mockUseLogSync.sync).toHaveBeenCalledWith('FULL');
  });

  it('ログカウント取得エラー時も FULL モードでログ同期を実行する', async () => {
    mockTrpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery.mockReturnValue(
      {
        data: 0, // ログカウント取得エラーの場合、デフォルト値0が返される
        isError: true, // ログカウント取得エラー
      },
    );

    mockTrpcReact.getVRChatLogFilesDir.useQuery.mockReturnValue({
      data: { error: null },
    });

    const { result } = renderHook(() => useStartupStage(mockCallbacks));

    await waitFor(
      () => {
        expect(result.current.stages.logsStored).toBe('inProgress');
      },
      { timeout: 3000 },
    );

    // エラー時も FULL モードでログ同期が呼ばれることを確認
    expect(mockUseLogSync.sync).toHaveBeenCalledWith('FULL');
  });

  it('データベース同期が必要な場合、isDatabaseReady が false になる', () => {
    mockTrpcReact.settings.isDatabaseReady.useQuery.mockReturnValue({
      data: false, // マイグレーション必要
      refetch: vi.fn(),
    });

    const { result } = renderHook(() => useStartupStage(mockCallbacks));

    // データベース同期が開始されないことを確認（logFilesDirDataが必要なため）
    expect(result.current.stages.startingSync).toBe('pending');
  });

  it('retryProcess実行時、refetchが呼ばれる', async () => {
    const mockRefetch = vi.fn();
    mockTrpcReact.settings.isDatabaseReady.useQuery.mockReturnValue({
      data: true,
      refetch: mockRefetch,
    });

    const { result } = renderHook(() => useStartupStage(mockCallbacks));

    // 初期状態を確認（処理が完了している状態）
    await waitFor(() => {
      expect(result.current.stages.startingSync).toBe('skipped');
    });

    // リトライ実行
    act(() => {
      result.current.retryProcess();
    });

    // refetchが呼ばれることを確認
    expect(mockRefetch).toHaveBeenCalled();
    // エラーメッセージがクリアされることを確認
    expect(result.current.errorMessage).toBe('');
  });
});

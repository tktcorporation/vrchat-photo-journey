import { vi } from 'vitest';

/**
 * tRPC の useQuery フックの戻り値をモックするためのヘルパー関数
 * 最小限のプロパティでテストが動作するように設計
 * @param overrides - 上書きしたいプロパティ
 * @returns tRPC useQuery モックオブジェクト
 */
export function createQueryStub<TData = unknown>(
  overrides: Partial<{
    data: TData | null | undefined;
    isLoading: boolean;
    error: unknown;
    refetch: () => void;
    isFetching: boolean;
    isError: boolean;
    isSuccess: boolean;
  }> = {},
) {
  const {
    data = null,
    isLoading = false,
    error = null,
    refetch = vi.fn(),
    isFetching = false,
    isError = false,
    isSuccess = true,
  } = overrides;

  // 最小限のプロパティと、テストで参照される可能性のあるプロパティを含む
  const result = {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    isError,
    isSuccess,
    status: isError ? 'error' : isLoading ? 'loading' : 'success',
    fetchStatus: isFetching ? 'fetching' : 'idle',
    isPaused: false,
    isStale: false,
    isFetched: !isLoading,
    isFetchedAfterMount: !isLoading,
    isRefetching: false,
    isLoadingError: isLoading && isError,
    isRefetchError: false,
    dataUpdatedAt: data ? Date.now() : 0,
    errorUpdatedAt: error ? Date.now() : 0,
    failureCount: error ? 1 : 0,
    failureReason: error,
    errorUpdateCount: error ? 1 : 0,
    remove: vi.fn(),
    // tRPC 固有のプロパティ
    trpc: {
      path: '',
      abortOnUnmount: false,
    },
  };

  // 明示的に as any を使用して型チェックをバイパス
  // これはテスト用ユーティリティであり、完全な型互換性よりも
  // テストの簡潔性を優先するため
  // biome-ignore lint/suspicious/noExplicitAny: テスト用ユーティリティのため any を許可
  return result as any;
}

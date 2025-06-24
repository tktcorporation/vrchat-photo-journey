import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ipcLink } from 'electron-trpc/renderer';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import superjson from 'superjson';

import { trpcReact } from './trpc';

/**
 * tRPC クライアントと React Query の QueryClient を初期化し、
 * アプリ全体にプロバイダーを提供するラッパーコンポーネント。
 * `App.tsx` のルートで使用され、API 通信とキャッシュ管理を行う環境を整える。
 */
export default ({ children }: { children: React.ReactNode }) => {
  /**
   * tRPC や React Query のエラーをメインプロセスへ送り
   * ユーザーへトースト表示するための共通ハンドラー。
   * QueryClient の onError から呼び出される。
   */
  const handleError = (error: Error) => {
    // tRPCエラーの場合、詳細な情報を抽出
    const errorDetails = error.toString();
    let logMessage = `Error caught by TrpcWrapper: ${errorDetails}`;

    // tRPCClientErrorの場合、data.originalErrorから詳細を取得
    if (error.name === 'TRPCClientError' && 'data' in error) {
      const errorWithData = error as Error & {
        data?: {
          originalError?: { name: string; message: string; stack?: string };
        };
      };
      if (errorWithData.data?.originalError) {
        const originalError = errorWithData.data.originalError;
        logMessage += `\nOriginal Error: ${originalError.name}: ${originalError.message}`;
        if (originalError.stack) {
          logMessage += `\nOriginal Stack: ${originalError.stack}`;
        }
      }
    }

    if (error.stack) {
      logMessage += `\nStack trace: ${error.stack}`;
    }

    window.Main.sendErrorMessage(logMessage);
    // トーストはBackendのlogError関数から送信されるため、ここでは表示しない
    // toast(errorDetails);
  };
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            onError: (error) => {
              //   const { code, message } = error as IError;
              if (error instanceof Error) {
                handleError(error);
                return;
              }
              throw error;
            },
          },
          queries: {
            onError: (error) => {
              if (error instanceof Error) {
                handleError(error);
                return;
              }
              throw error;
            },
            // パフォーマンス最適化のためのキャッシュ戦略
            staleTime: 5 * 60 * 1000, // 5分間は新鮮なデータとして扱う
            cacheTime: 10 * 60 * 1000, // 10分間キャッシュを保持
            refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効化
            retry: (failureCount, error) => {
              // ネットワークエラー以外はリトライしない
              if (error instanceof Error && error.message.includes('Network')) {
                return failureCount < 3;
              }
              return false;
            },
          },
        },
      }),
  );
  const [trpcClient] = useState(() =>
    trpcReact.createClient({
      links: [ipcLink()],
      transformer: superjson,
    }),
  );
  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpcReact.Provider>
  );
};

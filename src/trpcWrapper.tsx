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
  const handleError = (error: Error) => {
    window.Main.sendErrorMessage(
      `Error caught by TrpcWrapper: ${error.toString()}. Stack trace: ${
        error.stack
      }`,
    );
    toast(error.toString());
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

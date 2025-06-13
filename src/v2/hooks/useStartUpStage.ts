import { trpcReact } from '@/trpc';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { invalidatePhotoGalleryQueries } from '@/queryClient';

type ProcessStage = 'pending' | 'inProgress' | 'success' | 'error' | 'skipped';

export interface ProcessStages {
  /**
   * アプリケーション初期化処理の状態を追跡
   * - pending: 初期化待ち
   * - inProgress: 初期化実行中
   * - success: 初期化完了
   * - error: 初期化失敗
   */
  initialization: ProcessStage;
}

export interface ProcessError {
  stage: keyof ProcessStages;
  message: string;
}

interface ProcessStageCallbacks {
  onError?: (error: ProcessError) => void;
  onComplete?: () => void;
}

const initialStages: ProcessStages = {
  initialization: 'pending',
};

/**
 * アプリケーション起動時の初期化処理を管理するフック
 *
 * settingsController.initializeAppData を呼び出して、
 * データベース初期化、同期、ログ同期を順次実行します。
 */
export const useStartupStage = (callbacks?: ProcessStageCallbacks) => {
  const [stages, setStages] = useState<ProcessStages>(initialStages);
  const [error, setError] = useState<ProcessError | null>(null);
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false);
  const [hasTriggeredInitialization, setHasTriggeredInitialization] =
    useState(false);

  // tRPC utils for query invalidation
  const utils = trpcReact.useUtils();

  // ステージ更新のヘルパー関数
  const updateStage = useCallback(
    (stage: keyof ProcessStages, status: ProcessStage, errorMsg?: string) => {
      setStages((prev) => ({ ...prev, [stage]: status }));

      console.log({
        event: 'updateStage',
        stage,
        status,
        errorMessage: errorMsg,
      });

      if (status === 'error' && errorMsg) {
        const processError = { stage, message: errorMsg };
        setError(processError);
        callbacks?.onError?.(processError);
      } else if (status === 'success' || status === 'skipped') {
        setError(null);
      }
    },
    [callbacks],
  );

  // アプリケーション初期化ミューテーション
  const initializeAppDataMutation =
    trpcReact.settings.initializeAppData.useMutation({
      retry: false, // 重複実行を避けるため、リトライは無効
      onMutate: () => {
        console.log('Starting application initialization');
        updateStage('initialization', 'inProgress');
      },
      onSuccess: async () => {
        console.log('Application initialization completed successfully');
        updateStage('initialization', 'success');

        // ログ同期完了後、ログ関連のクエリキャッシュを無効化
        try {
          invalidatePhotoGalleryQueries(utils);
        } catch (error) {
          console.warn('Failed to invalidate query cache:', error);
        }
      },
      onError: (error) => {
        console.error('Application initialization failed:', error);

        // 重複実行エラーの場合は無視
        if (
          error instanceof Error &&
          error.message.includes('初期化処理が既に実行中')
        ) {
          console.log('Ignoring duplicate initialization request');
          return;
        }

        const errorMessage =
          error instanceof Error
            ? error.message
            : 'アプリケーション初期化に失敗しました';
        updateStage('initialization', 'error', errorMessage);
      },
    });

  // 初期化処理を開始
  const startInitialization = useCallback(() => {
    if (
      stages.initialization === 'pending' &&
      !initializeAppDataMutation.isLoading &&
      !initializeAppDataMutation.isSuccess &&
      !hasTriggeredInitialization
    ) {
      console.log('Starting initialization...');
      setHasTriggeredInitialization(true);
      initializeAppDataMutation.mutate();
    }
  }, [
    stages.initialization,
    initializeAppDataMutation,
    hasTriggeredInitialization,
  ]);

  // 自動的に初期化を開始
  useEffect(() => {
    startInitialization();
  }, [startInitialization]);

  // リトライ処理
  const retryProcess = useCallback(() => {
    setStages(initialStages);
    setError(null);
    setHasNotifiedCompletion(false);
    setHasTriggeredInitialization(false);
    initializeAppDataMutation.reset();
    // startInitialization は useEffect で自動的に呼ばれる
  }, [initializeAppDataMutation]);

  // 完了判定
  const completed = useMemo(
    () => stages.initialization === 'success',
    [stages],
  );

  // 完了通知
  useEffect(() => {
    if (completed && !hasNotifiedCompletion) {
      setHasNotifiedCompletion(true);
      callbacks?.onComplete?.();
    }
  }, [completed, hasNotifiedCompletion, callbacks]);

  // 終了判定（成功またはエラー）
  const finished = useMemo(
    () =>
      stages.initialization === 'success' || stages.initialization === 'error',
    [stages],
  );

  // デバッグ用
  useEffect(() => {
    console.log('Current stages:', JSON.stringify(stages, null, 2));
  }, [stages]);

  return {
    stages,
    updateStage,
    errorMessage: error?.message ?? '',
    errorStage: error?.stage ?? '',
    retryProcess,
    completed,
    finished,
  };
};

import { trpcReact } from '@/trpc';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { match } from 'ts-pattern';
import { LOG_SYNC_MODE, useLogSync } from './useLogSync';

type ProcessStage = 'pending' | 'inProgress' | 'success' | 'error' | 'skipped';

export interface ProcessStages {
  /**
   * データベースの同期開始状態を追跡
   * - pending: 同期開始待ち
   * - inProgress: 同期開始中
   * - success: 同期開始成功
   * - error: 同期開始失敗
   * - skipped: 同期不要のためスキップ
   */
  startingSync: ProcessStage;

  /**
   * データベースの同期完了状態を追跡
   * - pending: 同期完了待ち
   * - inProgress: 同期実行中
   * - success: 同期完了
   * - error: 同期失敗
   * - skipped: 同期不要のためスキップ
   */
  syncDone: ProcessStage;

  /**
   * VRChatログファイルの保存状態を追跡
   * - pending: ログ保存待ち
   * - inProgress: ログ保存中
   * - success: ログ保存完了
   * - error: ログ保存失敗
   * - skipped: ログ保存不要のためスキップ
   */
  logsStored: ProcessStage;

  /**
   * ログ情報インデックスの読み込み状態を追跡
   * - pending: インデックス読み込み待ち
   * - inProgress: インデックス読み込み中
   * - success: インデックス読み込み完了
   * - error: インデックス読み込み失敗
   * - skipped: インデックス読み込み不要のためスキップ
   */
  indexLoaded: ProcessStage;
}

export interface ProcessError {
  stage: keyof ProcessStages;
  message: string;
}

const initialStages: ProcessStages = {
  startingSync: 'pending',
  syncDone: 'pending',
  logsStored: 'pending',
  indexLoaded: 'pending',
};

interface ProcessStageCallbacks {
  onError?: (error: ProcessError) => void;
  onComplete?: () => void;
}

/**
 * アプリケーション起動時の各種処理ステージを管理するフック
 *
 * 重要な処理フロー:
 * 1. データベース同期（startingSync → syncDone）
 * 2. VRChatログファイルの処理（logsStored）
 * 3. ログ情報のインデックス化（indexLoaded）
 *
 * この順序は厳守する必要があります:
 * - ログファイル処理→インデックス化の順序が入れ替わると、新しいログが正しく処理されません
 * - リフレッシュ処理（Header.tsx の handleRefresh）と同じ順序で処理する必要があります
 */
export const useStartupStage = (callbacks?: ProcessStageCallbacks) => {
  const [stages, setStages] = useState<ProcessStages>(initialStages);
  const [error, setError] = useState<ProcessError | null>(null);
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false);

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

  const { data: migrateRequirement, refetch: refetchMigrateRequirement } =
    trpcReact.settings.isDatabaseReady.useQuery(undefined, {
      onSuccess: (data: boolean) => {
        console.log('isDatabaseReady query succeeded:', { data });
      },
      onError: () => {
        console.error('isDatabaseReady query failed');
      },
    });

  const syncRdbMutation = trpcReact.settings.syncDatabase.useMutation({
    retry: 3,
    retryDelay: 3000,
    onMutate: () => {
      console.log('Starting database sync mutation');
      updateStage('startingSync', 'inProgress');
    },
    onSuccess: () => {
      console.log('Database sync succeeded');
      updateStage('startingSync', 'success');
      updateStage('syncDone', 'success');
      executeLogOperations();
    },
    onError: (error) => {
      console.error('Database sync failed:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'データベース同期に失敗しました';
      updateStage('startingSync', 'error');
      updateStage('syncDone', 'error', errorMessage);
    },
  });

  const { data: logFilesDirData } = trpcReact.getVRChatLogFilesDir.useQuery();

  // 既存のログデータがあるかチェック（初回起動判定用）
  // データベースが利用可能な場合にクエリを実行
  const { data: existingLogCount, isError: isLogCountError } =
    trpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery(
      { orderByJoinDateTime: 'desc' },
      {
        enabled: migrateRequirement !== undefined, // データベース状態が確定している場合に実行
        staleTime: 0, // アプリ起動ごとに最新状態で判定するためキャッシュなし
        cacheTime: 1000 * 60 * 1, // 1分後にメモリから削除
        refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得なし
        refetchOnReconnect: false, // 再接続時の再取得なし
        select: (data) => data?.length || 0,
        retry: 1, // 1回だけリトライ
      },
    );

  // ログ同期フックを使用
  const { sync: syncLogs } = useLogSync({
    onSuccess: () => {
      console.log('Log sync completed successfully');
      updateStage('logsStored', 'success');
      updateStage('indexLoaded', 'success');
    },
    onError: (error) => {
      console.error('Log sync failed:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'ログ同期に失敗しました';
      updateStage('logsStored', 'error', errorMessage);
      updateStage('indexLoaded', 'error', errorMessage);
    },
  });

  /**
   * ログ処理オペレーションを実行する関数
   *
   * 統一されたログ同期処理：
   * 1. appendLoglines: VRChatログファイルから新しいログ行を読み込む
   * 2. loadLogInfo: ログ情報をDBに保存
   * 3. キャッシュの無効化: UIを更新
   *
   * 初回起動判定：
   * - 既存のログデータが0件の場合：初回起動として全件処理（FULL）
   * - 既存のログデータがある場合：通常起動として差分処理（INCREMENTAL）
   */
  const executeLogOperations = useCallback(async () => {
    console.log('executeLogOperations called', {
      logFilesDirData,
      stages,
      existingLogCount,
      isLogCountError,
    });

    if (stages.logsStored !== 'pending') {
      console.log('Log operations already started or completed');
      return;
    }

    if (!logFilesDirData) {
      console.log('logFilesDirData is not available');
      return;
    }

    // データベース同期が必要な場合（初回起動）はログカウントが取得できないため、
    // existingLogCountがundefinedでも処理を続行する
    if (existingLogCount === undefined && migrateRequirement === false) {
      console.log('existingLogCount is not available yet (non-migration case)');
      return;
    }

    if (logFilesDirData.error) {
      console.log('logFilesDirData has error:', logFilesDirData.error);
      const message = match(logFilesDirData.error)
        .with('logFilesNotFound', () => 'ログファイルが見つかりませんでした')
        .with('logFileDirNotFound', () => 'フォルダの読み取りに失敗しました')
        .otherwise(() => '不明なエラーが発生しました');

      updateStage('logsStored', 'error', message);
      return;
    }

    try {
      if (stages.logsStored !== 'pending') {
        console.log('Log operations was started by another call');
        return;
      }

      // 初回起動判定：
      // - データベース同期が必要だった場合は初回起動として全件処理
      // - 既存ログが0件の場合は初回起動として全件処理
      // - existingLogCountがundefinedの場合（DB同期中）は初回起動として処理
      // - それ以外は通常起動として差分処理
      const logCount = existingLogCount ?? 0;
      const wasFirstTime = migrateRequirement === true; // データベース同期が実行された場合
      const isFirstLaunch =
        wasFirstTime ||
        isLogCountError ||
        logCount === 0 ||
        existingLogCount === undefined;
      const syncMode = isFirstLaunch
        ? LOG_SYNC_MODE.FULL
        : LOG_SYNC_MODE.INCREMENTAL;

      console.log(
        `Starting log sync with ${syncMode} mode (isFirstLaunch: ${isFirstLaunch}, logCount: ${logCount})`,
      );
      updateStage('logsStored', 'inProgress');
      updateStage('indexLoaded', 'inProgress');

      await syncLogs(syncMode);
    } catch (error) {
      console.error('Error during log sync:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'ログ同期に失敗しました';
      updateStage('logsStored', 'error', errorMessage);
      updateStage('indexLoaded', 'error', errorMessage);
    }
  }, [
    logFilesDirData,
    stages,
    syncLogs,
    updateStage,
    existingLogCount,
    isLogCountError,
  ]);

  const retryProcess = useCallback(() => {
    setStages(initialStages);
    setError(null);
    setHasNotifiedCompletion(false);
    refetchMigrateRequirement();
  }, [refetchMigrateRequirement]);

  useEffect(() => {
    if (migrateRequirement === undefined) {
      console.log('migrateRequirement is undefined');
      return;
    }

    console.log('Migration requirement check:', {
      migrateRequirement,
      stages: JSON.stringify(stages),
    });

    if (migrateRequirement) {
      if (stages.startingSync !== 'pending') {
        console.log('Database sync already started or completed');
        return;
      }

      console.log('Starting database sync');

      const timeoutId = setTimeout(() => {
        console.error('Database sync timeout');
        updateStage('startingSync', 'error');
        updateStage(
          'syncDone',
          'error',
          'データベース同期がタイムアウトしました',
        );
      }, 30000);

      try {
        syncRdbMutation.mutate(undefined, {
          onSuccess: () => {
            clearTimeout(timeoutId);
          },
          onError: () => {
            clearTimeout(timeoutId);
          },
          onSettled: () => {
            console.log('Database sync settled');
          },
        });
      } catch (error) {
        console.error('Error during sync mutation:', error);
        clearTimeout(timeoutId);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'データベース同期の開始に失敗しました';
        updateStage('startingSync', 'error');
        updateStage('syncDone', 'error', errorMessage);
      }

      return () => {
        clearTimeout(timeoutId);
      };
    }
    console.log('Skipping database sync');
    updateStage('startingSync', 'skipped');
    updateStage('syncDone', 'skipped');
    executeLogOperations();
  }, [migrateRequirement, stages.startingSync]);

  const completed = useMemo(
    () =>
      Object.values(stages).every(
        (stage) => stage === 'success' || stage === 'skipped',
      ),
    [stages],
  );

  useEffect(() => {
    if (completed && !hasNotifiedCompletion) {
      setHasNotifiedCompletion(true);
      callbacks?.onComplete?.();
    }
  }, [completed, hasNotifiedCompletion, callbacks]);

  const finished = useMemo(
    () =>
      Object.values(stages).every(
        (stage) =>
          stage === 'success' || stage === 'skipped' || stage === 'error',
      ),
    [stages],
  );

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

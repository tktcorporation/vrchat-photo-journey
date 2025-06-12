import { trpcReact } from '@/trpc';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

interface ProcessStageCallbacks {
  onError?: (error: ProcessError) => void;
  onComplete?: () => void;
}

const initialStages: ProcessStages = {
  startingSync: 'pending',
  syncDone: 'pending',
  logsStored: 'pending',
  indexLoaded: 'pending',
};

/**
 * アプリケーション起動時の各種処理ステージを管理するフック
 *
 * 【重要な処理フロー】
 * 1. マイグレーションチェック
 *    - データベースのスキーマバージョンを確認
 *    - 古いバージョンの場合は最新スキーマへ移行が必要
 *
 * 2. データベース同期（必要な場合）
 *    - 初回起動時やスキーマ更新時に実行
 *    - 既存データの移行とテーブル作成を行う
 *
 * 3. ディレクトリチェック（エラーの場合は初期設定画面へ）
 *    - VRChatログフォルダと写真フォルダの存在確認
 *    - アクセス権限の確認
 *    - エラーがある場合は初期設定画面へ遷移し、ユーザーに再設定を促す
 *
 * 4. ログ同期処理
 *    - 初回起動時: 全ログファイルを処理（FULL モード）
 *    - 通常起動時: 前回処理以降の差分のみ処理（INCREMENTAL モード）
 *    - ログファイルから写真との関連付けに必要な情報を抽出
 *
 * 【なぜこの順序が重要か】
 * - データベースが使用可能でないとログ情報を保存できない
 * - ディレクトリが正しく設定されていないとログファイルを読み込めない
 * - この順序を守らないとデータの不整合が発生する可能性がある
 */
export const useStartupStage = (callbacks?: ProcessStageCallbacks) => {
  const [stages, setStages] = useState<ProcessStages>(initialStages);
  const [error, setError] = useState<ProcessError | null>(null);
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState(false);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // ========== クエリの取得 ==========

  // データベースのマイグレーション必要性をチェック
  // true: マイグレーション不要（最新スキーマ）
  // false: マイグレーション必要（古いスキーマまたは初回起動）
  const { data: isDatabaseReady, refetch: refetchDatabaseReady } =
    trpcReact.settings.isDatabaseReady.useQuery(undefined, {
      onSuccess: (data: boolean) => {
        console.log('isDatabaseReady query succeeded:', { data });
      },
      onError: () => {
        console.error('isDatabaseReady query failed');
      },
    });

  // VRChatのログファイルディレクトリ情報を取得
  // エラーがある場合は { error: 'logFilesNotFound' | 'logFileDirNotFound' } が返る
  const { data: logFilesDirData } = trpcReact.getVRChatLogFilesDir.useQuery();

  // 既存のワールド参加ログ数を取得（初回起動判定用）
  // 0件: 初回起動として全ログ処理
  // 1件以上: 通常起動として差分処理
  const { data: existingLogCount, isError: isLogCountError } =
    trpcReact.vrchatWorldJoinLog.getVRChatWorldJoinLogList.useQuery(
      { orderByJoinDateTime: 'desc' },
      {
        enabled: isDatabaseReady !== undefined, // データベース状態が確定している場合に実行
        staleTime: 0, // アプリ起動ごとに最新状態で判定するためキャッシュなし
        cacheTime: 1000 * 60 * 1, // 1分後にメモリから削除
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        select: (data) => data?.length || 0,
        retry: 1,
      },
    );

  // ========== ミューテーションとフック ==========

  // データベース同期ミューテーション
  // 初回起動時やスキーマ更新時にデータベースの初期化・移行を実行
  const syncRdbMutation = trpcReact.settings.syncDatabase.useMutation({
    retry: 3, // ネットワークエラー等に対して3回までリトライ
    retryDelay: 3000, // リトライ間隔3秒
    onMutate: () => {
      console.log('Starting database sync mutation');
      updateStage('startingSync', 'inProgress');
    },
    onSuccess: () => {
      console.log('Database sync succeeded');
      updateStage('startingSync', 'success');
      updateStage('syncDone', 'success');
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

  // ログ同期フック
  // VRChatのログファイルを解析し、ワールド訪問情報をデータベースに保存
  // 写真とワールドの関連付けに必要な時刻情報を抽出
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

  // ========== ステップ1: マイグレーションチェックとデータベース同期 ==========
  const handleDatabaseSync = useCallback(async () => {
    // 既に処理が開始されている場合はスキップ（重複実行防止）
    if (stages.startingSync !== 'pending') {
      console.log('Database sync already started or completed');
      return;
    }

    // データベース状態がまだ確認できていない場合は待機
    if (isDatabaseReady === undefined) {
      console.log('Database ready state not determined yet');
      return;
    }

    if (!isDatabaseReady) {
      // データベース同期が必要な場合（初回起動またはスキーマ更新時）
      console.log('Starting database sync');

      // 30秒のタイムアウトを設定（データベース同期が長時間ハングするのを防ぐ）
      syncTimeoutRef.current = setTimeout(() => {
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
          onSettled: () => {
            // 成功・失敗に関わらずタイムアウトをクリア
            if (syncTimeoutRef.current) {
              clearTimeout(syncTimeoutRef.current);
              syncTimeoutRef.current = null;
            }
          },
        });
      } catch (error) {
        console.error('Error during sync mutation:', error);
        if (syncTimeoutRef.current) {
          clearTimeout(syncTimeoutRef.current);
          syncTimeoutRef.current = null;
        }
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'データベース同期の開始に失敗しました';
        updateStage('startingSync', 'error');
        updateStage('syncDone', 'error', errorMessage);
      }
    } else {
      // データベースが最新の場合は同期をスキップ
      console.log('Skipping database sync');
      updateStage('startingSync', 'skipped');
      updateStage('syncDone', 'skipped');
    }
  }, [isDatabaseReady, stages.startingSync, syncRdbMutation, updateStage]);

  // ========== ステップ2: ディレクトリチェックとログ同期 ==========
  const handleLogSync = useCallback(async () => {
    // 既に処理が開始されている場合はスキップ（重複実行防止）
    if (stages.logsStored !== 'pending') {
      console.log('Log operations already started or completed');
      return;
    }

    // ログディレクトリ情報がまだ取得できていない場合は待機
    if (!logFilesDirData) {
      console.log('logFilesDirData is not available');
      return;
    }

    // ディレクトリエラーチェック（最優先）
    // エラーがある場合は初期設定画面へ遷移させるため、早期にエラー状態にする
    if (logFilesDirData.error) {
      console.log('logFilesDirData has error:', logFilesDirData.error);
      const message = match(logFilesDirData.error)
        .with('logFilesNotFound', () => 'ログファイルが見つかりませんでした')
        .with('logFileDirNotFound', () => 'フォルダの読み取りに失敗しました')
        .otherwise(() => '不明なエラーが発生しました');

      updateStage('logsStored', 'error', message);
      updateStage('indexLoaded', 'error', message);
      return;
    }

    // データベース同期直後はログカウントが取得できないことがある
    // その場合でも処理を続行（初回起動として扱う）
    if (existingLogCount === undefined && isDatabaseReady === true) {
      console.log('existingLogCount is not available yet (non-migration case)');
      return;
    }

    try {
      // 初回起動判定ロジック
      // 以下のいずれかの場合は初回起動として全ログを処理:
      // 1. データベース同期が実行された（wasFirstTime）
      // 2. ログカウント取得でエラーが発生した
      // 3. 既存ログが0件
      // 4. ログカウントが未定義（DB同期直後など）
      const logCount = existingLogCount ?? 0;
      const wasFirstTime = isDatabaseReady === false; // データベース同期が実行された場合
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
    stages.logsStored,
    logFilesDirData,
    existingLogCount,
    isLogCountError,
    isDatabaseReady,
    syncLogs,
    updateStage,
  ]);

  // データベース状態が確定したらデータベース同期を実行
  useEffect(() => {
    handleDatabaseSync();
  }, [handleDatabaseSync]);

  // データベース同期が完了したらログ同期を実行
  useEffect(() => {
    if (stages.syncDone === 'success' || stages.syncDone === 'skipped') {
      handleLogSync();
    }
  }, [stages.syncDone, handleLogSync]);

  // リトライ処理
  const retryProcess = useCallback(() => {
    setStages(initialStages);
    setError(null);
    setHasNotifiedCompletion(false);
    refetchDatabaseReady();
  }, [refetchDatabaseReady]);

  // 完了判定
  const completed = useMemo(
    () =>
      Object.values(stages).every(
        (stage) => stage === 'success' || stage === 'skipped',
      ),
    [stages],
  );

  // 完了通知
  useEffect(() => {
    if (completed && !hasNotifiedCompletion) {
      setHasNotifiedCompletion(true);
      callbacks?.onComplete?.();
    }
  }, [completed, hasNotifiedCompletion, callbacks]);

  // 終了判定（成功、スキップ、エラーのいずれか）
  const finished = useMemo(
    () =>
      Object.values(stages).every(
        (stage) =>
          stage === 'success' || stage === 'skipped' || stage === 'error',
      ),
    [stages],
  );

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

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

import { trpcReact } from '@/trpc';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { match } from 'ts-pattern';

type ProcessStage = 'pending' | 'inProgress' | 'success' | 'error' | 'skipped';

interface ProcessStages {
  startingSync: ProcessStage;
  syncDone: ProcessStage;
  logsStored: ProcessStage;
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

  const loadLogInfoIndexMutation =
    trpcReact.logInfo.loadLogInfoIndex.useMutation({
      onMutate: () => {
        console.log('Starting loadLogInfoIndex');
        updateStage('indexLoaded', 'inProgress');
      },
      onSuccess: () => {
        console.log('loadLogInfoIndex succeeded');
        updateStage('indexLoaded', 'success');
      },
      onError: (error) => {
        console.error('loadLogInfoIndex failed:', error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'インデックスの読み込みに失敗しました';
        updateStage('indexLoaded', 'error', errorMessage);
      },
      onSettled: () => {
        console.log('loadLogInfoIndex settled');
      },
    });

  const storeLogsMutation =
    trpcReact.vrchatLog.appendLoglinesToFileFromLogFilePathList.useMutation({
      onMutate: () => {
        console.log('Starting storeLogsMutation');
        updateStage('logsStored', 'inProgress');
      },
      onSuccess: () => {
        console.log('storeLogsMutation succeeded');
        updateStage('logsStored', 'success');
        loadLogInfoIndexMutation.mutate();
      },
      onError: (error) => {
        console.error('storeLogsMutation failed:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'ログの保存に失敗しました';
        updateStage('logsStored', 'error', errorMessage);
      },
      onSettled: () => {
        console.log('storeLogsMutation settled');
      },
    });

  const executeLogOperations = useCallback(() => {
    console.log('executeLogOperations called', { logFilesDirData, stages });

    if (stages.logsStored !== 'pending') {
      console.log('Log operations already started or completed');
      return;
    }

    if (!logFilesDirData) {
      console.log('logFilesDirData is not available');
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
      console.log('Starting store logs mutation');
      storeLogsMutation.mutate();
    } catch (error) {
      console.error('Error during store logs mutation:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'ログの保存に失敗しました';
      updateStage('logsStored', 'error', errorMessage);
    }
  }, [logFilesDirData, stages, storeLogsMutation, updateStage]);

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

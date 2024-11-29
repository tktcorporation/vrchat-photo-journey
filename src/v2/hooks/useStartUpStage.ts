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

interface ProcessError {
  stage: keyof ProcessStages;
  message: string;
}

const initialStages: ProcessStages = {
  startingSync: 'pending',
  syncDone: 'pending',
  logsStored: 'pending',
  indexLoaded: 'pending',
};

interface StartupStageCallbacks {
  onError?: (error: ProcessError) => void;
  onComplete?: () => void;
}

export const useStartupStage = (callbacks?: StartupStageCallbacks) => {
  const [stages, setStages] = useState<ProcessStages>(initialStages);
  const [error, setError] = useState<ProcessError | null>(null);

  const updateStage = useCallback(
    (stage: keyof ProcessStages, status: ProcessStage, errorMsg?: string) => {
      setStages((prev) => ({ ...prev, [stage]: status }));

      console.log('updateStage', stage, status, errorMsg);
      
      if (status === 'error' && errorMsg) {
        const processError = { stage, message: errorMsg };
        setError(processError);
        callbacks?.onError?.(processError);
      } else if (status === 'success' || status === 'skipped') {
        setError(null);
      }
    },
    [callbacks]
  );

  const { data: migrateRequirement, refetch: refetchMigrateRequirement } =
    trpcReact.settings.isDatabaseReady.useQuery();

  const syncRdbMutation = trpcReact.settings.syncDatabase.useMutation({
    onSuccess: () => {
      updateStage('syncDone', 'success');
      executeLogOperations();
    },
    onError: () => updateStage('syncDone', 'error', 'Database Sync Error'),
  });

  const { data: logFilesDirData } = trpcReact.getVRChatLogFilesDir.useQuery();

  const storeLogsMutation =
    trpcReact.vrchatLog.appendLoglinesToFileFromLogFilePathList.useMutation({
      onSuccess: () => {
        updateStage('logsStored', 'success');
        loadLogInfoIndexMutation.mutate();
      },
      onError: () => updateStage('logsStored', 'error', 'Storing Logs Error'),
    });

  const loadLogInfoIndexMutation =
    trpcReact.logInfo.loadLogInfoIndex.useMutation({
      onSuccess: () => {
        updateStage('indexLoaded', 'success');
      },
      onError: () => updateStage('indexLoaded', 'error', 'Loading Index Error'),
    });

  const executeLogOperations = useCallback(() => {
    if (!logFilesDirData) return;

    if (logFilesDirData.error) {
      const message = match(logFilesDirData.error)
        .with('logFilesNotFound', () => 'ログファイルが見つかりませんでした')
        .with('logFileDirNotFound', () => 'フォルダの読み取りに失敗しました')
        .otherwise(() => '不明なエラーが発生しました');

      updateStage('logsStored', 'error', message);
      return;
    }

    storeLogsMutation.mutate();
  }, [logFilesDirData]);

  const retryProcess = useCallback(() => {
    setStages(initialStages);
    setError(null);
    refetchMigrateRequirement();
  }, [refetchMigrateRequirement]);

  useEffect(() => {
    if (migrateRequirement === undefined) return;

    if (migrateRequirement) {
      updateStage('startingSync', 'inProgress');
      syncRdbMutation.mutate();
    } else {
      updateStage('startingSync', 'skipped');
      updateStage('syncDone', 'skipped');
      executeLogOperations();
    }
  }, [migrateRequirement, executeLogOperations]);

  const completed = useMemo(
    () =>
      Object.values(stages).every(
        (stage) => stage === 'success' || stage === 'skipped',
      ),
    [stages],
  );

  const finished = useMemo(
    () =>
      Object.values(stages).every(
        (stage) =>
          stage === 'success' || stage === 'skipped' || stage === 'error',
      ),
    [stages],
  );

  useEffect(() => {
    if (completed) {
      callbacks?.onComplete?.();
    }
  }, [completed, callbacks]);

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

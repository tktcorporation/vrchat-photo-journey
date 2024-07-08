import { trpcReact } from '@/trpc';
import { useEffect, useState } from 'react';
import { match } from 'ts-pattern';

type ProcessStage = 'pending' | 'inProgress' | 'success' | 'error' | 'skipped';

interface ProcessStages {
  startingSync: ProcessStage;
  syncDone: ProcessStage;
  logsStored: ProcessStage;
  indexLoaded: ProcessStage;
}

const initialStages: ProcessStages = {
  startingSync: 'pending',
  syncDone: 'pending',
  logsStored: 'pending',
  indexLoaded: 'pending',
};

export const useStartupStage = () => {
  const [stages, setStages] = useState<ProcessStages>(initialStages);
  const [errorStage, setErrorStage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const updateStage = (
    stage: keyof ProcessStages,
    status: ProcessStage,
    errorMsg?: string,
  ) => {
    setStages((prev) => ({ ...prev, [stage]: status }));
    if (status === 'error' && errorMsg) {
      setErrorStage(stage);
      setErrorMessage(errorMsg);
    }
  };

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

  const executeLogOperations = () => {
    if (logFilesDirData?.error) {
      const message = match(logFilesDirData.error)
        .with('logFilesNotFound', () => 'ログファイルが見つかりませんでした')
        .with('logFileDirNotFound', () => 'フォルダの読み取りに失敗しました')
        .otherwise(() => '不明なエラーが発生しました');

      updateStage('logsStored', 'error', message);
    } else {
      storeLogsMutation.mutate();
    }
  };

  const retryProcess = () => {
    setStages(initialStages);
    setErrorStage('');
    setErrorMessage('');
    refetchMigrateRequirement();
  };

  useEffect(() => {
    if (migrateRequirement !== undefined) {
      if (migrateRequirement) {
        updateStage('startingSync', 'inProgress');
        syncRdbMutation.mutate();
      } else {
        updateStage('startingSync', 'skipped');
        updateStage('syncDone', 'skipped');
        executeLogOperations();
      }
    }
  }, [migrateRequirement]);

  const completed = Object.values(stages).every(
    (stage) => stage === 'success' || stage === 'skipped',
  );

  return {
    stages,
    updateStage,
    errorMessage,
    errorStage,
    retryProcess,
    completed,
  };
};

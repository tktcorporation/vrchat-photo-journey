import { Button } from '@/components/ui/button';
import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
import { ArrowRightCircle, CheckCircle, Loader, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const useProcessStages = () => {
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

  return { stages, updateStage, errorStage, errorMessage };
};

const getStatusIcon = (status: ProcessStage) => {
  switch (status) {
    case 'success':
      return <CheckCircle color="green" size={24} />;
    case 'error':
      return <XCircle color="red" size={24} />;
    case 'inProgress':
      return <Loader size={24} />;
    case 'skipped':
      return <ArrowRightCircle color="blue" size={24} />;
    case 'pending':
      return <Loader size={24} />;
    default:
      return null;
  }
};

export const Start = () => {
  const navigate = useNavigate();
  const { data: migrateRequirement } =
    trpcReact.settings.isDatabaseReady.useQuery();
  const { stages, updateStage, errorMessage } = useProcessStages();

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
        navigate(ROUTER_PATHS.HOME);
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

  const handleNavigateToSettings = () => {
    navigate(ROUTER_PATHS.SETTING);
  };

  return (
    <div className="flex-auto h-full flex flex-col items-center justify-center space-y-9">
      <div className="text-lg font-semibold">Process Status</div>
      <div className="flex flex-col space-y-2">
        {Object.entries(stages).map(([stage, status]) => (
          <div key={stage} className="flex items-center space-x-2">
            <span>{stage}...</span>
            {getStatusIcon(status)}
          </div>
        ))}
      </div>
      {stages.logsStored === 'error' && (
        <div className="text-red-500">
          <p>{errorMessage}</p>
          <p>Go to settings and try again</p>
          <Button
            onClick={handleNavigateToSettings}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
          >
            Go to Settings
          </Button>
        </div>
      )}
    </div>
  );
};

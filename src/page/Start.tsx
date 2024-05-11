import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
import { ArrowRightCircle, CheckCircle, Loader, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const Start = () => {
  const navigate = useNavigate();
  const { data: migrateRequirement } =
    trpcReact.settings.isDatabaseReady.useQuery();
  const [processStage, setProcessStage] = useState('checking');
  const [errorStage, setErrorStage] = useState('');

  const syncRdbMutation = trpcReact.settings.syncDatabase.useMutation({
    onSuccess: () => {
      setProcessStage('syncDone');
      executeLogOperations();
    },
    onError: () => {
      setErrorStage('Database Sync');
      setProcessStage('error');
    },
  });
  const storeLogsMutation =
    trpcReact.vrchatLog.appendLoglinesToFileFromLogFilePathList.useMutation({
      onSuccess: () => {
        setProcessStage('logsStored');
        loadLogInfoIndexMutation.mutate();
      },
      onError: () => {
        setErrorStage('Storing Logs');
        setProcessStage('error');
      },
    });
  const loadLogInfoIndexMutation =
    trpcReact.logInfo.loadLogInfoIndex.useMutation({
      onSuccess: () => {
        setProcessStage('indexLoaded');
        navigate(ROUTER_PATHS.HOME);
      },
      onError: () => {
        setErrorStage('Loading Index');
        setProcessStage('error');
      },
    });

  const executeLogOperations = () => {
    storeLogsMutation.mutate();
  };

  useEffect(() => {
    if (migrateRequirement) {
      setProcessStage('startingSync');
      syncRdbMutation.mutate();
    } else if (migrateRequirement === false) {
      executeLogOperations();
    }
  }, [migrateRequirement]);

  const getProgressIndicator = () => {
    switch (processStage) {
      case 'checking':
        return <Loader size={64} />;
      case 'startingSync':
      case 'syncDone':
      case 'logsStored':
      case 'indexLoaded':
        return <CheckCircle color="green" size={64} />;
      case 'error':
        return <XCircle color="red" size={64} />;
      default:
        return <Loader size={64} />;
    }
  };

  const getMessage = () => {
    if (processStage === 'error') {
      return `Error at ${errorStage}`;
    }
    return (
      {
        checking: 'Checking database requirements...',
        startingSync: 'Starting database synchronization...',
        syncDone: 'Database synchronized, storing logs...',
        logsStored: 'Logs stored, loading index...',
        indexLoaded: 'Index loaded, navigating...',
      }[processStage] || 'Preparing...'
    );
  };

  return (
    <div className="flex-auto h-full flex flex-col items-center justify-center space-y-9">
      <div className="text-lg font-semibold">{getMessage()}</div>
      <div>{getProgressIndicator()}</div>
    </div>
  );
};

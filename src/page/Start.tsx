import { ROUTER_PATHS } from '@/constants';
import { ArrowRightCircle, CheckCircle, Loader, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStartupStage } from './__Start/useStartupStage';
import VRChatLogPathSetting from './setting/VRChatLogPathSetting';

type ProcessStage = 'pending' | 'inProgress' | 'success' | 'error' | 'skipped';
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
  const { stages, errorMessage, errorStage, retryProcess, completed } =
    useStartupStage();

  const navigate = useNavigate();
  // completed が true になった時に Home にリダイレクトする
  if (completed) {
    navigate(ROUTER_PATHS.HOME);
  }

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
        <>
          <div className="text-red-500">
            <p>{errorMessage}</p>
            <p>Go to settings and try again</p>
          </div>
          <VRChatLogPathSetting />
        </>
      )}
      {errorStage && (
        <button onClick={retryProcess} className="text-blue-500" type="button">
          Retry from the beginning
        </button>
      )}
    </div>
  );
};

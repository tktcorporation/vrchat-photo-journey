import { Button } from '@/components/ui/button';
import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
import { Link } from 'react-router-dom';

function Debug() {
  const storeLogsMutation =
    trpcReact.vrchatLog.appendLoglinesToFileFromLogFilePathList.useMutation();
  const loadLogInfoIndexMutation =
    trpcReact.logInfo.loadLogInfoIndex.useMutation();
  const resetDbMutation = trpcReact.settings.forceResetDatabase.useMutation();
  return (
    <div className="flex-auto h-full">
      <div className="flex flex-col justify-center items-center h-full space-y-9">
        <h3 className="text-lg font-medium">Home</h3>
        <Button
          onClick={() => {
            storeLogsMutation.mutate();
          }}
          disabled={storeLogsMutation.isLoading}
        >
          logの生成とそのデータからsqliteに流してIndexの作成
        </Button>
        <Button
          onClick={() => {
            resetDbMutation.mutate();
          }}
          disabled={resetDbMutation.isLoading}
        >
          DBのリセット
        </Button>
        <Button
          onClick={() => {
            loadLogInfoIndexMutation.mutate();
          }}
          disabled={loadLogInfoIndexMutation.isLoading}
        >
          Indexの読み込み
        </Button>
      </div>
    </div>
  );
}

export default Debug;

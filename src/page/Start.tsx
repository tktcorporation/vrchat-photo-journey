import { trpcReact } from '@/trpc';

import { useNavigate } from 'react-router-dom';

import { ROUTER_PATHS } from '@/constants';
import { Loader } from 'lucide-react';
import { useEffect } from 'react';

export const Start = () => {
  const navigate = useNavigate();
  const resetRdbMutation = trpcReact.logInfo.resetDatabase.useMutation({
    onSuccess: () => {
      navigate(ROUTER_PATHS.HOME);
    },
  });

  // 初回のみ実行
  useEffect(() => {
    resetRdbMutation.mutate();
  }, []);

  return (
    <div className="flex-auto h-full flex flex-col space-y-9">
      <div className="w-3/5 mx-auto mt-6">
        <Loader />
      </div>
    </div>
  );
};

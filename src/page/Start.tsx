import { trpcReact } from '@/trpc';

import { useNavigate } from 'react-router-dom';

import { ROUTER_PATHS } from '@/constants';
import { Loader } from 'lucide-react';
import { useEffect } from 'react';

export const Start = () => {
  const navigate = useNavigate();
  const { data: migrateRequirement } =
    trpcReact.settings.isDatabaseReady.useQuery();
  const syncRdbMutation = trpcReact.settings.syncDatabase.useMutation({
    onSuccess: () => {
      navigate(ROUTER_PATHS.HOME);
    },
  });

  useEffect(() => {
    checkAndMigrateAndNavigate();
  }, [migrateRequirement]);

  const checkAndMigrateAndNavigate = async () => {
    if (migrateRequirement === true) {
      await syncRdbMutation.mutate();
      return;
    }
    if (migrateRequirement === false) {
      navigate(ROUTER_PATHS.HOME);
      return;
    }
  };

  return (
    <div className="flex-auto h-full flex flex-col space-y-9">
      <div className="w-3/5 mx-auto mt-6">
        <Loader size={64} />
      </div>
    </div>
  );
};

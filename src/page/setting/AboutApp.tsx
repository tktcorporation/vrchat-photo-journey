import { trpcReact } from '@/trpc';

import { Button } from '@/components/ui/button';
import { ROUTER_PATHS } from '@/constants';
import { ChevronRight, DownloadIcon } from 'lucide-react';
import React, { Suspense, useEffect, useState } from 'react';

const OpenApplicationLogButton = () => {
  const openApplicationLog =
    trpcReact.settings.openApplicationLogInExploler.useMutation();

  return (
    <Button
      onClick={() => {
        openApplicationLog.mutate();
      }}
    >
      アプリケーションログを開く
    </Button>
  );
};

const SectionUpdate = () => {
  const { data: updateInfo, error } = trpcReact.settings.getAppUpdateInfo.useQuery();
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (error) {
      console.error(error);
    }
    const checkForUpdates = async () => {
      setUpdateAvailable(updateInfo?.isUpdateAvailable ?? false);
    };

    checkForUpdates();
  }, [updateInfo]);

  const installUpdateMutation = trpcReact.settings.installUpdate.useMutation();
  const handleUpdate = async () => {
    await installUpdateMutation.mutateAsync();
  };

  const UpdateButton = (
    <Button
      variant="icon"
      size="icon"
      onClick={handleUpdate}
      className="flex items-center"
    >
      <DownloadIcon strokeWidth={1} size={16} />
    </Button>
  );

  return (
    <div className="flex justify-between">
      <div>アップデート</div>
      <div>{updateAvailable ? UpdateButton : '最新です'}</div>
    </div>
  );
};

export const AboutApp = () => {
  const version = trpcReact.settings.getAppVersion.useQuery().data;

  return (
    <div className="flex-auto h-full flex flex-col space-y-9">
      <div className="w-3/5 mx-auto mt-6">
        <div>
          <div className="flex flex-col mt-10 gap-8">
            <div className="flex justify-between text-center">
              <div className="">バージョン</div>
              <div className="">{version}</div>
            </div>
            <Suspense
              fallback={
                // skeleton
                <div className="flex justify-center items-center h-64">
                  <div className="animate-pulse bg-gray-200 rounded-lg w-64 h-64" />
                </div>
              }
            >
              <SectionUpdate />
            </Suspense>
            <div className="flex justify-between items-center">
              <div>アプリケーションログ</div>
              <div>
                <OpenApplicationLogButton />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import { trpcReact } from '@/trpc';

import { Button } from '@/components/ui/button';
import { ROUTER_PATHS } from '@/constants';
import { ChevronRight, DownloadIcon } from 'lucide-react';
import React, { Suspense, useEffect, useState } from 'react';

const SectionUpdate = () => {
  const [updateInfo] = trpcReact.settings.getAppUpdateInfo.useSuspenseQuery();
  const updateAvailable = updateInfo.isUpdateAvailable;

  const installUpdateMutation = trpcReact.settings.installUpdate.useMutation();
  const handleUpdate = async () => {
    installUpdateMutation.mutate();
  };

  const UpdateButton = (
    <Button
      variant="icon"
      size="icon"
      onClick={handleUpdate}
      className="fixed bottom-4 right-4"
    >
      <DownloadIcon strokeWidth={1} size={16} />
    </Button>
  );

  return (
    <div className="flex">
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
          <div className="flex flex-col mt-10">
            <div className="flex justify-between text-center">
              <div className="">バージョン</div>
              <div className="">{version}</div>
            </div>
          </div>
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
      </div>
    </div>
  );
};

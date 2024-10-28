import { trpcReact } from '@/trpc';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { ROUTER_PATHS } from '@/constants';
import { ChevronRight, DownloadIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { SettingBreadcrumb } from './__setting/SettingsBreadcrumb';

export const AboutApp = () => {
  const version = trpcReact.settings.getAppVersion.useQuery().data;
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const [updateInfo, error] =
    trpcReact.settings.getAppUpdateInfo.useSuspenseQuery();
  useEffect(() => {
    if (error) {
      console.error(error);
    }
    const checkForUpdates = async () => {
      setUpdateAvailable(updateInfo.isUpdateAvailable);
    };

    checkForUpdates();
  }, [updateInfo]);

  const installUpdateMutation = trpcReact.settings.installUpdate.useMutation();
  const handleUpdate = async () => {
    installUpdateMutation.mutate();
  };

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
        {updateAvailable && (
          <Button
            variant="icon"
            size="icon"
            onClick={handleUpdate}
            className="fixed bottom-4 right-4"
          >
            <DownloadIcon strokeWidth={1} size={16} />
          </Button>
        )}
      </div>
    </div>
  );
};

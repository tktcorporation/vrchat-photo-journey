import { trpcReact } from '@/trpc';

import { Link, useLocation, useNavigate } from 'react-router-dom';

import { ROUTER_PATHS } from '@/constants';
import { ChevronRight } from 'lucide-react';
import { SettingBreadcrumb } from './__setting/SettingsBreadcrumb';

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
      </div>
    </div>
  );
};

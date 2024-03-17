import type React from 'react';
import { Link, useLocation } from 'react-router-dom';

import { ROUTER_PATHS } from '@/constants';
import { cn } from '@/lib/utils';
import { ImageIcon, SettingsIcon } from 'lucide-react';

const MainNav = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) => {
  // get current path
  const location = useLocation();
  const currentPath = location.pathname;
  return (
    <nav
      className={cn(
        'flex items-center space-x-4 lg:space-x-6 bg-muted py-2 justify-between',
        className,
      )}
      {...props}
    >
      <div className="flex items-center space-x-4 lg:space-x-6 p-1">
        <Link
          to={ROUTER_PATHS.PHOTO_LIST}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary px-2',
            currentPath === ROUTER_PATHS.PHOTO_LIST
              ? ''
              : 'text-muted-foreground',
          )}
        >
          <ImageIcon className="w-6 h-6" />
        </Link>
      </div>
      <div className="flex items-center space-x-4 lg:space-x-6 p-1">
        {/* <Link
          to={ROUTER_PATHS.ONBORDING}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary px-2',
            currentPath === ROUTER_PATHS.ONBORDING
              ? ''
              : 'text-muted-foreground',
          )}
        >
          <HelpCircleIcon />
        </Link> */}
        <Link
          to={ROUTER_PATHS.SETTING}
          className={cn(
            'text-sm font-medium transition-colors hover:text-primary px-2',
            currentPath === ROUTER_PATHS.SETTING ? '' : 'text-muted-foreground',
          )}
        >
          <SettingsIcon className="w-6 h-6" />
          <span className="sr-only">設定画面へ</span>
        </Link>
      </div>
    </nav>
  );
};

export default MainNav;

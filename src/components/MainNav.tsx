import React from 'react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';
import { ROUTER_PATHS } from '@/constants';
import { HomeIcon, ImageIcon, SettingsIcon } from 'lucide-react';

function MainNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav className={cn('flex items-center space-x-4 lg:space-x-6', className)} {...props}>
      <Link to={ROUTER_PATHS.HOME} className="text-sm font-medium transition-colors hover:text-primary">
        <HomeIcon />
      </Link>
      <Link
        to={ROUTER_PATHS.SETTING}
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <SettingsIcon />
      </Link>
      <Link
        to={ROUTER_PATHS.PHOTO_LIST}
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        <ImageIcon />
      </Link>
    </nav>
  );
}

export default MainNav;

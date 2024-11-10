import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ROUTER_PATHS } from '@/constants';
import { cn } from '@/lib/utils';
import SettingSheet from '@/page/SettingSheet';
import { trpcReact } from '@/trpc';
import {
  DownloadIcon,
  HomeIcon,
  Maximize,
  Minimize,
  Minus,
  SettingsIcon,
  X,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function AppBar() {
  const [isMaximize, setMaximize] = useState(false);
  const getAppUpdateInfQuery = trpcReact.settings.getAppUpdateInfo.useQuery();
  const updateAvailable = getAppUpdateInfQuery.data?.isUpdateAvailable ?? false;
  const updateInstallMutation = trpcReact.settings.installUpdate.useMutation();

  const handleToggle = () => {
    if (isMaximize) {
      setMaximize(false);
    } else {
      setMaximize(true);
    }
    window.Main.Maximize();
  };

  const handleUpdate = async () => {
    getAppUpdateInfQuery.refetch();
    updateInstallMutation.mutate();
  };

  useEffect(() => {
    if (updateInstallMutation.isSuccess) {
      window.location.reload();
    }
  }, [updateInstallMutation.isSuccess]);

  return (
    <div className="flex justify-between draggable bg-background text-sm justify-items-center">
      <div className="undraggable inline-flex">
        <Link
          to={ROUTER_PATHS.HOME}
          className="h-10 w-10 flex items-center justify-center transition-colors text-muted-foreground hover:text-primary"
        >
          <HomeIcon strokeWidth={1} size={16} />
          <span className="sr-only">Home</span>
        </Link>
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="icon"
              size="icon"
              className="text-muted-foreground hover:text-primary"
            >
              <SettingsIcon strokeWidth={1} size={16} />
              <span className="sr-only">設定画面へ</span>
            </Button>
          </SheetTrigger>
          <SettingSheet />
        </Sheet>
      </div>
      <div className="inline-flex">
        {/* アップデートインストールボタン */}
        {updateAvailable && (
          <Button
            variant="icon"
            size="icon"
            onClick={handleUpdate}
            className="undraggable hover:bg-muted"
          >
            <DownloadIcon strokeWidth={1} size={16} />
          </Button>
        )}

        <Button
          variant="icon"
          size="icon"
          onClick={window.Main.Minimize}
          className="undraggable hover:bg-muted"
        >
          <Minus strokeWidth={1} size={16} />
        </Button>
        <Button
          variant="icon"
          size="icon"
          onClick={handleToggle}
          className="undraggable hover:bg-muted"
        >
          {isMaximize ? (
            <Minimize strokeWidth={1} size={16} />
          ) : (
            <Maximize strokeWidth={1} size={16} />
          )}
        </Button>
        <button
          onClick={window.Main.Close}
          className="undraggable hover:bg-red-500 hover:text-white px-3"
          type="button"
        >
          <X strokeWidth={1} size={16} />
        </button>
      </div>
    </div>
  );
}

export default AppBar;

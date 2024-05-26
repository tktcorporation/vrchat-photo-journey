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
import { Maximize, Minimize, Minus, SettingsIcon, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function AppBar() {
  const [isMaximize, setMaximize] = useState(false);

  const handleToggle = () => {
    if (isMaximize) {
      setMaximize(false);
    } else {
      setMaximize(true);
    }
    window.Main.Maximize();
  };

  return (
    <div className="flex justify-between draggable bg-background text-sm justify-items-center">
      <div className="undraggable">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="icon" size="icon" className="hover:bg-muted">
              <SettingsIcon strokeWidth={1} size={20} />
              <span className="sr-only">設定画面へ</span>
            </Button>
          </SheetTrigger>
          <SettingSheet />
        </Sheet>
      </div>
      <div className="inline-flex">
        <Button
          variant="icon"
          size="icon"
          onClick={window.Main.Minimize}
          className="undraggable hover:bg-muted"
        >
          <Minus strokeWidth={1} size={20} />
        </Button>
        <Button
          variant="icon"
          size="icon"
          onClick={handleToggle}
          className="undraggable hover:bg-muted"
        >
          {isMaximize ? (
            <Minimize strokeWidth={1} size={20} />
          ) : (
            <Maximize strokeWidth={1} size={20} />
          )}
        </Button>
        <button
          onClick={window.Main.Close}
          className="undraggable hover:bg-red-500 hover:text-white px-3"
          type="button"
        >
          <X strokeWidth={1} size={20} />
        </button>
      </div>
    </div>
  );
}

export default AppBar;

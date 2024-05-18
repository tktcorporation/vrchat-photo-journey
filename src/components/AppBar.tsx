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
import { Maximize, Minus, SettingsIcon, X } from 'lucide-react';
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
    <div className="py-1 flex justify-between draggable bg-background text-sm justify-items-center">
      <div className="undraggable ml-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost">
              <SettingsIcon strokeWidth={1} size={20} />
              <span className="sr-only">設定画面へ</span>
            </Button>
          </SheetTrigger>
          <SettingSheet />
        </Sheet>
      </div>
      <div className="inline-flex -mt-1">
        <button
          onClick={window.Main.Minimize}
          className="undraggable pt-1 hover:bg-muted"
          type="button"
        >
          <Minus strokeWidth={1} size={20} />
        </button>
        <button
          onClick={handleToggle}
          className="undraggable px-6 lg:px-5 pt-1 hover:bg-muted"
          type="button"
        >
          {isMaximize ? '\u2752' : <Maximize strokeWidth={1} size={20} />}
        </button>
        <button
          onClick={window.Main.Close}
          className="undraggable hover:bg-red-500 hover:text-white py-1 px-2"
          type="button"
        >
          <X strokeWidth={1} size={20} />
        </button>
      </div>
    </div>
  );
}

export default AppBar;

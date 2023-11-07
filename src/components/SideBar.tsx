import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FolderIcon } from 'lucide-react';
import React from 'react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  clickCallback: (key: string) => void;
  itemList: {
    key: string;
    label: string;
  }[];
}

function Sidebar({ className, clickCallback, itemList }: SidebarProps) {
  const handleItemClick = (key: string) => {
    clickCallback(key);
  };

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            <FolderIcon className="inline-block" /> Photo
          </h2>
          <div className="space-y-1">
            {itemList.map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handleItemClick(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Sidebar;

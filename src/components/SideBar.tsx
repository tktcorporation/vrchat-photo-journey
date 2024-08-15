import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FolderIcon } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  clickCallback: (key: string) => void;
  itemList: {
    key: string;
    label: string;
  }[];
  defaultKey?: string;
}

export function Sidebar({
  className,
  clickCallback,
  itemList,
  defaultKey,
}: SidebarProps) {
  const [selectedItem, setSelectedItem] = useState<string>(defaultKey ?? '');

  const handleItemClick = (key: string) => {
    setSelectedItem(key);
    clickCallback(key);
  };

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-6">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {itemList.map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                className={cn(
                  'w-full justify-start',
                  item.key === selectedItem
                    ? 'bg-accent text-accent-foreground'
                    : '',
                )}
                onClick={() => handleItemClick(item.key)}
              >
                <FolderIcon className="inline-block" />{' '}
                <span className="ml-2">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

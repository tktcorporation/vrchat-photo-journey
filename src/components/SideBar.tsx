import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FolderIcon } from 'lucide-react';
import { ROUTER_PATHS } from '@/constants';
import { cn } from '@/lib/utils';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  clickCallback: (key: string) => void;
  itemList: {
    key: string;
    label: string;
  }[];
  defaultKey?: string;
}

function Sidebar({ className, clickCallback, itemList, defaultKey }: SidebarProps) {
  const [selectedItem, setSelectedItem] = useState<string>('');

  const handleItemClick = (key: string) => {
    setSelectedItem(key);
    clickCallback(key);
  };

  // defaultKeyが指定されている場合は、初期値としてselectedItemを設定します。
  React.useEffect(() => {
    if (defaultKey) {
      setSelectedItem(defaultKey);
    }
  }, [defaultKey]);

  return (
    <div className={cn('pb-12', className)}>
      <div className="space-y-4">
        <div className="px-3 py-2">
          <Link to={ROUTER_PATHS.HOME}>
            <Button variant="outline">HOME</Button>
          </Link>
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            <FolderIcon className="inline-block" />
          </h2>
          <div className="space-y-1">
            {itemList.map((item) => (
              <Button
                key={item.key}
                variant="ghost"
                className={cn(
                  'w-full justify-start',
                  item.key === selectedItem ? 'bg-accent text-accent-foreground' : ''
                )}
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

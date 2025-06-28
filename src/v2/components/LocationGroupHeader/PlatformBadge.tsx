import { Laptop } from 'lucide-react';
import { memo } from 'react';
import { ICON_SIZE } from '../../constants/ui';

interface PlatformBadgeProps {
  platform: string;
}

/**
 * プラットフォーム情報を表示するバッジコンポーネント
 * VRChat のプラットフォーム（PC、Quest など）を視覚的に表示
 */
export const PlatformBadge = memo(({ platform }: PlatformBadgeProps) => {
  const platformName =
    platform === 'standalonewindows'
      ? 'PC'
      : platform === 'android'
        ? 'Quest'
        : platform;
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
      <Laptop className={`${ICON_SIZE.xs.class} mr-1`} />
      {platformName}
    </span>
  );
});

PlatformBadge.displayName = 'PlatformBadge';

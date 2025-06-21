import clsx from 'clsx';
import { Calendar } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Photo } from '../../types/photo';

interface WorldInfo {
  worldId: string;
  worldName: string;
  worldInstanceId: string;
}

interface GroupedPhoto {
  photos: Photo[];
  worldInfo: WorldInfo | null;
  joinDateTime: Date;
}

interface DateJumpProps {
  filteredGroups: Array<[string, GroupedPhoto]>;
  onJumpToDate: (groupKey: string, index: number) => void;
  currentVisibleGroups?: Set<string>;
  className?: string;
}

interface DateEntry {
  date: Date;
  dateString: string;
  groupKey: string;
  index: number;
  count: number;
}

export const DateJump = memo(function DateJump({
  filteredGroups,
  onJumpToDate,
  currentVisibleGroups = new Set(),
  className,
}: DateJumpProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeItemRef = useRef<HTMLDivElement>(null);

  // グループから日付エントリーを生成
  const dateEntries = useMemo(() => {
    const dateMap = new Map<string, DateEntry>();

    filteredGroups.forEach(([key, group], index) => {
      const date = new Date(group.joinDateTime);
      const dateString = date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
      });

      const existing = dateMap.get(dateString);
      if (existing) {
        existing.count++;
        // より早い時刻のグループのインデックスを保持（最初に見つかるグループへジャンプ）
        if (index < existing.index) {
          existing.groupKey = key;
          existing.index = index;
        }
      } else {
        dateMap.set(dateString, {
          date,
          dateString,
          groupKey: key,
          index,
          count: 1,
        });
      }
    });

    return Array.from(dateMap.values()).sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }, [filteredGroups]);

  // 現在表示中の日付を計算
  const currentDate = useMemo(() => {
    if (currentVisibleGroups.size === 0) return null;

    for (const entry of dateEntries) {
      if (currentVisibleGroups.has(entry.groupKey)) {
        return entry.dateString;
      }
    }
    return null;
  }, [currentVisibleGroups, dateEntries]);

  // 日付クリックハンドラー
  const handleDateClick = useCallback(
    (entry: DateEntry) => {
      setSelectedDate(entry.dateString);
      onJumpToDate(entry.groupKey, entry.index);
    },
    [onJumpToDate],
  );

  // 現在の日付が変わったらスクロール位置を調整
  useEffect(() => {
    if (currentDate && activeItemRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const activeItem = activeItemRef.current;
      const containerHeight = container.clientHeight;
      const itemTop = activeItem.offsetTop;
      const itemHeight = activeItem.offsetHeight;

      // アクティブなアイテムを中央に配置
      const scrollTop = itemTop - containerHeight / 2 + itemHeight / 2;
      container.scrollTo({
        top: scrollTop,
        behavior: 'smooth',
      });
    }
  }, [currentDate]);

  if (dateEntries.length === 0) return null;

  return (
    <div
      className={clsx(
        'fixed right-0 top-1/2 -translate-y-1/2 z-40 transition-all duration-300',
        isExpanded ? 'w-48' : 'w-12',
        className,
      )}
    >
      <div className="glass-panel rounded-l-2xl h-[60vh] max-h-[600px] flex flex-col overflow-hidden">
        {/* ヘッダー */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
          aria-label={
            isExpanded ? '日付ジャンプを閉じる' : '日付ジャンプを開く'
          }
        >
          <Calendar className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>

        {/* 日付リスト */}
        {isExpanded && (
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700"
          >
            <div className="p-2 space-y-1">
              {dateEntries.map((entry) => {
                const isActive = currentDate === entry.dateString;
                const isSelected = selectedDate === entry.dateString;

                return (
                  <div
                    key={entry.dateString}
                    ref={isActive ? activeItemRef : null}
                  >
                    <button
                      type="button"
                      onClick={() => handleDateClick(entry)}
                      className={clsx(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200',
                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                        isActive &&
                          'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium',
                        isSelected &&
                          !isActive &&
                          'bg-gray-100 dark:bg-gray-800',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{entry.dateString}</span>
                        {entry.count > 1 && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            {entry.count}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

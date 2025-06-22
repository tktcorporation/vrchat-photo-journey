import { cn } from '@/components/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { type FC, useCallback, useEffect, useMemo, useRef } from 'react';
import { match } from 'ts-pattern';
import type { GroupedPhoto } from '../useGroupPhotos';

export interface DateIndex {
  dateToGroups: Map<string, number[]>;
  sortedDates: string[];
  groupToDates: Map<number, string>;
}

export interface DateSummary {
  date: string;
  label: string;
  photoCount: number;
  groupIndices: number[];
  year?: string;
  month?: string;
}

interface DateJumpSidebarProps {
  groups: GroupedPhoto[];
  onJumpToDate: (groupIndex: number) => void;
  currentGroupIndex?: number;
  className?: string;
}

export const DateJumpSidebar: FC<DateJumpSidebarProps> = ({
  groups,
  onJumpToDate,
  currentGroupIndex,
  className,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // 日付インデックスを生成
  const dateIndex = useMemo<DateIndex>(() => {
    const dateToGroups = new Map<string, number[]>();
    const groupToDates = new Map<number, string>();

    groups.forEach((group, index) => {
      const date = format(group.joinDateTime, 'yyyy-MM-dd');
      const existing = dateToGroups.get(date) || [];
      existing.push(index);
      dateToGroups.set(date, existing);
      groupToDates.set(index, date);
    });

    const sortedDates = Array.from(dateToGroups.keys()).sort().reverse();

    return { dateToGroups, sortedDates, groupToDates };
  }, [groups]);

  // 日付サマリーを生成（UI表示用）
  const dateSummaries = useMemo<DateSummary[]>(() => {
    let lastYear: string | null = null;
    let lastMonth: string | null = null;

    return dateIndex.sortedDates.map((date) => {
      const [year, month, day] = date.split('-');
      const groupIndices = dateIndex.dateToGroups.get(date) || [];
      const photoCount = groupIndices.reduce(
        (sum, idx) => sum + groups[idx].photos.length,
        0,
      );

      const summary: DateSummary = {
        date,
        label: `${Number.parseInt(day)}日`,
        photoCount,
        groupIndices,
      };

      // 年が変わった場合
      match(year !== lastYear)
        .with(true, () => {
          summary.year = `${year}年`;
          lastYear = year;
        })
        .otherwise(() => {});

      // 月が変わった場合
      match(month !== lastMonth)
        .with(true, () => {
          summary.month = `${Number.parseInt(month)}月`;
          lastMonth = month;
        })
        .otherwise(() => {});

      return summary;
    });
  }, [dateIndex, groups]);

  // 現在表示中の日付
  const currentDate = useMemo(() => {
    return match(currentGroupIndex)
      .with(undefined, () => null)
      .otherwise((idx) => dateIndex.groupToDates.get(idx) || null);
  }, [currentGroupIndex, dateIndex]);

  // 日付クリックハンドラー
  const handleDateClick = useCallback(
    (summary: DateSummary) => {
      // その日付の最初のグループにジャンプ
      const firstGroupIndex = summary.groupIndices[0];
      onJumpToDate(firstGroupIndex);
    },
    [onJumpToDate],
  );

  // 現在の日付が表示されるようにスクロール
  useEffect(() => {
    match(currentDate)
      .with(null, () => {})
      .otherwise((date) => {
        const element = itemRefs.current.get(date);
        match(element)
          .with(undefined, () => {})
          .otherwise((el) => {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
      });
  }, [currentDate]);

  return (
    <div
      ref={sidebarRef}
      className={cn(
        'fixed right-0 top-0 h-full w-20 overflow-y-auto bg-background/95 backdrop-blur',
        'border-l border-border shadow-lg z-10',
        'scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent',
        className,
      )}
    >
      <div className="py-4">
        {dateSummaries.map((summary) => (
          <div key={summary.date}>
            {summary.year && (
              <div className="px-2 py-1 text-xs font-bold text-muted-foreground">
                {summary.year}
              </div>
            )}
            {summary.month && (
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                {summary.month}
              </div>
            )}
            <div
              ref={(el) => {
                if (el) itemRefs.current.set(summary.date, el);
              }}
              onClick={() => handleDateClick(summary)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleDateClick(summary);
                }
              }}
              role="button"
              tabIndex={0}
              className={cn(
                'px-2 py-1 cursor-pointer hover:bg-accent transition-colors',
                'flex flex-col items-center',
                currentDate === summary.date && 'bg-accent font-semibold',
              )}
            >
              <div className="text-sm">{summary.label}</div>
              <div className="text-xs text-muted-foreground">
                {summary.photoCount}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

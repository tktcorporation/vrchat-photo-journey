import { cn } from '@/components/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  type FC,
  type MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  normalizedHeight: number;
}

interface DateJumpSidebarProps {
  groups: GroupedPhoto[];
  onJumpToDate: (groupIndex: number) => void;
  currentGroupIndex?: number;
  className?: string;
  scrollContainer?: HTMLElement | null;
}

export const DateJumpSidebar: FC<DateJumpSidebarProps> = ({
  groups,
  onJumpToDate,
  currentGroupIndex,
  className,
  scrollContainer,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();

  // スクロール状態の検知
  useEffect(() => {
    if (!scrollContainer) return;

    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 500);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [scrollContainer]);

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

  // 日付サマリーを生成
  const dateSummaries = useMemo<DateSummary[]>(() => {
    let lastYear: string | null = null;
    let lastMonth: string | null = null;

    // 最大写真枚数を計算
    const maxPhotoCount = Math.max(
      ...dateIndex.sortedDates.map((date) => {
        const groupIndices = dateIndex.dateToGroups.get(date) || [];
        return groupIndices.reduce(
          (sum, idx) => sum + groups[idx].photos.length,
          0,
        );
      }),
    );

    return dateIndex.sortedDates.map((date) => {
      const [year, month, day] = date.split('-');
      const groupIndices = dateIndex.dateToGroups.get(date) || [];
      const photoCount = groupIndices.reduce(
        (sum, idx) => sum + groups[idx].photos.length,
        0,
      );

      const normalizedHeight = Math.max(0.2, photoCount / maxPhotoCount);

      const summary: DateSummary = {
        date,
        label: `${Number.parseInt(day)}日`,
        photoCount,
        groupIndices,
        normalizedHeight,
      };

      // 年が変わった場合
      match(year !== lastYear)
        .with(true, () => {
          summary.year = year;
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

  // クリック位置から最も近い日付を見つける
  const handleSidebarClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!sidebarRef.current || dateSummaries.length === 0) return;

      const rect = sidebarRef.current.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const clickPercent = (clickY / rect.height) * 100;

      // クリック位置に最も近い日付を見つける
      let closestIndex = 0;
      let minDistance = Number.POSITIVE_INFINITY;

      dateSummaries.forEach((_, index) => {
        const datePercent = getDatePosition(index);
        const distance = Math.abs(datePercent - clickPercent);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      const summary = dateSummaries[closestIndex];
      const firstGroupIndex = summary.groupIndices[0];
      onJumpToDate(firstGroupIndex);
    },
    [dateSummaries, onJumpToDate],
  );

  // 日付の位置を計算（パディングを考慮した配置）
  const getDatePosition = (index: number) => {
    if (dateSummaries.length <= 1) return 50;
    // 上下に5%ずつ余白を確保して、10%〜90%の範囲に配置
    const paddingPercent = 10;
    const usableRange = 100 - paddingPercent * 2;
    return paddingPercent + (index / (dateSummaries.length - 1)) * usableRange;
  };

  return (
    <>
      {/* メインのタイムラインバー */}
      <div
        ref={sidebarRef}
        className={cn(
          'fixed right-0 top-0 h-full transition-all duration-300',
          isHovering || isScrolling ? 'w-24' : 'w-2',
          'group cursor-pointer',
          className,
        )}
        onClick={handleSidebarClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            const rect = sidebarRef.current?.getBoundingClientRect();
            if (rect) {
              const mockEvent = {
                clientY: rect.top + rect.height / 2,
              } as MouseEvent<HTMLDivElement>;
              handleSidebarClick(mockEvent);
            }
          }
        }}
        role="navigation"
        aria-label="日付ジャンプサイドバー"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setHoveredDate(null);
        }}
        onMouseMove={(e) => {
          if (!sidebarRef.current || dateSummaries.length === 0) return;

          const rect = sidebarRef.current.getBoundingClientRect();
          const mouseY = e.clientY - rect.top;
          const mousePercent = (mouseY / rect.height) * 100;

          // マウス位置に最も近い日付を見つける
          let closestDate: string | null = null;
          let minDistance = Number.POSITIVE_INFINITY;

          dateSummaries.forEach((summary, index) => {
            const datePercent = getDatePosition(index);
            const distance = Math.abs(datePercent - mousePercent);
            if (distance < minDistance) {
              minDistance = distance;
              closestDate = summary.date;
            }
          });

          setHoveredDate(closestDate);
        }}
      >
        {/* 背景 */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-300',
            isHovering || isScrolling
              ? 'bg-background/98 backdrop-blur-lg border-l border-border shadow-xl'
              : 'bg-gradient-to-l from-background/50 to-transparent',
          )}
        />

        {/* タイムライン */}
        <div className="relative h-full py-12">
          {/* 年の区切り線 */}
          {dateSummaries.map((summary, index) =>
            summary.year ? (
              <div
                key={`year-${summary.date}`}
                className="absolute left-0 right-0 z-10 pointer-events-none"
                style={{ top: `${getDatePosition(index)}%` }}
              >
                <div
                  className={cn(
                    'h-[2px] transition-all duration-300',
                    isHovering || isScrolling
                      ? 'bg-foreground/20 w-full'
                      : 'bg-foreground/40 w-2/3 ml-auto',
                  )}
                />
                {(isHovering || isScrolling) && (
                  <div className="absolute left-2 -top-4">
                    <span className="text-xs font-bold bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 rounded">
                      {summary.year}
                    </span>
                  </div>
                )}
              </div>
            ) : null,
          )}

          {/* 月の区切り線 */}
          {dateSummaries.map((summary, index) =>
            summary.month && !summary.year ? (
              <div
                key={`month-${summary.date}`}
                className="absolute left-0 right-0 z-10 pointer-events-none"
                style={{ top: `${getDatePosition(index)}%` }}
              >
                <div
                  className={cn(
                    'h-[1px] transition-all duration-300',
                    isHovering || isScrolling
                      ? 'bg-foreground/10 w-full'
                      : 'bg-foreground/20 w-1/2 ml-auto',
                  )}
                />
                {(isHovering || isScrolling) && (
                  <div className="absolute left-2 -top-3">
                    <span className="text-[10px] font-medium bg-black/80 text-white dark:bg-white/80 dark:text-black px-1 py-0.5 rounded">
                      {summary.month}
                    </span>
                  </div>
                )}
              </div>
            ) : null,
          )}

          {/* 各日付のビジュアル表現 */}
          {dateSummaries.map((summary, index) => {
            const isCurrentDate = currentDate === summary.date;
            const isHovered = hoveredDate === summary.date;

            return (
              <div
                key={summary.date}
                className="absolute right-0 z-20 pointer-events-none"
                style={{
                  top: `${getDatePosition(index)}%`,
                  transform: 'translateY(-50%)',
                }}
              >
                {/* 日付のビジュアルバー */}
                <div className="relative">
                  <div
                    className={cn(
                      'transition-all duration-300 ring-1 ring-foreground/10',
                      isCurrentDate
                        ? 'bg-primary shadow-lg shadow-primary/30 ring-primary/50'
                        : isHovered
                          ? 'bg-accent shadow-md shadow-accent/20 ring-accent/40'
                          : 'bg-foreground/20 hover:bg-foreground/30',
                      isHovering || isScrolling ? 'rounded-md' : 'rounded-full',
                    )}
                    style={{
                      width:
                        isHovering || isScrolling
                          ? `${Math.max(20, summary.normalizedHeight * 60)}px`
                          : `${3 + summary.normalizedHeight * 5}px`,
                      height:
                        isHovering || isScrolling
                          ? '4px'
                          : `${3 + summary.normalizedHeight * 5}px`,
                      opacity:
                        isHovering || isScrolling
                          ? 1
                          : 0.5 + summary.normalizedHeight * 0.5,
                    }}
                  />

                  {/* アクティブな日付の場合は追加のインジケーター */}
                  {isCurrentDate && !isHovering && !isScrolling && (
                    <div className="absolute inset-0 rounded-full bg-primary animate-ping opacity-75" />
                  )}
                </div>

                {/* ホバー/スクロール時の詳細情報 */}
                {(isHovering || isScrolling) &&
                  (isHovered || isCurrentDate) && (
                    <div
                      className={cn(
                        'absolute right-full mr-2 top-1/2 -translate-y-1/2',
                        'bg-black text-white dark:bg-white dark:text-black',
                        'rounded-md shadow-lg shadow-black/30',
                        'px-2.5 py-1.5 text-xs whitespace-nowrap',
                        'animate-in fade-in-0 slide-in-from-right-2 duration-200',
                      )}
                    >
                      <div className="font-semibold">
                        {format(new Date(summary.date), 'M/d', {
                          locale: ja,
                        })}
                      </div>
                      <div className="text-[11px] opacity-80">
                        {summary.photoCount}枚
                      </div>
                    </div>
                  )}
              </div>
            );
          })}

          {/* 現在位置インジケーター */}
          {currentDate && dateSummaries.length > 0 && (
            <div
              className={cn(
                'absolute left-0 right-0 z-5 pointer-events-none',
                'transition-all duration-500',
              )}
              style={{
                top: `${getDatePosition(
                  dateSummaries.findIndex((s) => s.date === currentDate),
                )}%`,
              }}
            >
              <div
                className={cn(
                  'rounded-full transition-all duration-300',
                  isHovering || isScrolling
                    ? 'h-12 -mt-6 bg-primary/10 backdrop-blur-sm w-full'
                    : 'h-6 -mt-3 bg-primary/20 w-2 ml-auto',
                )}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

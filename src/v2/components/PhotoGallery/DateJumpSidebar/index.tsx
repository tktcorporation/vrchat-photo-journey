import { cn } from '@/components/lib/utils';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  type FC,
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
  normalizedHeight: number; // 0-1の正規化された高さ
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

  // 日付サマリーを生成（UI表示用）
  const dateSummaries = useMemo<DateSummary[]>(() => {
    let lastYear: string | null = null;
    let lastMonth: string | null = null;

    // 最大写真枚数を計算（正規化用）
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

      // 写真枚数を0-1に正規化（最小高さ0.2を保証）
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

  // 日付クリックハンドラー
  const handleDateClick = useCallback(
    (summary: DateSummary) => {
      const firstGroupIndex = summary.groupIndices[0];
      onJumpToDate(firstGroupIndex);
    },
    [onJumpToDate],
  );

  // 日付の位置を計算（全体の高さに対する割合）
  const getDatePosition = (index: number) => {
    if (dateSummaries.length <= 1) return 50;
    return (index / (dateSummaries.length - 1)) * 100;
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
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setHoveredDate(null);
        }}
      >
        {/* 背景とボーダー */}
        <div
          className={cn(
            'absolute inset-0 transition-all duration-300',
            isHovering || isScrolling
              ? 'bg-background/95 backdrop-blur border-l border-border shadow-lg'
              : 'bg-muted/20',
          )}
        />

        {/* タイムライン */}
        <div className="relative h-full py-8">
          {/* 年の区切り線 */}
          {dateSummaries.map((summary, index) =>
            summary.year ? (
              <div
                key={`year-${summary.date}`}
                className="absolute left-0 right-0 z-10"
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
                  <div className="absolute left-2 -top-4 text-xs font-bold text-foreground/70">
                    {summary.year}
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
                className="absolute left-0 right-0 z-10"
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
                  <div className="absolute left-2 -top-3 text-[10px] text-foreground/50">
                    {summary.month}
                  </div>
                )}
              </div>
            ) : null,
          )}

          {/* 各日付のバー */}
          {dateSummaries.map((summary, index) => {
            const isCurrentDate = currentDate === summary.date;
            const isHovered = hoveredDate === summary.date;

            return (
              <div
                key={summary.date}
                className="absolute right-0 z-20"
                style={{
                  top: `${getDatePosition(index)}%`,
                  transform: 'translateY(-50%)',
                }}
                onMouseEnter={() => setHoveredDate(summary.date)}
                onMouseLeave={() => setHoveredDate(null)}
                onClick={() => handleDateClick(summary)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleDateClick(summary);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`${format(new Date(summary.date), 'yyyy年M月d日', {
                  locale: ja,
                })} - ${summary.photoCount}枚の写真`}
              >
                {/* 日付のビジュアルバー */}
                <div className="relative">
                  {/* ヒートマップ風のドット */}
                  <div
                    className={cn(
                      'transition-all duration-300',
                      isCurrentDate
                        ? 'bg-primary shadow-lg shadow-primary/30'
                        : isHovered
                          ? 'bg-accent shadow-md shadow-accent/20'
                          : 'bg-foreground/10 hover:bg-foreground/20',
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
                          : 0.4 + summary.normalizedHeight * 0.6,
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
                        'bg-popover/95 backdrop-blur border rounded-md shadow-md',
                        'px-2 py-1 text-xs whitespace-nowrap',
                        'animate-in fade-in-0 slide-in-from-right-2 duration-200',
                      )}
                    >
                      <div className="font-medium">
                        {format(new Date(summary.date), 'M/d', {
                          locale: ja,
                        })}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {summary.photoCount}
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

import type React from 'react';
import { useEffect, useRef } from 'react';
import { useCurrentGroup } from './useCurrentGroup';

/**
 * ギャラリーで現在表示されている写真グループを追跡するフック。
 *
 * @param contentRef - グループ要素を保持するスクロールコンテナの参照。
 * @param groupNames - 監視対象のグループ名一覧。
 * @returns 各グループ要素に付与する参照のマップ。
 */
export function useGroupInView(
  contentRef: React.RefObject<HTMLDivElement>,
  groupNames: string[],
) {
  const groupRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const { setCurrentGroup } = useCurrentGroup();

  useEffect(() => {
    if (!contentRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const groupName = entry.target.getAttribute('data-group-name');
            if (groupName) {
              setCurrentGroup(groupName);
            }
          }
        }
      },
      {
        root: null,
        rootMargin: '-80px 0px -80% 0px',
        threshold: [0, 1],
      },
    );

    for (const element of groupRefs.current.values()) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [groupNames, setCurrentGroup]);

  return { groupRefs };
}

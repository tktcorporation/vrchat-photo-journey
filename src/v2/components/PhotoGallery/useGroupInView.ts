import type React from 'react';
import { useEffect, useRef } from 'react';
import { useCurrentGroup } from './useCurrentGroup';

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

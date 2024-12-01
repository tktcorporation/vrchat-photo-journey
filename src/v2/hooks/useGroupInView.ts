import { useEffect, useRef } from 'react';

export function useGroupInView(
  groupNames: string[],
  setCurrentGroup: (groupName: string) => void,
) {
  const groupRefs = useRef<HTMLElement[]>([]);

  useEffect(() => {
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
        threshold: 0.5,
      },
    );

    for (const element of groupRefs.current) {
      observer.observe(element);
    }

    return () => {
      observer.disconnect();
    };
  }, [groupNames, setCurrentGroup]);

  return { groupRefs };
}

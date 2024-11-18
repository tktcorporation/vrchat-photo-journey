import { Skeleton } from '@/v1/components/ui/skeleton';
import type React from 'react';
import { useInView } from 'react-intersection-observer';

interface RenderInViewProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  threshold?: number;
  delay?: number;
  triggerOnce?: boolean;
}
export const RenderInView = ({
  children,
  threshold = 0.1,
  delay = 0,
  triggerOnce = true,
  ...props
}: RenderInViewProps) => {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
    delay,
  });

  return (
    <div ref={ref} {...props}>
      {inView ? children : <Skeleton className="w-full h-full" />}
    </div>
  );
};

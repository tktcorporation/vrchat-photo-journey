import type React from 'react';
import { useInView } from 'react-intersection-observer';

interface RenderInViewProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  threshold?: number;
  triggerOnce?: boolean;
}
export const RenderInView = ({
  children,
  threshold = 0.1,
  triggerOnce = true,
  ...props
}: RenderInViewProps) => {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
  });

  return (
    <div ref={ref} {...props}>
      {inView ? children : null}
    </div>
  );
};

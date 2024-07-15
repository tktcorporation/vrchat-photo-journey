import type React from 'react';
import { useInView } from 'react-intersection-observer';

export const RenderInView = ({
  children,
  threshold = 0.1,
  triggerOnce = true,
  ...props
}: {
  children: React.ReactNode;
  threshold?: number;
  triggerOnce?: boolean;
}) => {
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

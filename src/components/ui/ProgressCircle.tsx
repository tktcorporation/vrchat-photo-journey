import React, { forwardRef } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';

type ProgressCircleProps = Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'value'> & {
  value: number;
  className?: string;
};

const ProgressCircle = forwardRef<HTMLDivElement, ProgressCircleProps>(({ className, value, ...props }, ref) => {
  const radius = 30; // 円の半径
  const circumference = 2 * Math.PI * radius;
  const center = radius + 5; // SVG padding を考慮した中心の座標

  return (
    <ProgressPrimitive.Root ref={ref} value={value} max={100} className={className} {...props}>
      <svg className="w-20 h-20">
        <circle
          className="text-gray-300"
          strokeWidth="5"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        <ProgressPrimitive.Indicator asChild>
          <circle
            strokeWidth="5"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (value / 100) * circumference}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={center}
            cy={center}
          />
        </ProgressPrimitive.Indicator>
        <text
          x={center}
          y={center}
          className="text-xl"
          textAnchor="middle" // 水平中央揃え
          dominantBaseline="central" // 垂直中央揃え（"middle" ではなく "central" を使用）
          fill="currentColor"
        >
          {`${value.toFixed(0)}%`}
        </text>
      </svg>
    </ProgressPrimitive.Root>
  );
});

ProgressCircle.displayName = 'ProgressCircle';

export default ProgressCircle;

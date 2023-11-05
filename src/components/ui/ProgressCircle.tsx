import React, { forwardRef } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

type ProgressCircleProps = Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'value'> & {
  value: number;
  className?: string;
};

const ProgressCircle = forwardRef<HTMLDivElement, ProgressCircleProps>(({ className, value, ...props }, ref) => {
  const radius = 40; // 円の半径 updated to 40
  const strokeWidth = 8; // 線の太さ updated to 8
  const circumference = 2 * Math.PI * radius;
  const center = radius + strokeWidth / 2; // SVG padding と線の太さを考慮した中心の座標
  const svgSize = radius * 2 + strokeWidth; // SVG全体のサイズ

  const color = value < 100 ? 'text-red-500' : 'text-green-500';

  return (
    <ProgressPrimitive.Root ref={ref} value={value} max={100} className={cn(color, className)} {...props}>
      <svg
        className="w-24 h-24" // SVGのサイズを調整してください
        viewBox={`0 0 ${svgSize} ${svgSize}`} // viewBoxを調整
      >
        <circle
          className="text-gray-300"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={center}
          cy={center}
        />
        <ProgressPrimitive.Indicator asChild>
          <circle
            strokeWidth={strokeWidth}
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

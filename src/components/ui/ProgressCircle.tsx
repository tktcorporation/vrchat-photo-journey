import React, { forwardRef } from 'react';
import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '@/lib/utils';

type ProgressCircleProps = Omit<React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>, 'value'> & {
  value: number;
  className?: string;
  size: 'small' | 'medium' | 'large';
};

const getVariables = (size: 'small' | 'medium' | 'large'): { radius: number; textSize: string } => {
  let radius: number;
  let textSize: string;
  switch (size) {
    case 'small':
      radius = 20;
      textSize = 'text-sm'; // 小さいテキストサイズ
      break;
    case 'medium':
      radius = 30;
      textSize = 'text-md'; // 中くらいのテキストサイズ
      break;
    case 'large':
    default:
      radius = 40;
      textSize = 'text-lg'; // 大きいテキストサイズ
  }
  return { radius, textSize };
};

const ProgressCircle = forwardRef<HTMLDivElement, ProgressCircleProps>(({ className, value, size, ...props }, ref) => {
  const { radius, textSize } = getVariables(size);

  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const center = radius + strokeWidth / 2;
  const svgSize = radius * 2 + strokeWidth;

  const color = value < 100 ? 'text-red-500' : 'text-green-500';
  const svgClassName = `w-${size} h-${size}`;

  return (
    <ProgressPrimitive.Root ref={ref} value={value} max={100} className={cn(color, className)} {...props}>
      <svg className={svgClassName} viewBox={`0 0 ${svgSize} ${svgSize}`}>
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
          className={cn(textSize, 'text-xl')}
          textAnchor="middle"
          dominantBaseline="central"
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

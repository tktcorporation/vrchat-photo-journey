// import * as ScrollArea from '@radix-ui/react-scroll-area';
// import * as Tooltip from '@radix-ui/react-tooltip';
// import { format, isSameYear, parseISO } from 'date-fns';
// import { clamp } from 'lodash-es';
// import type React from 'react';
// import { useCallback, useEffect, useRef, useState } from 'react';

// interface AssetStore {
//   timelineHeight: number;
//   buckets: AssetBucket[];
// }

// interface AssetBucket {
//   assets: any[];
//   bucketHeight: number;
//   bucketDate: string;
// }

// interface Props {
//   timelineY: number;
//   height: number;
//   assetStore: AssetStore;
// }

// const HOVER_DATE_HEIGHT = 30;
// const MIN_YEAR_LABEL_DISTANCE = 16;

// const TimelineScrollbar: React.FC<Props> = ({
//   timelineY,
//   height,
//   assetStore,
// }) => {
//   const [isDragging, setIsDragging] = useState(false);
//   const [hoverLabel, setHoverLabel] = useState('');
//   const [hoverY, setHoverY] = useState(0);
//   const [clientY, setClientY] = useState(0);
//   const [windowHeight, setWindowHeight] = useState(window.innerHeight);
//   const scrollBarRef = useRef<HTMLDivElement | null>(null);

//   const toScrollY = useCallback(
//     (timelineY: number) => (timelineY / assetStore.timelineHeight) * height,
//     [assetStore.timelineHeight, height],
//   );

//   const toTimelineY = useCallback(
//     (scrollY: number) =>
//       Math.round((scrollY * assetStore.timelineHeight) / height),
//     [assetStore.timelineHeight, height],
//   );

//   useEffect(() => {
//     const handleResize = () => setWindowHeight(window.innerHeight);
//     window.addEventListener('resize', handleResize);
//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   useEffect(() => {
//     const newHoverY = clamp(height - windowHeight + clientY, 0, height);
//     setHoverY(newHoverY);

//     if (scrollBarRef.current) {
//       const rect = scrollBarRef.current.getBoundingClientRect();
//       const x = rect.left + rect.width / 2;
//       const y = rect.top + Math.min(newHoverY, height - 1);
//       updateLabel(x, y);
//     }
//   }, [clientY, height, windowHeight]);

//   const scrollY = toScrollY(timelineY);

//   class Segment {
//     public count = 0;
//     public height = 0;
//     public timeGroup = '';
//     public date!: Date;
//     public hasLabel = false;
//   }

//   const calculateSegments = useCallback(
//     (buckets: AssetBucket[]) => {
//       let height = 0;
//       let previous: Segment | null = null;
//       return buckets.map((bucket) => {
//         const segment = new Segment();
//         segment.count = bucket.assets.length;
//         segment.height = toScrollY(bucket.bucketHeight);
//         segment.timeGroup = bucket.bucketDate;
//         segment.date = parseISO(segment.timeGroup);

//         if (
//           previous &&
//           !isSameYear(previous.date, segment.date) &&
//           height > MIN_YEAR_LABEL_DISTANCE
//         ) {
//           previous.hasLabel = true;
//           height = 0;
//         }

//         height += segment.height;
//         previous = segment;
//         return segment;
//       });
//     },
//     [toScrollY],
//   );

//   const segments = calculateSegments(assetStore.buckets);

//   const scrollTimeline = useCallback(() => {
//     const newY = toTimelineY(hoverY);
//     const event = new CustomEvent('scrollTimeline', { detail: newY });
//     window.dispatchEvent(event);
//   }, [hoverY, toTimelineY]);

//   const updateLabel = (cursorX: number, cursorY: number) => {
//     const element = document
//       .elementsFromPoint(cursorX, cursorY)
//       .find((el) => el.id === 'time-segment');
//     if (!element) return;

//     const attr = (element as HTMLElement).dataset.date;
//     if (!attr) return;

//     setHoverLabel(format(parseISO(attr), 'MMM yyyy'));
//   };

//   const handleMouseEvent = (event: React.MouseEvent, isDragging?: boolean) => {
//     const wasDragging = isDragging;
//     setClientY(event.clientY);

//     if (wasDragging === false && isDragging) {
//       scrollTimeline();
//     }

//     if (!isDragging) return;

//     window.requestAnimationFrame(() => {
//       scrollTimeline();
//     });
//   };

//   return (
//     <ScrollArea.Root>
//       <ScrollArea.Viewport>
//         <div
//           id="immich-scrubbable-scrollbar"
//           className="relative select-none bg-transparent"
//           style={{ width: '60px', height: `${height}px` }}
//           ref={scrollBarRef}
//           onMouseEnter={() => setIsDragging(true)}
//           onMouseLeave={() => setIsDragging(false)}
//           onMouseMove={(e) => isDragging && handleMouseEvent(e, true)}
//           onMouseDown={(e) => handleMouseEvent(e, true)}
//           onMouseUp={(e) => handleMouseEvent(e, false)}
//         >
//           <Tooltip.Root>
//             <Tooltip.Trigger asChild>
//               <div
//                 className="absolute right-0 z-10 min-w-24 w-fit whitespace-nowrap rounded-tl-md border-b-2 border-immich-primary bg-immich-bg py-1 px-1 text-sm font-medium shadow-[0_0_8px_rgba(0,0,0,0.25)] dark:border-immich-dark-primary dark:bg-immich-dark-gray dark:text-immich-dark-fg"
//                 style={{
//                   top: `${clamp(
//                     hoverY - HOVER_DATE_HEIGHT,
//                     0,
//                     height - HOVER_DATE_HEIGHT - 2,
//                   )}px`,
//                 }}
//               >
//                 {hoverLabel}
//               </div>
//             </Tooltip.Trigger>
//             <Tooltip.Content side="right">
//               <Tooltip.Arrow />
//               {hoverLabel}
//             </Tooltip.Content>
//           </Tooltip.Root>

//           {segments.map((segment, index) => (
//             <div
//               key={index}
//               id="time-segment"
//               className="relative"
//               data-date={segment.date.toISOString()}
//               style={{ height: `${segment.height}px` }}
//               aria-label={`${segment.timeGroup} ${segment.count}`}
//             >
//               {segment.hasLabel ? (
//                 <div
//                   aria-label={`${segment.timeGroup} ${segment.count}`}
//                   className="absolute right-0 bottom-0 z-10 pr-5 text-[12px] dark:text-immich-dark-fg font-immich-mono"
//                 >
//                   {format(segment.date, 'yyyy')}
//                 </div>
//               ) : segment.height > 5 ? (
//                 <div
//                   aria-label={`${segment.timeGroup} ${segment.count}`}
//                   className="absolute right-0 mr-3 block h-[4px] w-[4px] rounded-full bg-gray-300"
//                 />
//               ) : null}
//             </div>
//           ))}
//         </div>
//       </ScrollArea.Viewport>
//       <ScrollArea.Scrollbar orientation="vertical">
//         <ScrollArea.Thumb />
//       </ScrollArea.Scrollbar>
//     </ScrollArea.Root>
//   );
// };

// export default TimelineScrollbar;

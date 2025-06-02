# PhotoGallery Component Architecture

## Overview
PhotoGallery is a complex virtualized photo gallery component that efficiently displays VRChat photos grouped by world sessions. It uses TanStack Virtual for performance and implements sophisticated height measurement and scroll compensation.

## Component Hierarchy

```
PhotoGallery (main container)
├── Header (search, settings, refresh controls)
├── GalleryContent (virtualized content area)
│   ├── GalleryErrorBoundary (error handling wrapper)
│   ├── MeasurePhotoGroup (height calculation for virtualization)
│   ├── LocationGroupHeader (world/session header)
│   ├── PhotoGrid (responsive grid layout)
│   │   └── PhotoCard (individual photo with interactions)
│   │       └── ProgressiveImage (optimized image loading)
│   └── PhotoModal (fullscreen photo view)
└── SettingsModal (application settings)
```

## Data Flow & State Management

### Photo Processing Pipeline
```
Raw Photos → Photo Mapping → Session Grouping → Search Filtering → Virtual Rendering
```

1. **`usePhotoGallery` hook**: Central state management
   - Fetches photos via tRPC: `vrchatPhoto.getVrchatPhotoPathModelList`
   - Manages selection state and multi-select mode
   - Coordinates search filtering

2. **`useGroupPhotos` hook**: Groups photos by VRChat sessions
   - Fetches world join logs: `vrchatWorldJoinLog.getVRChatWorldJoinLogList`
   - Uses binary search for efficient photo-to-session matching
   - Groups photos based on join times

## Virtualization System

### TanStack Virtual Configuration
- **Scroll container**: `GalleryContent` container ref
- **Item count**: Number of filtered photo groups
- **Height estimation**: Dynamic based on group content + 52px spacing
- **Overscan**: 3 items for smooth scrolling
- **Measurement**: Real-time height updates with scroll compensation

### Height Calculation Process
1. **`MeasurePhotoGroup`**: Measures actual group heights
2. **`PhotoGrid`**: Calculates responsive grid layout (TARGET_ROW_HEIGHT = 200px)
3. **Virtualizer**: Caches measurements and estimates unmeasured groups
4. **Scroll compensation**: Prevents jumping during remeasurement

## Component Responsibilities

### PhotoGallery (`/src/v2/components/PhotoGallery.tsx`)
- Top-level coordinator and loading state management
- Multi-select mode coordination
- Copy functionality for selected photos
- Keyboard shortcuts (Escape to clear selection)

### Header (`/src/v2/components/PhotoGallery/Header.tsx`)
- Search bar with real-time filtering
- Refresh functionality with log processing sequence
- Multi-select UI (count, copy button)
- Filter controls (show/hide empty groups)

### GalleryContent (`/src/v2/components/PhotoGallery/GalleryContent.tsx`)
- Virtual scrolling implementation using TanStack Virtual
- Group filtering based on `showEmptyGroups` setting
- Background click handling for selection clearing
- Loading states with skeleton UI
- CSS containment optimizations

### MeasurePhotoGroup (`/src/v2/components/PhotoGallery/MeasurePhotoGroup.tsx`)
- Precise height calculation for virtual scrolling
- Scroll position compensation during height changes
- Immediate height updates (no debouncing)
- Ref-based measurement system

### PhotoGrid (`/src/v2/components/PhotoGrid.tsx`)
- Responsive justified layout algorithm
- Row-based photo arrangement with aspect ratio preservation
- Layout recalculation on container resize
- Dynamic row height scaling

### PhotoCard (`/src/v2/components/PhotoCard.tsx`)
- Individual photo rendering with progressive loading
- Selection state visualization (checkboxes, ring highlights)
- Context menu interactions (copy, share, open in app)
- Intersection observer for lazy loading (100px margin)

## Performance Optimizations

### Scrolling Performance
- **Height estimation**: Better fallback values (300px vs 0px)
- **Scroll compensation**: Prevents jumping during height changes
- **Measurement optimization**: Only triggers when height changes >1px
- **CSS containment**: Layout/paint isolation
- **GPU acceleration**: `transform3d` positioning

### Memory Management
- **Intersection Observer**: Loads images only when needed
- **Progressive Image**: Placeholder → Low-res → Full-res
- **Query caching**: 30min stale time for logs, 5min for photos
- **Virtualizer overscan**: Limited to 3 items

### Search & Filtering
- **Group-level filtering**: Preserves entire groups when any photo matches
- **Real-time search**: No re-querying, filters existing data
- **Binary search**: O(log n) photo-to-session matching

## Key Technical Details

### Photo-to-Session Matching
Uses binary search algorithm in `groupPhotosBySession`:
- Finds latest session before each photo's timestamp
- Falls back to closest absolute time match
- Handles edge cases (identical timestamps, missing logs)

### Error Handling
- **GalleryErrorBoundary**: React error boundary with recovery UI
- **Path validation**: Automatic photo path cleanup
- **Graceful degradation**: Placeholders for missing images

### CSS Architecture
- **`.photo-gallery-container`**: `contain: strict` for maximum isolation
- **`.photo-group`**: `contain: layout size paint` with GPU hints
- **`.photo-group-measure`**: Size/layout containment for measurements
- **`.photo-grid`**: Layout/paint containment with transform optimization

## Performance Considerations

1. **Virtualizer estimation accuracy**: Better estimates reduce scroll jumping
2. **Height measurement timing**: Immediate updates vs debounced updates
3. **CSS containment**: Prevents layout thrashing but can hide content
4. **Scroll compensation**: Maintains position during dynamic height changes
5. **Overscan balance**: More items = smoother scroll, more memory usage

## Common Issues & Solutions

### Rendering Problems
- **CSS containment too strict**: Can hide overflowing content
- **Height estimation errors**: Causes scroll position jumps
- **Measurement timing**: Race conditions between measurement and rendering

### Performance Issues
- **Excessive measurement**: Check height change thresholds
- **Memory leaks**: Ensure proper cleanup of intersection observers
- **Scroll jumping**: Verify scroll compensation logic

## Data Dependencies

### tRPC Queries
- `vrchatPhoto.getVrchatPhotoPathModelList`: Main photo data
- `vrchatWorldJoinLog.getVRChatWorldJoinLogList`: Session grouping data

### External Libraries
- **TanStack Virtual**: Core virtualization
- **Jotai**: State management
- **React Window**: Alternative virtualization (not currently used)

This architecture enables efficient handling of large photo collections (thousands of photos) while maintaining 60fps scrolling performance and responsive user interactions.
/**
 * Event listener utilities for managing DOM events consistently
 *
 * Provides hooks for handling common event listener patterns with automatic cleanup
 */

import type React from 'react';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook for managing a single event listener with automatic cleanup
 *
 * @param target - Event target (window, document, element, etc.)
 * @param type - Event type (e.g., 'resize', 'click', 'scroll')
 * @param listener - Event listener function
 * @param options - Event listener options
 * @param deps - Dependencies array for re-registering the listener
 */
export const useEventListener = <T extends EventTarget>(
  target: T | null,
  type: string,
  listener: EventListener,
  options?: AddEventListenerOptions,
  deps: React.DependencyList = [],
) => {
  const savedListener = useRef<EventListener>();

  // Update the saved listener when it changes
  useEffect(() => {
    savedListener.current = listener;
  }, [listener]);

  useEffect(() => {
    if (!target) return;

    const eventListener: EventListener = (event) => {
      savedListener.current?.(event);
    };

    target.addEventListener(type, eventListener, options);

    return () => {
      target.removeEventListener(type, eventListener, options);
    };
  }, [target, type, options, ...deps]);
};

/**
 * Hook for managing multiple event listeners on the same target
 *
 * @param target - Event target (window, document, element, etc.)
 * @param events - Array of event configurations
 * @param deps - Dependencies array for re-registering the listeners
 */
export const useMultipleEventListeners = <T extends EventTarget>(
  target: T | null,
  events: Array<{
    type: string;
    listener: EventListener;
    options?: AddEventListenerOptions;
  }>,
  deps: React.DependencyList = [],
) => {
  const savedListeners = useRef<Map<string, EventListener>>(new Map());

  // Update saved listeners when they change
  useEffect(() => {
    // biome-ignore lint/complexity/noForEach: Simple side effect operation is appropriate for forEach
    events.forEach(({ type, listener }) => {
      savedListeners.current.set(type, listener);
    });
  }, [events]);

  useEffect(() => {
    if (!target) return;

    const eventListeners = new Map<string, EventListener>();

    // biome-ignore lint/complexity/noForEach: Event registration side effects are appropriate for forEach
    events.forEach(({ type, options }) => {
      const eventListener: EventListener = (event) => {
        savedListeners.current.get(type)?.(event);
      };

      eventListeners.set(type, eventListener);
      target.addEventListener(type, eventListener, options);
    });

    return () => {
      eventListeners.forEach((listener, type) => {
        const eventConfig = events.find((e) => e.type === type);
        target.removeEventListener(type, listener, eventConfig?.options);
      });
    };
  }, [target, events, ...deps]);
};

/**
 * Hook for managing window event listeners
 *
 * @param events - Array of window event configurations
 * @param deps - Dependencies array for re-registering the listeners
 */
export const useWindowEventListeners = (
  events: Array<{
    type: keyof WindowEventMap;
    listener: EventListener;
    options?: AddEventListenerOptions;
  }>,
  deps: React.DependencyList = [],
) => {
  useMultipleEventListeners(window, events, deps);
};

/**
 * Hook for managing document event listeners
 *
 * @param events - Array of document event configurations
 * @param deps - Dependencies array for re-registering the listeners
 */
export const useDocumentEventListeners = (
  events: Array<{
    type: keyof DocumentEventMap;
    listener: EventListener;
    options?: AddEventListenerOptions;
  }>,
  deps: React.DependencyList = [],
) => {
  useMultipleEventListeners(document, events, deps);
};

/**
 * Hook for managing resize events with debouncing
 *
 * @param callback - Callback function to execute on resize
 * @param delay - Debounce delay in milliseconds
 * @param deps - Dependencies array for re-registering the listener
 */
export const useResizeListener = (
  callback: () => void,
  delay = 150,
  deps: React.DependencyList = [],
) => {
  const timeoutRef = useRef<number>();

  const debouncedCallback = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      callback();
    }, delay);
  }, [callback, delay]);

  useEventListener(window, 'resize', debouncedCallback, undefined, deps);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);
};

/**
 * Hook for managing scroll events with throttling
 *
 * @param callback - Callback function to execute on scroll
 * @param delay - Throttle delay in milliseconds
 * @param target - Scroll target (defaults to window)
 * @param deps - Dependencies array for re-registering the listener
 */
export const useScrollListener = (
  callback: () => void,
  delay = 100,
  target: EventTarget | null = window,
  deps: React.DependencyList = [],
) => {
  const lastRun = useRef<number>(0);

  const throttledCallback = useCallback(() => {
    const now = Date.now();

    if (now - lastRun.current >= delay) {
      callback();
      lastRun.current = now;
    }
  }, [callback, delay]);

  useEventListener(target, 'scroll', throttledCallback, undefined, deps);
};

/**
 * Hook for managing click outside events
 *
 * @param ref - Ref to the element to detect clicks outside of
 * @param callback - Callback function to execute on outside click
 * @param deps - Dependencies array for re-registering the listener
 */
export const useClickOutside = <T extends HTMLElement>(
  ref: React.RefObject<T>,
  callback: () => void,
  deps: React.DependencyList = [],
) => {
  const handleClickOutside = useCallback(
    (event: Event) => {
      const target = event.target as Node;

      if (ref.current && !ref.current.contains(target)) {
        callback();
      }
    },
    [ref, callback],
  );

  useEventListener(document, 'mousedown', handleClickOutside, undefined, deps);
  useEventListener(document, 'touchstart', handleClickOutside, undefined, deps);
};

/**
 * Hook for managing keyboard event listeners
 *
 * @param keyMap - Map of key combinations to callback functions
 * @param target - Event target (defaults to document)
 * @param deps - Dependencies array for re-registering the listeners
 */
export const useKeyboardShortcuts = (
  keyMap: Record<string, () => void>,
  target: EventTarget | null = document,
  deps: React.DependencyList = [],
) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const ctrlKey = event.ctrlKey || event.metaKey;
      const shiftKey = event.shiftKey;
      const altKey = event.altKey;

      // Create key combination string
      const combination = [
        ctrlKey ? 'ctrl' : '',
        shiftKey ? 'shift' : '',
        altKey ? 'alt' : '',
        key,
      ]
        .filter(Boolean)
        .join('+');

      const callback = keyMap[combination] || keyMap[key];

      if (callback) {
        event.preventDefault();
        callback();
      }
    },
    [keyMap],
  );

  useEventListener(
    target,
    'keydown',
    handleKeyDown as EventListener,
    undefined,
    deps,
  );
};

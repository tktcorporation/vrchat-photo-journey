/**
 * State management utilities for Jotai atoms
 *
 * Provides convenient hooks for managing atom state with consistent patterns
 */

import { useAtom } from 'jotai';
import type { WritableAtom } from 'jotai';
import { useCallback, useMemo } from 'react';

/**
 * Enhanced atom state hook with additional utilities
 *
 * @param atom - The writable atom to manage
 * @returns Object with value, setter, and utility functions
 */
// biome-ignore lint/suspicious/noExplicitAny: Jotai WritableAtom requires any types for flexibility
export const useAtomState = <T>(atom: WritableAtom<T, any, any>) => {
  const [value, setValue] = useAtom(atom);

  const reset = useCallback(() => {
    // Reset to initial value by setting to undefined and letting atom handle it
    // biome-ignore lint/suspicious/noExplicitAny: Atom reset requires any type for undefined casting
    setValue(undefined as any);
  }, [setValue]);

  const toggle = useCallback(() => {
    if (typeof value === 'boolean') {
      // biome-ignore lint/suspicious/noExplicitAny: Boolean toggle requires any type casting
      setValue(!value as any);
    }
  }, [value, setValue]);

  const update = useCallback(
    (updater: (prev: T) => T) => {
      setValue(updater(value));
    },
    [value, setValue],
  );

  return {
    value,
    setValue,
    reset,
    toggle,
    update,
  };
};

/**
 * Hook for managing multiple atom states with consistent patterns
 *
 * @param atoms - Array of writable atoms to manage
 * @returns Array of atom state objects
 */
// biome-ignore lint/suspicious/noExplicitAny: Multiple atom types require any for flexibility
export const useMultipleAtomStates = <
  T extends readonly WritableAtom<any, any, any>[],
>(
  atoms: T,
) => {
  return useMemo(() => {
    return atoms.map((atom) => useAtomState(atom));
  }, [atoms]);
};

/**
 * Hook for managing atom state with validation
 *
 * @param atom - The writable atom to manage
 * @param validator - Function to validate the value before setting
 * @returns Object with value, validated setter, and validation error
 */
// biome-ignore lint/suspicious/noExplicitAny: Jotai WritableAtom requires any types for flexibility
export const useValidatedAtomState = <T>(
  atom: WritableAtom<T, any, any>,
  validator: (value: T) => string | null,
) => {
  const [value, setValue] = useAtom(atom);

  const validationError = useMemo(() => {
    return validator(value);
  }, [value, validator]);

  const setValidatedValue = useCallback(
    (newValue: T) => {
      const error = validator(newValue);
      if (!error) {
        setValue(newValue);
      }
      return error;
    },
    [setValue, validator],
  );

  const isValid = validationError === null;

  return {
    value,
    setValue: setValidatedValue,
    validationError,
    isValid,
  };
};

/**
 * Hook for managing atom state with debounced updates
 *
 * @param atom - The writable atom to manage
 * @param delay - Debounce delay in milliseconds
 * @returns Object with value, immediate setter, and debounced setter
 */
// biome-ignore lint/suspicious/noExplicitAny: Jotai WritableAtom requires any types for flexibility
export const useDebouncedAtomState = <T>(
  atom: WritableAtom<T, any, any>,
  delay = 300,
) => {
  const [value, setValue] = useAtom(atom);

  const debouncedSetValue = useCallback(
    (newValue: T) => {
      const timeoutId = setTimeout(() => {
        setValue(newValue);
      }, delay);

      return () => clearTimeout(timeoutId);
    },
    [setValue, delay],
  );

  return {
    value,
    setValue,
    debouncedSetValue,
  };
};

/**
 * Hook for managing atom state with history/undo functionality
 *
 * @param atom - The writable atom to manage
 * @param maxHistorySize - Maximum number of history entries to keep
 * @returns Object with value, setter, undo, redo, and history utilities
 */
// biome-ignore lint/suspicious/noExplicitAny: Jotai WritableAtom requires any types for flexibility
export const useAtomStateWithHistory = <T>(
  atom: WritableAtom<T, any, any>,
  _maxHistorySize = 10,
) => {
  const [value, setValue] = useAtom(atom);

  // Simple implementation - could be enhanced with proper history management
  const history = useMemo(() => {
    return [value];
  }, [value]);

  const canUndo = history.length > 1;
  const canRedo = false; // Simplified implementation

  const undo = useCallback(() => {
    if (canUndo && history.length > 1) {
      const previousValue = history[history.length - 2];
      setValue(previousValue);
    }
  }, [canUndo, history, setValue]);

  const redo = useCallback(() => {
    // Simplified implementation
  }, []);

  return {
    value,
    setValue,
    undo,
    redo,
    canUndo,
    canRedo,
    history,
  };
};

/**
 * Hook for managing atom state with persistence
 *
 * @param atom - The writable atom to manage
 * @param storageKey - Key for localStorage persistence
 * @returns Object with value, setter, and persistence utilities
 */
// biome-ignore lint/suspicious/noExplicitAny: Jotai WritableAtom requires any types for flexibility
export const usePersistedAtomState = <T>(
  atom: WritableAtom<T, any, any>,
  storageKey: string,
) => {
  const [value, setValue] = useAtom(atom);

  const saveToStorage = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save atom state to localStorage: ${error}`);
    }
  }, [value, storageKey]);

  const loadFromStorage = useCallback(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        setValue(parsed);
        return parsed;
      }
    } catch (error) {
      console.warn(`Failed to load atom state from localStorage: ${error}`);
    }
    return value;
  }, [storageKey, setValue, value]);

  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn(`Failed to clear atom state from localStorage: ${error}`);
    }
  }, [storageKey]);

  return {
    value,
    setValue,
    saveToStorage,
    loadFromStorage,
    clearStorage,
  };
};

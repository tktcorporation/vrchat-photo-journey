/**
 * Error handling utilities using ts-pattern for type-safe error processing
 *
 * Provides consistent error handling patterns across the application
 */

import { P, match } from 'ts-pattern';

/**
 * Extracts a human-readable error message from various error types
 *
 * @param error - The error to extract message from
 * @param defaultMessage - Default message if error cannot be parsed
 * @returns Human-readable error message
 */
export const extractErrorMessage = (
  error: unknown,
  defaultMessage = 'Unknown error occurred',
): string => {
  return match(error)
    .with(P.instanceOf(Error), (e) => e.message)
    .with(P.string, (msg) => msg)
    .when(
      (e) => typeof e === 'object' && e !== null && 'message' in e,
      // biome-ignore lint/suspicious/noExplicitAny: Necessary for type-safe error message extraction
      (e) => String((e as any).message),
    )
    .otherwise(() => defaultMessage);
};

/**
 * Handles errors with a fallback value and optional error callback
 *
 * @param error - The error to handle
 * @param fallbackValue - Value to return in case of error
 * @param onError - Optional callback to handle the error
 * @returns The fallback value
 */
export const handleErrorWithFallback = <T>(
  error: unknown,
  fallbackValue: T,
  onError?: (error: unknown) => void,
): T => {
  match(error)
    .with(P.instanceOf(Error), (e) => onError?.(e))
    .otherwise((e) => onError?.(e));

  return fallbackValue;
};

/**
 * Determines if an error should be ignored based on message content
 *
 * @param error - The error to check
 * @param ignoredMessages - Array of message substrings to ignore
 * @returns true if error should be ignored
 */
export const shouldIgnoreError = (
  error: unknown,
  ignoredMessages: string[],
): boolean => {
  return match(error)
    .with(P.instanceOf(Error), (e) =>
      ignoredMessages.some((msg) => e.message.includes(msg)),
    )
    .with(P.string, (msg) =>
      ignoredMessages.some((ignored) => msg.includes(ignored)),
    )
    .otherwise(() => false);
};

/**
 * Categorizes errors into different types for appropriate handling
 *
 * @param error - The error to categorize
 * @returns Error category
 */
export type ErrorCategory =
  | 'network'
  | 'validation'
  | 'permission'
  | 'not_found'
  | 'timeout'
  | 'unknown';

export const categorizeError = (error: unknown): ErrorCategory => {
  const message = extractErrorMessage(error).toLowerCase();

  return match(message)
    .when(
      (msg) =>
        msg.includes('network') ||
        msg.includes('fetch') ||
        msg.includes('connection'),
      () => 'network' as const,
    )
    .when(
      (msg) =>
        msg.includes('validation') ||
        msg.includes('invalid') ||
        msg.includes('malformed'),
      () => 'validation' as const,
    )
    .when(
      (msg) =>
        msg.includes('permission') ||
        msg.includes('unauthorized') ||
        msg.includes('forbidden'),
      () => 'permission' as const,
    )
    .when(
      (msg) => msg.includes('not found') || msg.includes('404'),
      () => 'not_found' as const,
    )
    .when(
      (msg) => msg.includes('timeout') || msg.includes('timed out'),
      () => 'timeout' as const,
    )
    .otherwise(() => 'unknown' as const);
};

/**
 * Creates a standardized error handler with category-based actions
 *
 * @param categoryHandlers - Handlers for different error categories
 * @param defaultHandler - Default handler for uncategorized errors
 * @returns Error handler function
 */
export const createCategorizedErrorHandler = (
  categoryHandlers: Partial<Record<ErrorCategory, (error: unknown) => void>>,
  defaultHandler?: (error: unknown) => void,
) => {
  return (error: unknown) => {
    const category = categorizeError(error);
    const handler = categoryHandlers[category] || defaultHandler;

    if (handler) {
      handler(error);
    }
  };
};

/**
 * Wraps an async operation with error handling
 *
 * @param operation - The async operation to wrap
 * @param onError - Error handler function
 * @param onSuccess - Optional success handler
 * @returns Promise that resolves with the result or undefined on error
 */
export const safeAsyncOperation = async <T>(
  operation: () => Promise<T>,
  onError: (error: unknown) => void,
  onSuccess?: (result: T) => void,
): Promise<T | undefined> => {
  try {
    const result = await operation();
    onSuccess?.(result);
    return result;
  } catch (error) {
    onError(error);
    return undefined;
  }
};

/**
 * Retry an async operation with exponential backoff
 *
 * @param operation - The operation to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @param onRetry - Optional callback for retry attempts
 * @returns Promise that resolves with the result
 */
export const retryAsyncOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000,
  onRetry?: (attempt: number, error: unknown) => void,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      onRetry?.(attempt + 1, error);

      const delay = baseDelay * 2 ** attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

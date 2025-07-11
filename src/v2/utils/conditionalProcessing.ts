/**
 * Conditional processing utilities using ts-pattern
 *
 * Provides abstractions for common conditional processing patterns
 */

import { P, match } from 'ts-pattern';

/**
 * Process conditionally based on boolean condition
 *
 * @param condition - Boolean condition to check
 * @param onTrue - Function to execute when condition is true
 * @param onFalse - Function to execute when condition is false
 * @returns Result of the executed function
 */
export const processConditionally = async <T>(
  condition: boolean,
  onTrue: () => Promise<T> | T,
  onFalse: () => Promise<T> | T,
): Promise<T> => {
  return match(condition)
    .with(true, async () => await onTrue())
    .with(false, async () => await onFalse())
    .exhaustive();
};

/**
 * Process based on value with multiple conditions
 *
 * @param value - Value to match against
 * @param patterns - Object mapping patterns to handler functions
 * @param defaultHandler - Default handler if no pattern matches
 * @returns Result of the matched handler
 */
export const processWithPatterns = async <T, R>(
  value: T,
  patterns: Record<string, () => Promise<R> | R>,
  defaultHandler?: () => Promise<R> | R,
): Promise<R> => {
  const stringValue = String(value);
  const handler = patterns[stringValue] || defaultHandler;

  if (!handler) {
    throw new Error(`No handler found for value: ${stringValue}`);
  }

  return await handler();
};

/**
 * Process based on status with common status patterns
 *
 * @param status - Status to match against
 * @param handlers - Handlers for different status types
 * @returns Result of the matched handler
 */
export const processWithStatus = async <T>(
  status: 'pending' | 'inProgress' | 'success' | 'error' | 'skipped',
  handlers: {
    pending?: () => Promise<T> | T;
    inProgress?: () => Promise<T> | T;
    success?: () => Promise<T> | T;
    error?: () => Promise<T> | T;
    skipped?: () => Promise<T> | T;
    default?: () => Promise<T> | T;
  },
): Promise<T | undefined> => {
  return match(status)
    .with('pending', async () =>
      handlers.pending
        ? await handlers.pending()
        : handlers.default
          ? await handlers.default()
          : undefined,
    )
    .with('inProgress', async () =>
      handlers.inProgress
        ? await handlers.inProgress()
        : handlers.default
          ? await handlers.default()
          : undefined,
    )
    .with('success', async () =>
      handlers.success
        ? await handlers.success()
        : handlers.default
          ? await handlers.default()
          : undefined,
    )
    .with('error', async () =>
      handlers.error
        ? await handlers.error()
        : handlers.default
          ? await handlers.default()
          : undefined,
    )
    .with('skipped', async () =>
      handlers.skipped
        ? await handlers.skipped()
        : handlers.default
          ? await handlers.default()
          : undefined,
    )
    .exhaustive();
};

/**
 * Process based on object state with multiple conditions
 *
 * @param state - State object to match against
 * @param matchers - Array of pattern matchers and their handlers
 * @param defaultHandler - Default handler if no pattern matches
 * @returns Result of the matched handler
 */
// biome-ignore lint/suspicious/noExplicitAny: Generic record type requires any for flexibility
export const processWithObjectState = async <S extends Record<string, any>, R>(
  state: S,
  matchers: Array<{
    // biome-ignore lint/suspicious/noExplicitAny: Pattern matching requires any type for flexibility
    pattern: any;
    handler: (state: S) => Promise<R> | R;
  }>,
  defaultHandler?: (state: S) => Promise<R> | R,
): Promise<R> => {
  for (const { pattern, handler } of matchers) {
    const matches = match(state)
      .with(pattern, () => true)
      .otherwise(() => false);

    if (matches) {
      return await handler(state);
    }
  }

  if (defaultHandler) {
    return await defaultHandler(state);
  }

  throw new Error(`No handler found for state: ${JSON.stringify(state)}`);
};

/**
 * Process with retry logic based on error conditions
 *
 * @param operation - Operation to execute
 * @param retryCondition - Function to determine if error should trigger retry
 * @param maxRetries - Maximum number of retries
 * @param onRetry - Optional callback on retry
 * @returns Result of the successful operation
 */
export const processWithRetry = async <T>(
  operation: () => Promise<T>,
  retryCondition: (error: unknown) => boolean,
  maxRetries = 3,
  onRetry?: (attempt: number, error: unknown) => void,
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      const shouldRetry = match(error)
        .when(retryCondition, () => true)
        .otherwise(() => false);

      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }

      onRetry?.(attempt + 1, error);

      // Exponential backoff delay
      const delay = 2 ** attempt * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Process with timeout and fallback
 *
 * @param operation - Operation to execute
 * @param timeout - Timeout in milliseconds
 * @param fallback - Fallback function to execute on timeout
 * @returns Result of the operation or fallback
 */
export const processWithTimeout = async <T>(
  operation: () => Promise<T>,
  timeout: number,
  fallback: () => Promise<T> | T,
): Promise<T> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Operation timed out')), timeout);
  });

  try {
    return await Promise.race([operation(), timeoutPromise]);
  } catch (error) {
    return match(error)
      .with(P.instanceOf(Error), (e) =>
        e.message === 'Operation timed out' ? fallback() : Promise.reject(e),
      )
      .otherwise(() => Promise.reject(error));
  }
};

/**
 * Process with circuit breaker pattern
 *
 * @param operation - Operation to execute
 * @param failureThreshold - Number of failures before circuit opens
 * @param resetTimeout - Time before circuit resets
 * @returns Result of the operation
 */
export const processWithCircuitBreaker = (() => {
  const circuits = new Map<
    string,
    {
      state: 'closed' | 'open' | 'half-open';
      failures: number;
      lastFailureTime: number;
    }
  >();

  return async <T>(
    operation: () => Promise<T>,
    operationId: string,
    failureThreshold = 5,
    resetTimeout = 60000,
  ): Promise<T> => {
    const circuit = circuits.get(operationId) || {
      state: 'closed' as const,
      failures: 0,
      lastFailureTime: 0,
    };

    circuits.set(operationId, circuit);

    // Check if circuit should be reset
    if (
      circuit.state === 'open' &&
      Date.now() - circuit.lastFailureTime > resetTimeout
    ) {
      circuit.state = 'half-open';
      circuit.failures = 0;
    }

    return match(circuit.state)
      .with('open', () => {
        throw new Error(
          `Circuit breaker is open for operation: ${operationId}`,
        );
      })
      .with('closed', 'half-open', async () => {
        try {
          const result = await operation();

          // Success - reset circuit
          circuit.state = 'closed';
          circuit.failures = 0;

          return result;
        } catch (error) {
          // Failure - update circuit
          circuit.failures++;
          circuit.lastFailureTime = Date.now();

          if (circuit.failures >= failureThreshold) {
            circuit.state = 'open';
          }

          throw error;
        }
      })
      .exhaustive();
  };
})();

/**
 * Process with rate limiting
 *
 * @param operation - Operation to execute
 * @param operationId - Unique identifier for the operation
 * @param maxRequests - Maximum requests per time window
 * @param timeWindow - Time window in milliseconds
 * @returns Result of the operation
 */
export const processWithRateLimit = (() => {
  const rateLimiters = new Map<
    string,
    {
      requests: number[];
      windowStart: number;
    }
  >();

  return async <T>(
    operation: () => Promise<T>,
    operationId: string,
    maxRequests = 10,
    timeWindow = 60000,
  ): Promise<T> => {
    const now = Date.now();
    const rateLimiter = rateLimiters.get(operationId) || {
      requests: [],
      windowStart: now,
    };

    rateLimiters.set(operationId, rateLimiter);

    // Clean up old requests outside the time window
    rateLimiter.requests = rateLimiter.requests.filter(
      (requestTime) => now - requestTime < timeWindow,
    );

    // Check if rate limit is exceeded
    if (rateLimiter.requests.length >= maxRequests) {
      throw new Error(`Rate limit exceeded for operation: ${operationId}`);
    }

    // Record the request
    rateLimiter.requests.push(now);

    return await operation();
  };
})();

/**
 * Performance tracking utility for measuring operation execution time
 *
 * Provides a consistent way to track and log performance metrics across the application
 */

export interface PerformanceTracker {
  debug: (message: string) => void;
}

/**
 * Executes an operation with performance tracking and logging
 *
 * @param operation - The operation to execute (sync or async)
 * @param operationName - Human-readable name for the operation
 * @param logger - Optional logger instance (defaults to console.debug)
 * @returns The result of the operation
 */
export const withPerformanceTracking = async <T>(
  operation: () => Promise<T> | T,
  operationName: string,
  logger?: PerformanceTracker,
): Promise<T> => {
  const startTime = performance.now();

  try {
    const result = await operation();
    const endTime = performance.now();

    const message = `${operationName} took ${endTime - startTime} ms`;
    if (logger) {
      logger.debug(message);
    } else {
      console.debug(message);
    }

    return result;
  } catch (error) {
    const endTime = performance.now();
    const message = `${operationName} failed after ${endTime - startTime} ms`;
    if (logger) {
      logger.debug(message);
    } else {
      console.debug(message);
    }
    throw error;
  }
};

/**
 * Creates a performance tracker instance for measuring multiple operations
 *
 * @param baseOperationName - Base name for all operations tracked by this instance
 * @param logger - Optional logger instance (defaults to console.debug)
 * @returns Performance tracker instance
 */
export const createPerformanceTracker = (
  baseOperationName: string,
  logger?: PerformanceTracker,
) => {
  return {
    async track<T>(
      operation: () => Promise<T> | T,
      subOperationName?: string,
    ): Promise<T> {
      const operationName = subOperationName
        ? `${baseOperationName}: ${subOperationName}`
        : baseOperationName;

      return withPerformanceTracking(operation, operationName, logger);
    },
  };
};

/**
 * Tracks performance of multiple parallel operations
 *
 * @param operations - Array of operations to track
 * @param baseOperationName - Base name for the operation group
 * @param logger - Optional logger instance
 * @returns Results of all operations
 */
export const trackParallelOperations = async <T>(
  operations: Array<{
    operation: () => Promise<T> | T;
    name: string;
  }>,
  baseOperationName: string,
  logger?: PerformanceTracker,
): Promise<T[]> => {
  const startTime = performance.now();

  try {
    const results = await Promise.all(
      operations.map(({ operation, name }) =>
        withPerformanceTracking(operation, name, logger),
      ),
    );

    const endTime = performance.now();
    const message = `${baseOperationName} (${
      operations.length
    } operations) took ${endTime - startTime} ms`;
    if (logger) {
      logger.debug(message);
    } else {
      console.debug(message);
    }

    return results;
  } catch (error) {
    const endTime = performance.now();
    const message = `${baseOperationName} failed after ${
      endTime - startTime
    } ms`;
    if (logger) {
      logger.debug(message);
    } else {
      console.debug(message);
    }
    throw error;
  }
};

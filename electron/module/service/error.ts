export class YearMonthPathNotFoundError extends Error {
  constructor(yearMonthDir: string) {
    super(`YearMonthPathNotFoundError: ${yearMonthDir} is not found`);
    Error.captureStackTrace(this, YearMonthPathNotFoundError);
  }
}

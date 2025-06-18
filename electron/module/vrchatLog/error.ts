import { match, P } from 'ts-pattern';

type Code =
  | 'LOG_FILE_NOT_FOUND'
  | 'LOG_FILE_DIR_NOT_FOUND'
  | 'LOG_FILES_NOT_FOUND'
  | 'LOG_STORE_DIR_CREATE_FAILED'
  | 'LOG_MONTH_DIR_CREATE_FAILED'
  | 'LOG_FILE_WRITE_FAILED';

export class VRChatLogFileError extends Error {
  code: Code | string;

  constructor(codeOrError: Code | (Error & { code: string })) {
    const result = match(codeOrError)
      .with(P.string, (code) => ({
        message: code,
        code: code,
        stack: undefined,
      }))
      .with(P.instanceOf(Error), (error) => ({
        message: error.message,
        code: error.code,
        stack: error.stack,
      }))
      .otherwise(() => ({
        message: 'UNKNOWN',
        code: 'UNKNOWN',
        stack: undefined,
      }));

    super(result.message);
    this.code = result.code;
    if (result.stack) {
      this.stack = result.stack;
    }
    this.name = this.constructor.name;
  }
}

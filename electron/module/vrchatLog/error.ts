import { P, match } from 'ts-pattern';

type Code =
  | 'LOG_FILE_NOT_FOUND'
  | 'LOG_FILE_DIR_NOT_FOUND'
  | 'LOG_FILES_NOT_FOUND'
  | 'LOG_STORE_DIR_CREATE_FAILED'
  | 'LOG_MONTH_DIR_CREATE_FAILED'
  | 'LOG_FILE_WRITE_FAILED';

/**
 * VRChatログファイル読み込みに関するエラークラス。
 *
 * @see docs/error-handling.md - エラーハンドリング方針
 * @see electron/module/vrchatLog/fileHandlers - ログ読み込み関連
 */
export class VRChatLogFileError extends Error {
  code: Code | string;

  constructor(
    codeOrError:
      | Code
      | (Error & { code: string })
      | { code: string; message?: string },
  ) {
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
      .with({ code: P.string }, (obj) => ({
        message: obj.message || obj.code,
        code: obj.code,
        stack: undefined,
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

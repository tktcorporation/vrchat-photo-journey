type Code =
  | 'LOG_FILE_NOT_FOUND'
  | 'LOG_FILE_DIR_NOT_FOUND'
  | 'LOG_FILES_NOT_FOUND'
  | 'UNKNOWN';

export class VRChatLogFileError extends Error {
  code: Code | string;

  constructor(codeOrError: Code | (Error & { code?: string })) {
    if (typeof codeOrError === 'string') {
      super(codeOrError);
      this.code = codeOrError;
    } else if (codeOrError instanceof Error) {
      super(codeOrError.message);
      this.stack = codeOrError.stack;
      this.code = codeOrError.code || 'UNKNOWN';
    } else {
      super('UNKNOWN');
      this.code = 'UNKNOWN';
    }
    this.name = this.constructor.name;
  }
}

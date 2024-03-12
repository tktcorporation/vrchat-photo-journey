type Code = 'PHOTO_DIR_READ_ERROR' | 'PHOTO_YEAR_MONTH_DIRS_NOT_FOUND';

class VRChatPhotoFileError extends Error {
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

export default VRChatPhotoFileError;

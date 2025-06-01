export class UserFacingError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'UserFacingError';
    // TypeScriptのカスタムエラーで instanceof が正しく動作するための設定
    Object.setPrototypeOf(this, UserFacingError.prototype);
  }
}

// 特定の操作に失敗したことを示すエラーなど、より具体的なエラーも定義可能
// export class OperationFailedError extends UserFacingError {
//   constructor(operationName: string, details?: string, options?: ErrorOptions) {
//     super(
//       details
//         ? `${operationName}に失敗しました: ${details}`
//         : `${operationName}に失敗しました。`,
//       options,
//     );
//     this.name = 'OperationFailedError';
//     Object.setPrototypeOf(this, OperationFailedError.prototype);
//   }
// }

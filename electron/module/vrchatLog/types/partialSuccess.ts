/**
 * 部分的な成功を表す結果型
 * エラーが発生しても処理を継続し、成功した部分のデータとエラーの両方を返す
 */
export interface PartialSuccessResult<T, E> {
  /**
   * 成功したデータ
   */
  data: T;

  /**
   * 処理中に発生したエラーの配列
   * 空の場合は全て成功
   */
  errors: E[];

  /**
   * 処理したアイテムの総数
   */
  totalProcessed: number;

  /**
   * 成功したアイテムの数
   */
  successCount: number;

  /**
   * 失敗したアイテムの数
   */
  errorCount: number;
}

/**
 * PartialSuccessResultを作成するヘルパー関数
 */
export function createPartialSuccessResult<T, E>(
  data: T,
  errors: E[],
  totalProcessed: number,
): PartialSuccessResult<T, E> {
  return {
    data,
    errors,
    totalProcessed,
    successCount: totalProcessed - errors.length,
    errorCount: errors.length,
  };
}

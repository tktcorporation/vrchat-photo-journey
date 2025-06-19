/**
 * バッチ処理の設定定数
 */
export const BATCH_CONFIG = {
  /**
   * セッション情報バッチ取得の最大件数
   * tRPCのバリデーションとフロントエンドのバッチマネージャーで共通使用
   */
  MAX_SESSION_BATCH_SIZE: 200,

  /**
   * バッチ処理のウィンドウ時間（ミリ秒）
   */
  BATCH_DELAY_MS: 150,

  /**
   * 重複リクエストとみなす時間閾値（ミリ秒）
   */
  DUPLICATE_THRESHOLD_MS: 1000,
} as const;

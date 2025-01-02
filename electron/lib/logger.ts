import { captureException } from '@sentry/electron/main';
import { app } from 'electron';
import * as log from 'electron-log';
import path from 'pathe';
import { stackWithCauses } from 'pony-cause';

// appが未定義の場合はテスト環境や非Electron環境として判定
const logFilePath = app
  ? path.join(app.getPath('logs'), 'app.log') // Electron環境
  : path.join(__dirname, 'test-app.log'); // テストまたは非Electron環境

log.transports.file.resolvePathFn = () => logFilePath;

// ファイルサイズの上限設定（例: 5MB）
log.transports.file.maxSize = 5 * 1024 * 1024;

// ログレベルの設定
const isProduction = app?.isPackaged ?? false;
log.transports.file.level = isProduction ? 'info' : 'debug';
log.transports.console.level = isProduction ? 'warn' : 'debug';

// ログフォーマットの設定
log.transports.file.format = '{y}-{m}-{d} {h}:{i}:{s} [{level}] {text}';
log.transports.console.format = '{y}-{m}-{d} {h}:{i}:{s} [{level}] {text}';

// ログ関数のエクスポート
const info = log.info;
const debug = log.debug;
const error = ({
  message,
  stack,
}: {
  message: unknown;
  stack?: Error;
}) => {
  // メッセージの正規化
  const normalizedError =
    message instanceof Error ? message : new Error(String(message));

  // ログ出力
  log.error(normalizedError, ...(stack ? [stackWithCauses(stack)] : []));

  // Sentryへの送信
  captureException(normalizedError, {
    extra: stack ? { stack } : undefined,
  });
};
const electronLogFilePath = log.transports.file.getFile().path;

export { info, debug, error, electronLogFilePath };

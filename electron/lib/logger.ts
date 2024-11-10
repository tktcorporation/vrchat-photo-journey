import { app } from 'electron';
import * as log from 'electron-log';
import path from 'pathe';

// 固定されたログファイルパスの設定
const logFilePath = path.join(app.getPath('logs'), 'app.log');
log.transports.file.resolvePathFn = () => logFilePath;

// ファイルのサイズ上限設定（例: 5MB）
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
const error = log.error;
const electronLogFilePath = log.transports.file.getFile().path;

export { info, debug, error, electronLogFilePath };

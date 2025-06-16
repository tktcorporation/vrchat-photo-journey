import { captureException } from '@sentry/electron/main';
import { app } from 'electron';
import * as log from 'electron-log';
import path from 'pathe';
import { stackWithCauses } from 'pony-cause';
import { P, match } from 'ts-pattern';
import { getSettingStore } from '../module/settingStore';

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

interface ErrorLogParams {
  message: unknown;
  stack?: Error;
}

/**
 * 受け取ったメッセージを Error オブジェクトに変換するユーティリティ。
 * buildErrorInfo や error 関数から利用される。
 */
const normalizeError = (message: unknown): Error => {
  return match(message)
    .with(P.instanceOf(Error), (e) => e)
    .otherwise((m) => new Error(String(m)));
};

/**
 * stack 情報を含めたエラーオブジェクトを生成するヘルパー。
 * Sentry 送信前の整形処理で使用される。
 */
const buildErrorInfo = ({ message, stack }: ErrorLogParams): Error => {
  const baseError = match(message)
    .with(P.instanceOf(Error), (e) => e)
    .otherwise((m) => normalizeError(m));

  return match(stack)
    .with(undefined, () => baseError)
    .otherwise((s) => {
      // Original errorのプロパティを保持しつつstackを更新
      const errorInfo = Object.create(Object.getPrototypeOf(baseError));
      Object.assign(errorInfo, baseError, {
        name: baseError.name,
        message: baseError.message,
        stack: s.stack,
        cause: baseError.cause || s,
      });

      return errorInfo;
    });
};

const info = log.info;
const debug = log.debug;
const warn = log.warn;
/**
 * Sentry への送信も行うエラー出力用ラッパー関数。
 */
const error = ({ message, stack }: ErrorLogParams): void => {
  const normalizedError = normalizeError(message);
  const errorInfo = buildErrorInfo({ message, stack });

  // ログ出力
  log.error(
    stackWithCauses(normalizedError),
    ...(stack ? [stackWithCauses(stack)] : []),
  );

  // 規約同意済みかどうかを確認
  const termsAccepted = match(undefined)
    .with(undefined, () => {
      try {
        const settingStore = getSettingStore();
        return settingStore.getTermsAccepted();
      } catch (error) {
        log.warn('Failed to get terms accepted:', error);
        return false;
      }
    })
    .exhaustive();

  // 規約同意済みの場合のみSentryへ送信
  match(termsAccepted)
    .with(true, () => {
      logger.debug('Attempting to send error to Sentry...');
      try {
        captureException(errorInfo, {
          extra: {
            ...(stack ? { stack: stackWithCauses(stack) } : {}),
          },
          tags: {
            source: 'electron-main',
          },
        });
        logger.debug('Error sent to Sentry successfully');
      } catch (sentryError) {
        logger.debug('Failed to send error to Sentry:', sentryError);
      }
    })
    .otherwise(() => {
      logger.debug('Terms not accepted, skipping Sentry error');
    });
};

const electronLogFilePath = log.transports.file.getFile().path;

const logger = {
  info,
  debug,
  error,
  warn,
  transports: {
    file: log.transports.file,
    console: log.transports.console,
  },
  setTransportsLevel: (level: log.LevelOption) => {
    log.transports.file.level = level;
    log.transports.console.level = level;
  },
  electronLogFilePath,
};

export { logger };

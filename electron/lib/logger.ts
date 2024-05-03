import { app } from 'electron';
import * as log from 'electron-log';

const isProduction = app?.isPackaged ?? false;
if (isProduction) {
  log.transports.file.level = 'info';
  log.transports.console.level = 'info';
}

const info = log.info;
const debug = log.debug;
const error = log.error;
const electronLogFilePath = log.transports.file.getFile().path;

export { info, debug, error, electronLogFilePath };

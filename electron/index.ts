// Native
import { join } from "path";

// Packages
import { BrowserWindow, app, ipcMain } from "electron";
import isDev from "electron-is-dev";
import * as log from "electron-log";
import { createIPCHandler } from "electron-trpc/main";
import { router } from "./api";

import * as controller from "./controller";

const CHANNELS = {
	CLEAR_ALL_STORED_SETTINGS: "clear-all-stored-settings",
	OPEN_DIALOG_AND_SET_LOG_FILES_DIR: "open-dialog-and-set-log-files-dir",
	GET_LOG_FILES_DIR: "get-log-files-dir",
	GET_JOIN_WORLD_LOG_LINES: "get-join-world-log-lines",
	OPEN_DIALOG_AND_SET_VRCHAT_PHOTO_DIR: "open-dialog-and-set-vrchat-photo-dir",
	GET_VRCHAT_PHOTO_DIR: "get-vrchat-photo-dir",
	CREATE_FILES: "create-files",
	MESSAGE: "message",
	TOAST: "toast",
	LOG_FILES_DIR: "log-files-dir",
	LOG_FILES_DIR_WITH_ERROR: "log-files-dir-with-error",
	JOIN_WORLD_LOG_LINES: "join-world-log-lines",
	GET_STATUS_TO_USE_VRCHAT_LOG_FILES_DIR:
		"get-status-to-use-vrchat-log-files-dir",
	GET_STATUS_TO_USE_VRCHAT_PHOTO_DIR: "get-status-to-use-vrchat-photo-dir",
};

function registerIpcMainListeners() {
	ipcMain.on(
		CHANNELS.OPEN_DIALOG_AND_SET_LOG_FILES_DIR,
		controller.handleOpenDialogAndSetLogFilesDir,
	);
	ipcMain.on(
		CHANNELS.OPEN_DIALOG_AND_SET_VRCHAT_PHOTO_DIR,
		controller.handleOpenDialogAndSetVRChatPhotoDir,
	);
	ipcMain.on(CHANNELS.MESSAGE, (_, message) => {
		log.info(message);
	});
}

const height = 600;
const width = 800;

function createWindow(): BrowserWindow {
	// Create the browser window.
	const mainWindow = new BrowserWindow({
		width,
		height,
		//  change to false to use AppBar
		frame: false,
		show: true,
		resizable: true,
		fullscreenable: true,
		backgroundColor: "#fff",
		webPreferences: {
			preload: join(__dirname, "preload.js"),
		},
	});

	createIPCHandler({ router, windows: [mainWindow] });
	const port = process.env.PORT || 3000;
	const url = isDev
		? `http://localhost:${port}`
		: join(__dirname, "../src/out/index.html");

	// and load the index.html of the app.
	if (isDev) {
		mainWindow.loadURL(url);
	} else {
		mainWindow.loadFile(url);
	}
	// Open the DevTools.
	// mainWindow.webContents.openDevTools();

	// For AppBar
	ipcMain.on("minimize", () => {
		// eslint-disable-next-line no-unused-expressions
		mainWindow.isMinimized() ? mainWindow.restore() : mainWindow.minimize();
		// or alternatively: win.isVisible() ? win.hide() : win.show()
	});
	ipcMain.on("maximize", () => {
		// eslint-disable-next-line no-unused-expressions
		mainWindow.isMaximized() ? mainWindow.restore() : mainWindow.maximize();
	});

	ipcMain.on("close", () => {
		mainWindow.close();
	});

	return mainWindow;
}

process.on("uncaughtException", (error) => {
	log.error(error);
});

app.whenReady().then(() => {
	registerIpcMainListeners();
	createWindow();

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

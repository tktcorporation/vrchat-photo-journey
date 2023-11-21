import Store from "electron-store";
import * as neverthrow from "neverthrow";

const settingsStore = new Store({ name: "v0-settings" });

const settingStoreKey = ["logFilesDir", "vrchatPhotoDir"] as const;
export type SettingStoreKey = typeof settingStoreKey[number];

const get = (key: SettingStoreKey): string | null => {
	const value = settingsStore.get(key);
	if (typeof value !== "string") {
		return null;
	}
	return value;
};

const set = (key: SettingStoreKey, value: string) => {
	settingsStore.set(key, value);
};

const getLogFilesDir = (): string | null => {
	return get("logFilesDir");
};
const setLogFilesDir = (dirPath: string) => {
	set("logFilesDir", dirPath);
};

const getVRChatPhotoDir = (): string | null => {
	return get("vrchatPhotoDir");
};
const setVRChatPhotoDir = (dirPath: string) => {
	set("vrchatPhotoDir", dirPath);
};

/**
 * Clear all settings
 */
const clearAllStoredSettings = () => {
	settingsStore.clear();
};

/**
 * Clear stored setting by key
 */
const clearStoredSetting = (
	key: SettingStoreKey,
): neverthrow.Result<void, Error> => {
	try {
		return neverthrow.ok(settingsStore.delete(key));
	} catch (error) {
		if (error instanceof Error) {
			return neverthrow.err(error);
		}
		throw error;
	}
};

export {
	clearAllStoredSettings,
	getLogFilesDir,
	setLogFilesDir,
	getVRChatPhotoDir,
	setVRChatPhotoDir,
	clearStoredSetting,
};

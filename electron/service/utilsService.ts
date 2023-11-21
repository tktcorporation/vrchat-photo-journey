import { dialog, shell } from "electron";
import * as neverthrow from "neverthrow";

const openPathInExplorer = async (
    path: string,
): Promise<neverthrow.Result<string, Error>> => {
    // ネイティブの機能を使う
    try {
        const result = await shell.openPath(path);
        return neverthrow.ok(result);
    } catch (error) {
        if (error instanceof Error) {
            return neverthrow.err(error);
        }
        throw error;
    }
};

const openGetDirDialog = async (): Promise<
    neverthrow.Result<string, Error | "canceled">
> => {
    return dialog
        .showOpenDialog({
            properties: ["openDirectory"],
        })
        .then((result) => {
            if (!result.canceled) {
                return neverthrow.ok(result.filePaths[0]);
            }
            return neverthrow.err("canceled" as const);
        })
        .catch((err) => {
            if (err instanceof Error) {
                return neverthrow.err(err);
            }
            throw err;
        });
};

export { openPathInExplorer, openGetDirDialog };

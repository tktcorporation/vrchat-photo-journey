import { VRChatLogFilesDirPath } from "../vrchatLogFileDir/model";
import * as neverthrow from 'neverthrow';
import { VRChatLogFileError } from "./error";
import { getVRChatWorldJoinLogFromLogPath } from "./service";
import path from "node:path";

describe('getVRChatWorldJoinInfoFromLogPath', () => {
    interface VRChatWorldJoinLog {
        joinDate: Date;
        worldId: string;
        worldInstanceId: string;
        worldName: string;
    }
    type GetVRChatWorldJoinInfoFromLogPath = (logFilesDir: VRChatLogFilesDirPath) => Promise<neverthrow.Result<VRChatWorldJoinLog[], VRChatLogFileError>>;
    it('should-return-VRChatWorldJoinLog[]', async () => {
        const getVRChatWorldJoinInfoFromLogPath: GetVRChatWorldJoinInfoFromLogPath = getVRChatWorldJoinLogFromLogPath
        const storedVRChatLogFilesDirPath = {
            value: path.join(process.cwd(), 'debug', 'logs')
        };
        const result = await getVRChatWorldJoinInfoFromLogPath(storedVRChatLogFilesDirPath as unknown as VRChatLogFilesDirPath);
        expect(result.isOk()).toBe(true);
        if (!result.isOk()) {
            throw new Error('Unexpected error');
        }
        console.log(result.value);
        expect(result.value.length).toBe(0);
    });
});
import path from 'node:path';
import type { VRChatLogFilesDirPath } from './model';
import { getValidVRChatLogFileDir } from './service';

describe('vrchatLogFileDir service', () => {
  it('getValidVRChatLogFileDir', () => {
    // project_dir/debug/logs
    const storedVRChatLogFilesDirPath = {
      value: path.join(process.cwd(), 'debug', 'logs'),
    };
    const result = getValidVRChatLogFileDir({
      storedVRChatLogFilesDirPath:
        storedVRChatLogFilesDirPath as unknown as VRChatLogFilesDirPath,
    });
    if (result.isErr()) {
      throw new Error('Unexpected error');
    }
    expect(typeof result.value.value === 'string').toBe(true);
  });
});

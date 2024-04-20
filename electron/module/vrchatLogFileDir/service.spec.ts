import path from 'node:path';
import { type getSettingStore, initSettingStoreForTest } from '../settingStore';
import { getValidVRChatLogFileDir } from './service';

describe('vrchatLogFileDir service', () => {
  it('getValidVRChatLogFileDir', async () => {
    // project_dir/debug/logs
    const storedVRChatLogFilesDirPath = {
      value: path.join(process.cwd(), 'debug', 'logs'),
    };
    initSettingStoreForTest({
      getLogFilesDir: () => storedVRChatLogFilesDirPath.value,
    } as unknown as ReturnType<typeof getSettingStore>);

    const result = await getValidVRChatLogFileDir();
    if (result.isErr()) {
      throw new Error('Unexpected error');
    }
    expect(typeof result.value.path.value === 'string').toBe(true);
  });
});

import { getService } from './service';
import { getSettingStore } from './settingStore';

describe('settingStore', () => {
  describe('removeAdjacentDuplicateWorldEntriesFlag', () => {
    it('should return default value', async () => {
      const service = getService(getSettingStore('test-settings'));
      await service.clearAllStoredSettings();
      const result = (
        await service.getRemoveAdjacentDuplicateWorldEntriesFlag()
      ).unwrapOr('broken');
      expect(result).toBe(false);
    });
    it('should return set value', async () => {
      const service = getService(getSettingStore('test-settings'));
      await service.clearAllStoredSettings();
      await service.setRemoveAdjacentDuplicateWorldEntriesFlag(true);
      const result = await (
        await service.getRemoveAdjacentDuplicateWorldEntriesFlag()
      ).unwrapOr('broken');
      expect(result).toBe(true);
    });
  });
});

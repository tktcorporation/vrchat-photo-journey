import * as vrchatApiService from './service';
import { VRChatWorldId, VRChatWorldIdSchema } from './valueObject';

describe('vrchatApi/service', () => {
  it('should be defined', () => {
    expect(vrchatApiService).toBeDefined();
  });
  describe('getVrcWorldInfoByWorldId', () => {
    it('should be defined', () => {
      expect(vrchatApiService.getVrcWorldInfoByWorldId).toBeDefined();
    });
    it('return world name', async () => {
      // Arrange
      const worldId = 'wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f';
      // Act
      const result = await vrchatApiService.getVrcWorldInfoByWorldId(
        VRChatWorldIdSchema.parse(worldId),
      );
      // Assert
      expect(result).toBeDefined();
      if (result.isErr()) {
        throw result.error;
      }
      expect(result.value.id).toBe(worldId);
    });
  });
});

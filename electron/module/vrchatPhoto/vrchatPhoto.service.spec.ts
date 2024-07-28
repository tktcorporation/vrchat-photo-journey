import { getVRChatPhotoItemData } from './vrchatPhoto.service';

describe('vrchatPhoto.service', () => {
  it('getVRChatPhotoItemData', async () => {
    const input = '/path/to/hogehoge.jpg';
    const result = await getVRChatPhotoItemData(input);
    if (result.isOk()) {
      throw result;
    }
    expect(result.error).toBe('InputFileIsMissing');
  });
});

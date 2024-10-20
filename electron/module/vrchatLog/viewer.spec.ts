import { getData } from '../../lib/getData';
import type { VRChatWorldInfoFromApi } from '../vrchatApi/service';

describe('viewer_api', () => {
  it('ワールド情報を取得する', async () => {
    const worldId = 'wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f';
    // api で world 情報を取得する
    const reqUrl = `https://api.vrchat.cloud/api/1/worlds/${worldId}`;
    const res = await getData<VRChatWorldInfoFromApi>(reqUrl);
    expect(res).toBeDefined();
    expect(res.isOk()).toBe(true);

    const worldInfo = await res._unsafeUnwrap();
    expect(worldInfo).toBeDefined();
    expect(worldInfo.id).toBe(worldId);
    expect(typeof worldInfo.name).toBe('string');
  }, 1000);
});

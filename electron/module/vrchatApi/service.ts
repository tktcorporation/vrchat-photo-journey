import * as neverthrow from 'neverthrow';
import { z } from 'zod';
import type { VRChatWorldId } from './valueObject';

/**
 * id: 'wrld_6fecf18a-ab96-43f2-82dc-ccf79f17c34f',
 * name: 'はじまりタウン ⁄ Dawnville',
 * description: 'Public設定のホームワールドにして、みんなが集まる最初の街みたいになればいいなプロジェクト ［24․03․20 Update］Quest⁄PC姿確認カメラをアップデートǃ',
 * authorId: 'usr_b1b9f790-c3f1-4b9d-9823-5146c92e1110',
 * authorName: 'ばーゆ ⁄ VarYU',
 * releaseStatus: 'public',
 * featured: false,
 * capacity: 20,
 * recommendedCapacity: 20,
 * imageUrl: 'https://api.vrchat.cloud/api/1/file/file_bc000ef2-482d-4598-90d9-1f487be52322/4/file',
 * thumbnailImageUrl: 'https://api.vrchat.cloud/api/1/image/file_bc000ef2-482d-4598-90d9-1f487be52322/4/256',
 * version: 187,
 * organization: 'vrchat',
 * previewYoutubeId: null,
 * udonProducts: [],
 * favorites: 1474,
 * visits: 52328,
 * popularity: 6,
 * heat: 4,
 * publicationDate: '2023-07-30T15:18:46.763Z',
 * labsPublicationDate: '2023-07-30T06:45:55.412Z',
 * instances: [],
 * publicOccupants: 0,
 * privateOccupants: 0,
 * occupants: 0,
 * unityPackages: [],
 * tags: [ 'author_tag_quest', 'author_tag_night', 'system_approved' ],
 * created_at: '2023-06-21T13:30:58.720Z',
 * updated_at: '2024-03-20T05:59:42.558Z'
 */
interface VRChatWorldInfoFromApi {
  id: string;
  name: string;
  description: string;
  authorId: string;
  authorName: string;
  releaseStatus: string;
  featured: boolean;
  capacity: number;
  recommendedCapacity: number;
  imageUrl: string;
  thumbnailImageUrl: string;
  version: number;
  organization: string;
  previewYoutubeId: string | null;
  udonProducts: string[];
  favorites: number;
  visits: number;
  popularity: number;
  heat: number;
  publicationDate: string;
  labsPublicationDate: string;
  instances: string[];
  publicOccupants: number;
  privateOccupants: number;
  occupants: number;
  unityPackages: string[];
  tags: string[];
  created_at: string;
  updated_at: string;
}
const VRChatWorldInfoFromApiSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  releaseStatus: z.string(),
  featured: z.boolean(),
  capacity: z.number(),
  recommendedCapacity: z.number(),
  imageUrl: z.string(),
  thumbnailImageUrl: z.string(),
  version: z.number(),
  organization: z.string(),
  previewYoutubeId: z.string().nullable(),
  udonProducts: z.array(z.string()),
  favorites: z.number(),
  visits: z.number(),
  popularity: z.number(),
  heat: z.number(),
  publicationDate: z.string(),
  labsPublicationDate: z.string(),
  instances: z.array(z.string()),
  publicOccupants: z.number(),
  privateOccupants: z.number(),
  occupants: z.number(),
  unityPackages: z.array(z.string()),
  tags: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});
export const getVrcWorldInfoByWorldId = async (
  worldId: VRChatWorldId,
): Promise<neverthrow.Result<VRChatWorldInfoFromApi, Error>> => {
  const reqUrl = `https://api.vrchat.cloud/api/1/worlds/${worldId.value}`;
  const response = await fetch(reqUrl);
  if (!response.ok) {
    return neverthrow.err(
      new Error(`getVrcWorldInfoByWorldId: ${response.statusText}`),
    );
  }
  const json = await response.json();
  console.log(json);
  const result = VRChatWorldInfoFromApiSchema.safeParse(json);
  if (!result.success) {
    return neverthrow.err(
      new Error(`fail to parse VRChatWorldInfoFromApi: ${result.error.errors}`),
    );
  }
  return neverthrow.ok(result.data);
};

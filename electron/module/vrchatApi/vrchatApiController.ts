import { match } from 'ts-pattern';
import { z } from 'zod';
import { procedure, router as trpcRouter } from './../../trpc';
import * as vrchatApiService from './service';
import type { VRChatWorldInfoFromApi } from './service';
import { type VRChatWorldId, VRChatWorldIdSchema } from './valueObject';

const getVrcWorldInfoByWorldId = async (
  worldId: VRChatWorldId,
): Promise<VRChatWorldInfoFromApi | null> => {
  const result = await vrchatApiService.getVrcWorldInfoByWorldId(worldId);
  if (result.isErr()) {
    return match(result.error)
      .with('WORLD_NOT_FOUND', () => {
        return null;
      })
      .otherwise((error) => {
        throw error;
      });
  }
  return result.value;
};

const getVrcUserInfoListByUserNameList = async (
  userNameList: string[],
): Promise<
  {
    searchName: string;
    user: z.infer<typeof vrchatApiService.UserSchema> | null;
  }[]
> => {
  const result = await Promise.all(
    userNameList.map(async (name) => {
      const userResult = await vrchatApiService.getVrcUserInfoByUserName(name);
      if (userResult.isErr()) {
        return {
          searchName: name,
          user: null,
        };
      }
      return {
        searchName: name,
        user: userResult.value,
      };
    }),
  );
  return result;
};

export const vrchatApiRouter = trpcRouter({
  getVrcWorldInfoByWorldId: procedure
    .input(VRChatWorldIdSchema)
    .query((ctx) => {
      return getVrcWorldInfoByWorldId(ctx.input);
    }),
  getVrcUserInfoListByUserNameList: procedure
    .input(z.string().array())
    .query((ctx) => {
      return getVrcUserInfoListByUserNameList(ctx.input);
    }),
});

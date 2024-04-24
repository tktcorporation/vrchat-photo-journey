import { procedure, router as trpcRouter } from './../../trpc';
import * as vrchatApiService from './service';
import { type VRChatWorldId, VRChatWorldIdSchema } from './valueObject';

const getVrcWorldInfoByWorldId = async (worldId: VRChatWorldId) => {
  const result = await vrchatApiService.getVrcWorldInfoByWorldId(worldId);
  if (result.isErr()) {
    throw result.error;
  }
  return result.value;
};

export const vrchatApiRouter = trpcRouter({
  getVrcWorldInfoByWorldId: procedure
    .input(VRChatWorldIdSchema)
    .query((ctx) => {
      return getVrcWorldInfoByWorldId(ctx.input);
    }),
});

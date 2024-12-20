import { trpcReact } from '@/trpc';
import { Button } from '@/v1/components/ui/button';
import { ImageUpload } from '@/v1/components/ui/image-upload';
import { ROUTER_PATHS } from '@/v1/constants';
import * as datefns from 'date-fns';
import type React from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { PhotoByPath } from '@/v1/components/ui/PhotoByPath';
import { Badge } from '@/v1/components/ui/badge';
import { Input } from '@/v1/components/ui/input';
import { Label } from '@/v1/components/ui/label';
import { ScrollArea } from '@/v1/components/ui/scroll-area';
import { Skeleton } from '@/v1/components/ui/skeleton';
import { Globe, Image, Search } from 'lucide-react';
import * as path from 'pathe';
import { useState } from 'react';
import { P, match } from 'ts-pattern';

const PlayerJoinData = ({
  joinDateTime,
}: { joinDateTime: Date }): React.ReactElement => {
  const playerJoinQueryResult =
    trpcReact.logInfo.getPlayerListInSameWorld.useQuery(joinDateTime);

  return match(playerJoinQueryResult)
    .with({ status: 'loading' }, () => <div>Loading...</div>)
    .with({ status: 'error' }, (result) => (
      <div>
        <div>Error: {result.error.message}</div>
      </div>
    ))
    .with({ status: 'success', error: null }, (successResult) =>
      match(successResult.data)
        .with({ errorMessage: P.string }, (error) => (
          <div>Error: {error.errorMessage}</div>
        ))
        .with(P.array(), (playerData) => (
          <div className="flex flex-wrap gap-2">
            {playerData.map((player) => (
              <Badge
                key={`${player.playerName}-${player.joinDateTime}`}
                variant="accent"
              >
                {player.playerName}
              </Badge>
            ))}
          </div>
        ))
        .exhaustive(),
    )
    .exhaustive();
};

export const VRChatWorldJoinDataView = ({
  vrcWorldId,
  joinDateTime,
  nextJoinDateTime,
}: {
  vrcWorldId: string;
  joinDateTime: Date;
  nextJoinDateTime: Date | null;
}): React.ReactElement => {
  const { data } =
    trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery(vrcWorldId);

  const { data: vrchatPhotoPathListData } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathModelList.useQuery({
      gtPhotoTakenAt: joinDateTime,
      ...(nextJoinDateTime && { ltPhotoTakenAt: nextJoinDateTime }),
      orderByPhotoTakenAt: 'desc',
    });

  return (
    <div className="flex flex-1 flex-row space-x-3 items-start h-full relative">
      {data ? (
        <>
          <div className="flex-1 h-full relative">
            <div className="h-full absolute">
              <ScrollArea className="h-full absolute overflow-y-auto">
                <div className="relative rounded-md bg-card p-4 flex flex-col overflow-hidden">
                  <div className="max-h-full">
                    <div className="text-sm text-muted-foreground">
                      <span>Join Date</span>
                      <span>{joinDateTime.toISOString()} ~ </span>
                      <span>
                        {nextJoinDateTime
                          ? nextJoinDateTime.toISOString()
                          : 'Now'}
                      </span>
                    </div>
                    <div className="text-xl">
                      {datefns.format(
                        joinDateTime,
                        'yyyy年MM月dd日 HH時mm分',
                      )}{' '}
                    </div>
                  </div>
                  <div className="flex items-center mt-4">
                    <div className="">
                      <img
                        src={data.imageUrl}
                        alt={data.name}
                        className="h-full w-48 rounded-md"
                      />
                    </div>
                    <div className="ml-8">
                      <h1 className="text-lg">{data.name}</h1>
                      <div className="mt-4 flex items-center">
                        <div className="text-md text-gray-400">Created by</div>
                        <div className="text-md ml-2">{data.authorName}</div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="text-lg mt-3">
                      <PlayerJoinData joinDateTime={joinDateTime} />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 h-full mt-3">
                  <div className="rounded-md bg-card p-4">
                    <div className="text-md text-card-foreground">Photos</div>
                    <div className="mt-3 flex-wrap flex gap-3 text-wrap">
                      {vrchatPhotoPathListData?.map((photoPath) => (
                        <PhotoByPath
                          alt={photoPath.photoPath}
                          key={photoPath.id}
                          className="w-60"
                          photoPath={photoPath.photoPath}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </div>
          </div>
        </>
      ) : (
        <div>Not Found</div>
      )}
    </div>
  );
};

import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
import * as datefns from 'date-fns';
import type React from 'react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Image } from 'lucide-react';
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
          <div>
            {playerData.map((player) => (
              <div key={`${player.playerId}-${player.playerName}`}>
                {player.playerName}
              </div>
            ))}
          </div>
        ))
        .exhaustive(),
    )
    .exhaustive();
};

const VRChatWorldJoinDataView = ({
  vrcWorldId,
  joinDateTime,
}: { vrcWorldId: string; joinDateTime: Date }) => {
  const { data } =
    trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery(vrcWorldId);
  return (
    <div className="w-full ">
      {data ? (
        <>
          <div className="flex space-x-4">
            <div className="w-1/3">
              <img
                src={data.imageUrl}
                alt={data.name}
                className="object-cover w-full rounded"
              />
              <h1 className="mt-2 text-2xl font-bold">{data.name}</h1>
              <div className="mt-4 flex">
                <div className="text-lg text-muted-foreground">Created by</div>
                <div className="text-lg ml-2">{data.authorName}</div>
              </div>
              <p className="text-muted-foreground mt-2">{data.description}</p>
            </div>
            <div className="w-2/3">
              <div>
                <div className="text-lg text-muted-foreground">Join Date</div>
                <div className="text-2xl">
                  {datefns.format(joinDateTime, 'yyyy-MM-dd HH:mm:ss')}{' '}
                </div>
              </div>
              <div className="mt-4">
                <div className="text-lg text-muted-foreground">With</div>
                <div className="text-2xl">
                  <PlayerJoinData joinDateTime={joinDateTime} />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-lg text-muted-foreground">Photos</div>
                <div className="flex-wrap flex gap-3 text-wrap">
                  <Skeleton className="w-60 h-32" />
                  <Skeleton className="w-60 h-32" />
                  <Skeleton className="w-60 h-32" />
                  <Skeleton className="w-60 h-32" />
                  <Skeleton className="w-60 h-32" />
                  <Skeleton className="w-60 h-32" />
                  <Skeleton className="w-60 h-32" />
                  <Skeleton className="w-60 h-32" />
                  <Skeleton className="w-60 h-32" />
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div>Not Found</div>
      )}
    </div>
  );
};

function PhotoSelector() {
  const [inputValue, setInputValue] = useState<null | string>(null);

  const { data: recentJoinWorldData } =
    trpcReact.logInfo.getRecentVRChatWorldJoinLogByVRChatPhotoName.useQuery(
      inputValue || '',
      {
        enabled: inputValue !== null,
      },
    );

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileName = e.target.value.split('\\').pop();
    setInputValue(fileName || null);
  };

  return (
    <div className="flex flex-col space-y-4 flex-1">
      <Input
        id="picture"
        type="file"
        content="Upload VRC Photo File"
        onChange={onChangeInput}
      />
      {/* <ImageUpload
            id="picture"
            type="file"
            content="Upload VRC Photo File"
            className="p-3"
            onChange={onChangeInput}
          /> */}
      <div className="flex flex-1 space-x-4 box-border m-3">
        {/* <div className="space-x-2 flex">
        <Button variant="secondary" className="rounded">
          <Globe strokeWidth={1} size={20} />
        </Button>
        <Button variant="secondary" className="rounded">
          <Image strokeWidth={1} size={20} />
        </Button>
      </div> */}
        <div className="flex flex-1 space-y-5">
          <div
            className="flex-1 rounded bg-card p-5"
            style={{ filter: 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.1))' }}
          >
            {recentJoinWorldData && (
              <VRChatWorldJoinDataView
                vrcWorldId={recentJoinWorldData.worldId}
                joinDateTime={recentJoinWorldData.joinDateTime}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoSelector;

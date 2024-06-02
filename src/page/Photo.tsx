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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Globe, Image, Search } from 'lucide-react';
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
                key={`${player.playerId}-${player.playerName}`}
                variant="secondary"
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

const VRChatWorldJoinDataView = ({
  vrcWorldId,
  joinDateTime,
}: { vrcWorldId: string; joinDateTime: Date }) => {
  const { data } =
    trpcReact.vrchatApi.getVrcWorldInfoByWorldId.useQuery(vrcWorldId);
  return (
    <div className="flex flex-1 flex-row space-x-3 items-start h-full relative">
      {data ? (
        <>
          {' '}
          <div className="basis-1/3 rounded bg-card p-4 flex flex-col h-full">
            <>
              <img
                src={data.imageUrl}
                alt={data.name}
                className="object-cover w-full rounded"
              />
              <h1 className="mt-2 text-lg font-bold">{data.name}</h1>
              <div className="mt-4 flex">
                <div className="text-md text-muted-foreground">Created by</div>
                <div className="text-md ml-2">{data.authorName}</div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {data.description}
              </p>
            </>
          </div>
          <div className="basis-2/3 h-full relative">
            <div className="h-full absolute">
              <ScrollArea className="bg-card h-full absolute overflow-y-auto">
                <div className="space-y-3 h-full">
                  <div className="">
                    <div className="rounded bg-card p-4 min-h-0">
                      <div className="max-h-full">
                        <div className="text-md text-muted-foreground">
                          Join Date
                        </div>
                        <div className="text-lg">
                          {datefns.format(
                            joinDateTime,
                            'yyyy-MM-dd HH:mm:ss',
                          )}{' '}
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-md text-muted-foreground">
                          With
                        </div>{' '}
                        <div className="text-lg">
                          <PlayerJoinData joinDateTime={joinDateTime} />
                        </div>
                      </div>
                    </div>
                    <div className="rounded bg-card p-4">
                      <div className="mt-4">
                        <div className="text-md text-muted-foreground">
                          Photos
                        </div>
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
                      <div className="mt-4">
                        <div className="text-lg text-muted-foreground">
                          このワールドへの他のJoinLog
                        </div>
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
    <div className="flex flex-col flex-1">
      <div className="mx-3 ">
        <Label
          htmlFor="imege-search"
          className="relative flex items-center w-full"
        >
          <Search
            strokeWidth={1}
            size={20}
            className="absolute left-3 h-5 w-5 text-muted-foreground"
          />
          <div className="flex h-10 w-full rounded-md bg-muted px-3 py-2 pl-10 text-sm ring-offset-background text-muted-foreground">
            写真で検索
          </div>
        </Label>
        <Input
          id="imege-search"
          type="file"
          onChange={onChangeInput}
          className="hidden"
        />
      </div>
      <div
        className="m-3 flex-1"
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
  );
}

export default PhotoSelector;

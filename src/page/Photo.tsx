import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/ui/image-upload';
import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
import * as datefns from 'date-fns';
import type React from 'react';
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';

import { PhotoByPath } from '@/components/ui/PhotoByPath';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
          <div className="flex-1 h-full relative">
            <div className="h-full absolute">
              <ScrollArea className="h-full absolute overflow-y-auto">
                <div className="relative rounded-md bg-card p-4 flex flex-col overflow-hidden">
                  <div className="max-h-full">
                    <div className="text-sm text-muted-foreground">
                      Join Date
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
  const [searchParams, setSearchParams] = useSearchParams();

  const inputPhotoFileNameValue = searchParams.get('photoFileName');

  const { data: recentJoinWorldData, refetch } =
    trpcReact.logInfo.getRecentVRChatWorldJoinLogByVRChatPhotoName.useQuery(
      inputPhotoFileNameValue || '',
      {
        enabled: inputPhotoFileNameValue !== null,
      },
    );

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // set input value to query string
    const fileName = path.basename(e.target.value) ?? '';

    onSelectPhotoFileName(fileName);
  };

  const onSelectPhotoFileName = (fileNameOrPath: string) => {
    // const fileName = fileNameOrPath.split('/').pop() ?? fileNameOrPath;
    console.log(fileNameOrPath);
    const fileName = path.basename(fileNameOrPath);
    const params = new URLSearchParams({ photoFileName: fileName });
    setSearchParams(params);
    refetch();
  };

  const { data: photoData } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathList.useQuery();

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
          <div className="flex h-10 w-full rounded-md bg-card px-3 py-2 pl-10 text-sm ring-offset-background text-muted-foreground">
            写真で検索{' '}
            {inputPhotoFileNameValue
              ? `PhotoPath:${inputPhotoFileNameValue}`
              : ''}
          </div>
        </Label>
        <Input
          id="imege-search"
          type="file"
          onChange={onChangeInput}
          className="hidden"
        />
      </div>
      {inputPhotoFileNameValue ? (
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
      ) : (
        <div className="m-3 flex flex-1 flex-row space-x-3 items-start h-full relative">
          <div className="flex-1 h-full relative">
            <div className="h-full absolute">
              <ScrollArea className="h-full absolute overflow-y-auto">
                <div className="relative overflow-hidden flex flex-wrap gap-4 my-6">
                  {photoData?.map((pathStr) => (
                    <PhotoByPath
                      onClick={() => onSelectPhotoFileName(pathStr)}
                      // clickable css
                      className="w-48 cursor-pointer"
                      key={pathStr}
                      photoPath={pathStr}
                    />
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoSelector;

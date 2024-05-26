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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
            <p>Play with</p>
            {playerData.map((player) => (
              <Badge>
                {player.playerName}
                {/* {datefns.format(player.joinDateTime, 'yyyy-MM-dd HH:mm:ss')} */}
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
    <div className="w-full ">
      {data ? (
        <>
          <div>
            <p>{data.name}</p>
            Join Date: {datefns.format(
              joinDateTime,
              'yyyy-MM-dd HH:mm:ss',
            )}{' '}
          </div>
          <div className="p-4 space-y-4">
            <div className="flex gap-4 h-1/3 overflow-auto">
              <div>
                <div className="w-64">
                  <img src={data.imageUrl} alt={data.name} />
                  <p className="text-sm text-muted-foreground">
                    {data.description}
                  </p>
                </div>
              </div>
              <div className=" overflow-auto space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">
                    World Author:{' '}
                  </span>
                  <span>{data.authorName}</span>
                </div>
                {/* 一緒にいたplayer */}
                <PlayerJoinData joinDateTime={joinDateTime} />
                <div>
                  <p>Photos</p>
                  撮った写真...
                </div>
              </div>
            </div>
          </div>
          {/* <DrawerFooter>
            <DrawerClose>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter> */}
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
    <div className="flex flex-1 space-x-4 box-border m-3">
      <div className="space-x-2 flex">
        <Button variant="secondary" className="rounded">
          <Globe strokeWidth={1} size={20} />
        </Button>
        <Button variant="secondary" className="rounded">
          <Image strokeWidth={1} size={20} />
        </Button>
      </div>
      <div className="flex flex-1 space-y-5">
        <div
          className="flex-1 rounded bg-card p-5"
          style={{ filter: 'drop-shadow(0 0 5px rgba(0, 0, 0, 0.1))' }}
        >
          <ImageUpload
            id="picture"
            type="file"
            content="Upload VRC Photo File"
            className="p-3"
            onChange={onChangeInput}
          />
          {recentJoinWorldData && (
            <VRChatWorldJoinDataView
              vrcWorldId={recentJoinWorldData.worldId}
              joinDateTime={recentJoinWorldData.joinDateTime}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default PhotoSelector;

import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
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
                {player.playerName} :{' '}
                {datefns.format(player.joinDateTime, 'yyyy-MM-dd HH:mm:ss')}
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
    <div className="w-full h-full">
      {data ? (
        <>
          <DrawerHeader>
            <DrawerTitle>{data.name}</DrawerTitle>
            <DrawerDescription>
              Join Date: {datefns.format(
                joinDateTime,
                'yyyy-MM-dd HH:mm:ss',
              )}{' '}
            </DrawerDescription>
          </DrawerHeader>

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
              <div className="h-full overflow-auto space-y-4">
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

  const [isOpened, setIsOpened] = useState(false);

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileName = e.target.value.split('\\').pop();
    setInputValue(fileName || null);
    setIsOpened(true);
  };

  return (
    <div className="flex flex-auto h-full p-5 space-x-4">
      <div className="space-x-2 flex">
        <Button
          variant="secondary"
          onClick={() => setIsOpened(true)}
          className="rounded-lg"
        >
          <Globe strokeWidth={1} size={20} />
        </Button>
        <Button
          variant="secondary"
          onClick={() => setIsOpened(true)}
          className="rounded-lg"
        >
          <Image strokeWidth={1} size={20} />
        </Button>
      </div>
      <div className="flex-auto bg-card rounded-lg">
        <Drawer
          open={isOpened}
          onClose={() => setIsOpened(false)}
          onOpenChange={(open) => setIsOpened(open)}
          onRelease={(_, open) => setIsOpened(open)}
        >
          <div className="flex flex-col justify-center items-center h-full space-y-9">
            <div className="grid w-full max-w-sm items-center gap-3">
              <Label htmlFor="picture">撮影した写真を選択してね</Label>
              <Input
                id="picture"
                type="file"
                content="Upload VRC Photo File"
                onChange={onChangeInput}
              />
            </div>
          </div>
          <DrawerContent>
            {recentJoinWorldData && (
              <VRChatWorldJoinDataView
                vrcWorldId={recentJoinWorldData.worldId}
                joinDateTime={recentJoinWorldData.joinDateTime}
              />
            )}
          </DrawerContent>
        </Drawer>
      </div>
    </div>
  );
}

export default PhotoSelector;

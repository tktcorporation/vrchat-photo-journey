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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player Name</TableHead>
                  <TableHead>Join Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {playerData.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell>{player.playerName}</TableCell>
                    <TableCell>
                      {datefns.format(
                        player.joinDateTime,
                        'yyyy-MM-dd HH:mm:ss',
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            <DrawerDescription>{data.description}</DrawerDescription>
          </DrawerHeader>

          <div className="flex gap-4 p-4 h-1/3 overflow-auto">
            <div>
              <div className="w-64">
                <img src={data.imageUrl} alt={data.name} />
              </div>
              <div className="text-lg">{data.name}</div>
              <div>World ID: {data.id}</div>
              <div>World Capacity: {data.capacity}</div>
              <div>World Occupants: {data.occupants}</div>
              <div>World Author Name: {data.authorName}</div>
              <div>World Author ID: {data.authorId}</div>
              <div>World Tags: {data.tags.join(', ')}</div>
              <div>World Release Status: {data.releaseStatus}</div>
            </div>
            <div className="h-full overflow-auto">
              {/* 一緒にいたplayer */}
              <PlayerJoinData joinDateTime={joinDateTime} />
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
  const { data } = trpcReact.logInfo.getVRCWorldJoinLogList.useQuery();

  const DataTable = () => {
    return (
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Join Date</TableHead>
            <TableHead>World Name</TableHead>
            <TableHead>World ID</TableHead>
            <TableHead>World Instance ID</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data?.map((log) => (
            <TableRow key={log.id}>
              <TableCell>
                {datefns.format(log.joinDateTime, 'yyyy-MM-dd HH:mm:ss')}
              </TableCell>
              <TableCell>{log.worldName}</TableCell>
              <TableCell>{log.worldId}</TableCell>
              <TableCell>{log.worldInstanceId}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

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
    <div className="flex-auto h-full">
      <Drawer
        open={isOpened}
        onClose={() => setIsOpened(false)}
        onOpenChange={(open) => setIsOpened(open)}
        onRelease={(_, open) => setIsOpened(open)}
      >
        <div className="flex flex-col justify-center items-center h-full space-y-9">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="picture">Picture</Label>
            <Input
              id="picture"
              type="file"
              content="Upload VRC Photo File"
              onChange={onChangeInput}
            />

            <DrawerTrigger>Open</DrawerTrigger>
          </div>
          <DataTable />
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
  );
}

export default PhotoSelector;

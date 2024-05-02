import { Button } from '@/components/ui/button';
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
              <TableCaption>Player List</TableCaption>
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
    <div>
      {data ? (
        <div>
          <div>World Name: {data.name}</div>
          {/* 画像 */}
          <img src={data.imageUrl} alt={data.name} />
          <div>World ID: {data.id}</div>
          <div>World Description: {data.description}</div>
          <div>World Capacity: {data.capacity}</div>
          <div>World Occupants: {data.occupants}</div>
          <div>World Author Name: {data.authorName}</div>
          <div>World Author ID: {data.authorId}</div>
          <div>World Tags: {data.tags.join(', ')}</div>
          <div>World Release Status: {data.releaseStatus}</div>

          {/* 一緒にいたplayer */}
          <PlayerJoinData joinDateTime={joinDateTime} />
        </div>
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

  const onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileName = e.target.value.split('\\').pop();
    setInputValue(fileName || null);
  };

  return (
    <div className="flex-auto h-full">
      <div className="flex flex-col justify-center items-center h-full space-y-9">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="picture">Picture</Label>
          <Input
            id="picture"
            type="file"
            content="Upload VRC Photo File"
            onChange={onChangeInput}
          />
          <span>value: {inputValue}</span>
          <span>
            recentJoinWorldData: {JSON.stringify(recentJoinWorldData)}
          </span>
        </div>
        {recentJoinWorldData && (
          <VRChatWorldJoinDataView
            vrcWorldId={recentJoinWorldData.worldId}
            joinDateTime={recentJoinWorldData.joinDateTime}
          />
        )}
        <DataTable />
      </div>
    </div>
  );
}

export default PhotoSelector;

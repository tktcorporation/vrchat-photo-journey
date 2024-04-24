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

const VRChatWorldJoinDataView = ({ vrcWorldId }: { vrcWorldId: string }) => {
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
          <VRChatWorldJoinDataView vrcWorldId={recentJoinWorldData.worldId} />
        )}
        <DataTable />
      </div>
    </div>
  );
}

export default PhotoSelector;

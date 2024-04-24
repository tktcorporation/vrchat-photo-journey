import { Button } from '@/components/ui/button';
import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
import * as datefns from 'date-fns';
import { Link } from 'react-router-dom';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

  return (
    <div className="flex-auto h-full">
      <div className="flex flex-col justify-center items-center h-full space-y-9">
        <DataTable />
      </div>
    </div>
  );
}

export default PhotoSelector;

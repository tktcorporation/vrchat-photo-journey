import { Button } from '@/components/ui/button';
import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
import { AlertTriangle, Bed, Check, ChevronRight, Info } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

function PhotoSelector() {
  const storeLogsMutation =
    trpcReact.vrchatLog.appendLoglinesToFileFromLogFilePathList.useMutation();
  return (
    <div className="flex-auto h-full">
      <div className="flex flex-col justify-center items-center h-full space-y-9">
        <h3 className="text-lg font-medium">Home</h3>
        <Button
          onClick={() => {
            storeLogsMutation.mutate();
          }}
          disabled={storeLogsMutation.isLoading}
        >
          logの生成とそのデータからsqliteに流してIndexの作成
        </Button>
      </div>
    </div>
  );
}

export default PhotoSelector;

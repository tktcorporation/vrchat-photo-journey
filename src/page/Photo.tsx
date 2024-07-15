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
import { RenderInView } from './__Photo/RenderInView';
import { VRChatWorldJoinDataView } from './__Photo/VRChatJoinDataView';

function PhotoSelector() {
  const [searchParams, setSearchParams] = useSearchParams();

  const inputPhotoFileNameValue = searchParams.get('photoFileName');
  // TODO: param から取得する
  const inputLimitValue = 100;

  const {
    data: recentJoinWorldData,
    refetch,
    remove,
  } = trpcReact.logInfo.getRecentVRChatWorldJoinLogByVRChatPhotoName.useQuery(
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
    if (inputPhotoFileNameValue !== null) {
      refetch();
    } else {
      remove();
    }
  };

  const { data: photoData } =
    trpcReact.vrchatPhoto.getVrchatPhotoPathList.useQuery({
      limit: inputLimitValue,
    });

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
            {inputPhotoFileNameValue
              ? `PhotoPath:${inputPhotoFileNameValue}`
              : '写真で検索'}
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
                    <RenderInView key={pathStr}>
                      <PhotoByPath
                        onClick={() => onSelectPhotoFileName(pathStr)}
                        className="w-48 cursor-pointer hover:brightness-105"
                        key={pathStr}
                        photoPath={pathStr}
                      />
                    </RenderInView>
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

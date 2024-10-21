import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trpcReact } from '@/trpc';
import { Globe, Image, Search } from 'lucide-react';
import * as path from 'pathe';
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { PhotoListAll } from './__Photo/PhotoList';
import { VRChatWorldJoinDataView } from './__Photo/VRChatJoinDataView';

function PhotoSelector() {
  console.log('PhotoSelector');
  const [searchParams, setSearchParams] = useSearchParams();
  const [photoColumnCount, setPhotoColumnCount] = React.useState<number>(4);

  const inputPhotoFileNameValue = searchParams.get('photoFileName');

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
      {/* photoColumnCount を増減させるボタン */}
      <div className="flex justify-center space-x-3 m-3">
        <Button onClick={() => setPhotoColumnCount((prev) => prev - 1)}>
          <Image size={20} />
        </Button>
        <Button onClick={() => setPhotoColumnCount((prev) => prev + 1)}>
          <Globe size={20} />
        </Button>
        {photoColumnCount}
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
              nextJoinDateTime={
                recentJoinWorldData.nextJoinLog?.joinDateTime || null
              }
            />
          )}
        </div>
      ) : (
        <div className="m-3 flex flex-1 flex-row space-x-3 items-start h-full relative">
          <div className="flex-1 h-full relative">
            <PhotoListAll
              onSelectPhotoFileName={onSelectPhotoFileName}
              photoColumnCount={photoColumnCount}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoSelector;

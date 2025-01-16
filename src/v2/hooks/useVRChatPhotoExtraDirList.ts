import { trpcReact } from '@/trpc';

export const useVRChatPhotoExtraDirList = (): [
  string[],
  (dirs: string[]) => void,
] => {
  const { data: extraDirs = [], refetch } =
    trpcReact.getVRChatPhotoExtraDirList.useQuery();
  const { mutate } = trpcReact.setVRChatPhotoExtraDirList.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  return [extraDirs, mutate];
};

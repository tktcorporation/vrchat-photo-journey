import { trpcReact } from '@/trpc';
import { useState } from 'react';

/**
 * シェアダイアログの状態とアクションを管理するカスタムフック
 */
export const useShareActions = () => {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const openUrlMutation =
    trpcReact.electronUtil.openUrlInDefaultBrowser.useMutation();

  const copyTextMutation =
    trpcReact.electronUtil.copyTextToClipboard.useMutation();

  const openShareModal = () => setIsShareModalOpen(true);
  const closeShareModal = () => setIsShareModalOpen(false);

  const openWorldLink = (worldLink: string) => {
    openUrlMutation.mutate(worldLink);
  };

  const copyPlayersToClipboard = async (playerNames: string[]) => {
    const text = playerNames.join('\n');
    await copyTextMutation.mutateAsync(text);
  };

  return {
    isShareModalOpen,
    openShareModal,
    closeShareModal,
    openWorldLink,
    copyPlayersToClipboard,
  };
};

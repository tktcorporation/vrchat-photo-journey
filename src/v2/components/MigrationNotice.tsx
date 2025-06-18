import { useEffect, useState } from 'react';
import { trpcReact } from '@/trpc';
import { useToast } from '@/v2/hooks/use-toast';
import { MigrationDialog } from './MigrationDialog';

/**
 * Migration notice hook that manages migration dialog and notifications
 */
export const useMigrationNotice = () => {
  const { toast } = useToast();
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);

  // デバッグ用：強制表示（開発時のみ）
  // TODO: 本番環境では削除
  const FORCE_SHOW_MIGRATION_DIALOG = false; // Change to true to force show dialog

  const { data: migrationStatus, refetch: refetchMigrationStatus } =
    trpcReact.settings.checkMigrationStatus.useQuery(undefined, {
      // Only check once on mount
      staleTime: Number.POSITIVE_INFINITY,
      refetchOnWindowFocus: false,
    });

  const {
    data: migrationNoticeShown,
    isLoading: isLoadingNoticeShown,
    error: noticeError,
  } = trpcReact.settings.getMigrationNoticeShown.useQuery(undefined, {
    // Only check once on mount
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnWindowFocus: false,
  });

  // エラーログ
  if (noticeError) {
    console.error(
      '[MigrationNotice] Error fetching notice shown status:',
      noticeError,
    );
  }

  const setMigrationNoticeShown =
    trpcReact.settings.setMigrationNoticeShown.useMutation();

  useEffect(() => {
    // Debug logging
    console.log('[MigrationNotice] Migration check:', {
      migrationNoticeShown,
      isLoadingNoticeShown,
      migrationNeeded: migrationStatus?.migrationNeeded,
      migrationStatus,
      showMigrationDialog,
    });

    // Skip if still loading
    if (isLoadingNoticeShown || !migrationStatus) {
      console.log('[MigrationNotice] Skipping - still loading data');
      return;
    }

    // Check if user has already been notified about migration
    // 初回起動時（undefined）または false の場合にダイアログを表示
    const shouldShowDialog =
      FORCE_SHOW_MIGRATION_DIALOG ||
      ((migrationNoticeShown === false || migrationNoticeShown === undefined) &&
        migrationStatus.migrationNeeded === true);

    console.log('[MigrationNotice] Should show dialog:', {
      shouldShowDialog,
      FORCE_SHOW_MIGRATION_DIALOG,
      noticeShownCondition:
        migrationNoticeShown === false || migrationNoticeShown === undefined,
      migrationNeededCondition: migrationStatus.migrationNeeded === true,
    });

    if (shouldShowDialog) {
      console.log('[MigrationNotice] Setting showMigrationDialog to true');
      // Show migration dialog instead of just a toast
      setShowMigrationDialog(true);

      // Don't mark as shown immediately - wait for user interaction
      // setMigrationNoticeShown.mutate();
    }
  }, [
    migrationStatus,
    migrationNoticeShown,
    isLoadingNoticeShown,
    FORCE_SHOW_MIGRATION_DIALOG,
    // Remove setMigrationNoticeShown from dependencies since we're not calling it here
  ]);

  const handleMigrationComplete = async () => {
    // Mark the notice as shown after successful migration
    await setMigrationNoticeShown.mutateAsync();

    // Refetch migration status to update UI
    await refetchMigrationStatus();

    // Close the dialog
    setShowMigrationDialog(false);

    toast({
      title: 'データ移行完了',
      description: '旧アプリのデータが正常に移行されました。',
    });
  };

  const handleMigrationCancel = () => {
    // Mark the notice as shown when user cancels
    setMigrationNoticeShown.mutate();

    setShowMigrationDialog(false);

    toast({
      title: 'データ移行をスキップしました',
      duration: 5000,
    });
  };

  // デバッグ用：ダイアログ表示状態をログ
  console.log('[MigrationNotice] Dialog state:', { showMigrationDialog });

  return {
    showMigrationDialog,
    handleMigrationComplete,
    handleMigrationCancel,
    MigrationDialog: () => (
      <MigrationDialog
        open={showMigrationDialog}
        onClose={handleMigrationCancel}
        onMigrationComplete={handleMigrationComplete}
      />
    ),
  };
};

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { trpcReact } from '@/trpc';
import { AlertCircle, ArrowRight, Database, FolderOpen } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { useToast } from '../hooks/use-toast';

interface MigrationDialogProps {
  open: boolean;
  onClose: () => void;
  onMigrationComplete: () => void;
}

/**
 * 旧アプリからのデータ移行確認ダイアログ
 */
export const MigrationDialog: React.FC<MigrationDialogProps> = ({
  open,
  onClose,
  onMigrationComplete,
}) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const performMigration = trpcReact.settings.performMigration.useMutation({
    onMutate: () => {
      setIsProcessing(true);
    },
    onSuccess: (result) => {
      toast({
        title: 'データ移行が完了しました',
        description: `移行されたデータ: ${result.migratedItems.join('、')}`,
      });
      onMigrationComplete();
      onClose();
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'データ移行に失敗しました',
        description: error.message,
      });
      setIsProcessing(false);
    },
  });

  const handleMigration = () => {
    performMigration.mutate();
  };

  const handleCancel = () => {
    if (!isProcessing) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-[500px] bg-white dark:bg-gray-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            旧アプリからのデータ移行
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400">
            旧アプリのデータが見つかりました。 新アプリにデータを移行しますか？
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 移行の流れ */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                旧アプリ
              </span>
            </div>
            <ArrowRight className="h-6 w-6 text-blue-500" />
            <div className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <FolderOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-xs text-gray-600 dark:text-gray-400">
                新アプリ
              </span>
            </div>
          </div>

          {/* 移行内容 */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Database className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  移行されるデータ
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  VRChatのログデータ（ワールド訪問履歴）
                </p>
              </div>
            </div>
          </div>

          {/* 注意事項 */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  注意事項
                </p>
                <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1 ml-2">
                  <li>
                    • 既存のデータは保持され、旧アプリのデータが追加されます
                  </li>
                  <li>• この処理には時間がかかる場合があります</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isProcessing}
            className="min-w-[100px]"
          >
            スキップ
          </Button>
          <Button
            onClick={handleMigration}
            disabled={isProcessing}
            className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                移行中...
              </span>
            ) : (
              'データを移行する'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

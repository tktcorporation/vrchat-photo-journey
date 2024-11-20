import { trpcReact } from '@/trpc';
import { AlertCircle, FileText, FolderOpen } from 'lucide-react';
import React, { memo, useState } from 'react';
import { match } from 'ts-pattern';
import { useI18n } from '../../i18n/store';

const PathSettingsComponent = memo(() => {
  const { t } = useI18n();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Photo directory queries and mutations
  const { data: photoDir, refetch: refetchPhotoDir } =
    trpcReact.vrchatPhoto.getVRChatPhotoDirPath.useQuery();
  const validatePhotoPathMutation =
    trpcReact.vrchatPhoto.validateVRChatPhotoPath.useMutation();
  const setPhotoDirectoryMutation =
    trpcReact.vrchatPhoto.setVRChatPhotoDirPathToSettingStore.useMutation();
  const clearPhotoDirectoryMutation =
    trpcReact.vrchatPhoto.clearVRChatPhotoDirPathInSettingStore.useMutation();

  // Log file queries and mutations
  const { data: logFilesDir, refetch: refetchLogFilesDir } =
    trpcReact.getVRChatLogFilesDir.useQuery();
  const setLogPathMutation =
    trpcReact.setVRChatLogFilesDirByDialog.useMutation();

  // 写真パスの検証状態を保持
  const [photoValidationResult, setPhotoValidationResult] = useState<
    'MODEL_NOT_FOUND' | 'FILE_NOT_FOUND_MODEL_DELETED' | 'VALID' | null
  >(null);

  // 写真パスの検証を行う関数
  const validatePhotoPath = async () => {
    if (!photoDir?.value) return;
    const result = await validatePhotoPathMutation.mutateAsync(photoDir.value);
    setPhotoValidationResult(result.result);
  };

  // 写真ディレクトリが変更されたら検証を実行
  React.useEffect(() => {
    validatePhotoPath();
  }, [photoDir?.value]);

  const validatePaths = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      // 写真ディレクトリの検証
      if (!photoDir?.value) {
        throw new Error('写真ディレクトリが設定されていません');
      }
      const photoResult = await validatePhotoPathMutation.mutateAsync(
        photoDir.value,
      );

      const photoValidationError = match(photoResult.result)
        .with(
          'MODEL_NOT_FOUND',
          () => '写真ディレクトリのモデルが見つかりません',
        )
        .with(
          'FILE_NOT_FOUND_MODEL_DELETED',
          () => '写真ディレクトリが存在しないため、モデルを削除しました',
        )
        .with('VALID', () => null)
        .exhaustive();

      if (photoValidationError) {
        throw new Error(photoValidationError);
      }

      // ログファイルの検証
      if (!logFilesDir?.path) {
        throw new Error('ログファイルのパスが設定されていません');
      }

      const logValidationError = match(logFilesDir.error)
        .with('logFilesNotFound', () => 'ログファイルが見つかりませんでした')
        .with('logFileDirNotFound', () => 'フォルダの読み取りに失敗しました')
        .with(null, () => null)
        .exhaustive();

      if (logValidationError) {
        throw new Error(logValidationError);
      }
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : '不明なエラーが発生しました',
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleBrowsePhotoDirectory = async () => {
    try {
      const result = await setPhotoDirectoryMutation.mutateAsync();
      if (result) {
        await refetchPhotoDir();
      }
    } catch (error) {
      setValidationError('写真ディレクトリの選択中にエラーが発生しました');
    }
  };

  const handleBrowseLogFile = async () => {
    try {
      await setLogPathMutation.mutateAsync();
      await refetchLogFilesDir();
    } catch (error) {
      setValidationError('ログファイルの選択中にエラーが発生しました');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
          {/* Photo Directory Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('settings.paths.photoDirectory')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={photoDir?.value || ''}
                readOnly
                placeholder="/path/to/photos"
                className="flex-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200"
                onClick={handleBrowsePhotoDirectory}
              >
                <FolderOpen className="h-4 w-4" />
              </button>
            </div>
            {photoValidationResult && photoValidationResult !== 'VALID' && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {match(photoValidationResult)
                  .with(
                    'MODEL_NOT_FOUND',
                    () => '写真ディレクトリのモデルが見つかりません',
                  )
                  .with(
                    'FILE_NOT_FOUND_MODEL_DELETED',
                    () =>
                      '写真ディレクトリが存在しないため、モデルを削除しました',
                  )
                  .exhaustive()}
              </div>
            )}
          </div>

          {/* Log File Section */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('settings.paths.logFile')}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={logFilesDir?.path || ''}
                readOnly
                placeholder="/path/to/photo-logs.json"
                className="flex-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
              <button
                className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200"
                onClick={handleBrowseLogFile}
              >
                <FolderOpen className="h-4 w-4" />
              </button>
            </div>
            {logFilesDir?.error && (
              <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 mr-1" />
                {match(logFilesDir.error)
                  .with(
                    'logFilesNotFound',
                    () => 'ログファイルが見つかりませんでした',
                  )
                  .with(
                    'logFileDirNotFound',
                    () => 'フォルダの読み取りに失敗しました',
                  )
                  .exhaustive()}
              </div>
            )}
          </div>
        </div>

        {/* Log Format Info Section */}
        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FileText className="h-5 w-5 text-blue-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {t('settings.paths.logFormat.title')}
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>{t('settings.paths.logFormat.description')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PathSettingsComponent.displayName = 'PathSettings';

export default PathSettingsComponent;

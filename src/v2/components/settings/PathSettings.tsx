import { cn } from '@/components/lib/utils';
import { trpcReact } from '@/trpc';
import {
  AlertCircle,
  CheckCircle2,
  FolderOpen,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react';
import React, { memo, useState, useEffect } from 'react';
import { match } from 'ts-pattern';
import { LOG_SYNC_MODE, useLogSync } from '../../hooks/useLogSync';
import { useVRChatPhotoExtraDirList } from '../../hooks/useVRChatPhotoExtraDirList';
import { useI18n } from '../../i18n/store';

interface PathSettingsProps {
  showRefreshAll: boolean;
}

/**
 * VRChat のログ・写真フォルダを設定する画面。
 * データソース変更時のリフレッシュ処理もここから行われる。
 */
const PathSettingsComponent = memo(({ showRefreshAll }: PathSettingsProps) => {
  const { t } = useI18n();
  const [_isValidating, setIsValidating] = useState(false);
  const [_validationError, setValidationError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>(
    'idle',
  );

  // ログ同期フックを使用
  const { sync: syncLogs, isLoading: isRefreshing } = useLogSync({
    onSuccess: () => {
      // 同期完了時の処理
      console.log('Log sync completed successfully');
    },
    onError: (error) => {
      console.error('Failed to sync logs:', error);
    },
  });

  // Photo directory queries and mutations
  const { data: photoDir, refetch: refetchPhotoDir } =
    trpcReact.vrchatPhoto.getVRChatPhotoDirPath.useQuery();
  const validatePhotoPathMutation =
    trpcReact.vrchatPhoto.validateVRChatPhotoPath.useMutation();
  const setPhotoDirectoryMutation =
    trpcReact.vrchatPhoto.setVRChatPhotoDirPathToSettingStore.useMutation();
  const setPhotoPathDirectlyMutation =
    trpcReact.vrchatPhoto.setVRChatPhotoDirPathDirectly.useMutation();
  const _clearPhotoDirectoryMutation =
    trpcReact.vrchatPhoto.clearVRChatPhotoDirPathInSettingStore.useMutation();

  const [extraDirs, setExtraDirs] = useVRChatPhotoExtraDirList();
  const showOpenDialogMutation = trpcReact.showOpenDialog.useMutation();

  // Log file queries and mutations
  const { data: logFilesDir, refetch: refetchLogFilesDir } =
    trpcReact.getVRChatLogFilesDir.useQuery();
  const setLogPathMutation =
    trpcReact.setVRChatLogFilesDirByDialog.useMutation();
  const setLogPathDirectlyMutation =
    trpcReact.setVRChatLogFilePath.useMutation();

  const [logInputValue, setLogInputValue] = useState('');
  const [isLogPathManuallyChanged, setIsLogPathManuallyChanged] =
    useState(false);

  // 写真ディレクトリの状態管理（ログファイルと同じパターン）
  const [photoInputValue, setPhotoInputValue] = useState('');
  const [isPhotoPathManuallyChanged, setIsPhotoPathManuallyChanged] =
    useState(false);

  useEffect(() => {
    if (logFilesDir?.path) {
      setLogInputValue(logFilesDir.path);
    } else {
      setLogInputValue(''); // パスがない場合は空文字に
    }
    setIsLogPathManuallyChanged(false); // 初期読み込み時や参照ボタンでの変更後は手動変更フラグをリセット
  }, [logFilesDir?.path]);

  useEffect(() => {
    if (photoDir?.value) {
      setPhotoInputValue(photoDir.value);
    } else {
      setPhotoInputValue(''); // パスがない場合は空文字に
    }
    setIsPhotoPathManuallyChanged(false); // 初期読み込み時や参照ボタンでの変更後は手動変更フラグをリセット
  }, [photoDir?.value]);

  // 写真パスの検証状態を保持
  const [photoValidationResult, _setPhotoValidationResult] = useState<
    'MODEL_NOT_FOUND' | 'FILE_NOT_FOUND_MODEL_DELETED' | 'VALID' | null
  >(null);

  // 写真パスの検証を行う関数
  /** 設定された写真ディレクトリが有効か確認する */
  const validatePhotoPath = async () => {
    // if (!photoDir?.value) return;
    // const result = await validatePhotoPathMutation.mutateAsync(photoDir.value);
    // setPhotoValidationResult(result.result);
  };

  // 写真ディレクトリが変更されたら検証を実行
  React.useEffect(() => {
    validatePhotoPath();
  }, [photoDir?.value]);

  /** 写真パスとログパスをまとめて検証する */
  const _validatePaths = async () => {
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
    } catch (_error) {
      setValidationError('写真ディレクトリの選択中にエラーが発生しました');
    } finally {
      setIsValidating(false);
    }
  };

  /** フォトディレクトリ選択ダイアログを開く */
  const handleBrowsePhotoDirectory = async () => {
    try {
      const result = await setPhotoDirectoryMutation.mutateAsync();
      if (result) {
        await refetchPhotoDir();
      }
    } catch (_error) {
      setValidationError('写真ディレクトリの選択中にエラーが発生しました');
    }
  };

  /** ログファイル選択ダイアログを開く */
  const handleBrowseLogFile = async () => {
    try {
      const result = await setLogPathMutation.mutateAsync();
      if (result) {
        await refetchLogFilesDir();
        setIsLogPathManuallyChanged(false);
      }
    } catch (_error) {
      setValidationError('ログファイルの選択中にエラーが発生しました');
    }
  };

  /** ログファイル入力欄の変更を処理する */
  const handleLogInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLogInputValue(event.target.value);
    setIsLogPathManuallyChanged(
      event.target.value !== (logFilesDir?.path || ''),
    );
  };

  /** ログファイルパスを保存する */
  const handleLogPathSave = async () => {
    try {
      setSaveStatus('saving');
      await setLogPathDirectlyMutation.mutateAsync(logInputValue, {
        onSuccess: async () => {
          await refetchLogFilesDir();
          setIsLogPathManuallyChanged(false);
          setValidationError(null);
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: () => {
          setValidationError('ログファイルのパス保存中にエラーが発生しました');
          setSaveStatus('idle');
        },
      });
    } catch (_error) {
      setValidationError(
        'ログファイルのパス保存中に予期せぬエラーが発生しました',
      );
      setSaveStatus('idle');
    }
  };

  // 写真ディレクトリ用のハンドラー関数（ログファイルと同じパターン）
  /** 写真ディレクトリ入力欄の変更を処理する */
  const handlePhotoInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setPhotoInputValue(event.target.value);
    setIsPhotoPathManuallyChanged(
      event.target.value !== (photoDir?.value || ''),
    );
  };

  /** 写真ディレクトリのパスを保存する */
  const handlePhotoPathSave = async () => {
    try {
      setSaveStatus('saving');
      await setPhotoPathDirectlyMutation.mutateAsync(photoInputValue, {
        onSuccess: async () => {
          await refetchPhotoDir();
          setIsPhotoPathManuallyChanged(false);
          setValidationError(null);
          setSaveStatus('success');
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: () => {
          setValidationError(
            '写真ディレクトリのパス保存中にエラーが発生しました',
          );
          setSaveStatus('idle');
        },
      });
    } catch (_error) {
      setValidationError(
        '写真ディレクトリのパス保存中に予期せぬエラーが発生しました',
      );
      setSaveStatus('idle');
    }
  };

  /**
   * 全データの再読み込みを行う関数
   *
   * 重要な処理順序：
   * 1. appendLoglines: VRChatログファイルから新しいログ行を読み込む
   * 2. その成功後に loadLogInfo: ログ情報をDBに保存
   * 3. その成功後に キャッシュの無効化: UIを更新
   *
   * この順序が重要な理由：
   * - この順序で処理しないと、新しいワールド参加ログがDBに保存されず、
   *   新しい写真が古いワールドグループに誤って割り当てられます
   */
  /** すべてのログを再読み込みしてインデックスを再構築する */
  const handleRefreshAll = async () => {
    if (!isRefreshing) {
      // 全件処理モードでログを同期
      await syncLogs(LOG_SYNC_MODE.FULL);
    }
  };

  /** 追加読み込み用フォルダを選択する */
  const handleBrowseExtraDirectory = async () => {
    const result = await showOpenDialogMutation.mutateAsync({
      properties: ['openDirectory'],
    });
    if (!result.canceled && result.filePaths.length > 0) {
      setExtraDirs([...extraDirs, result.filePaths[0]]);
    }
  };

  /** 追加フォルダリストから指定インデックスを削除する */
  const handleRemoveExtraDirectory = (index: number) => {
    const newDirs = [...extraDirs];
    newDirs.splice(index, 1);
    setExtraDirs(newDirs);
  };

  return (
    <div className="space-y-4">
      {/* Photo Directory Section */}
      <div className="rounded-lg border border-gray-200/50 bg-white/30 p-4 backdrop-blur-sm transition-all hover:border-gray-300/50 dark:border-gray-700/30 dark:bg-gray-800/20 dark:hover:border-gray-600/30">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('settings.paths.photoDirectory')}
          </h3>
          <FolderOpen className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>

        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              aria-label={`input-${t('settings.paths.photoDirectory')}`}
              value={photoInputValue}
              onChange={handlePhotoInputChange}
              className={cn(
                'w-full rounded-md border bg-white/50 px-3 py-1.5 text-sm text-gray-900 shadow-sm transition-all',
                'placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400',
                'dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder:text-gray-500',
                photoValidationResult && photoValidationResult !== 'VALID'
                  ? 'border-red-300 dark:border-red-400/50'
                  : 'border-gray-200 dark:border-gray-700',
              )}
              placeholder="/path/to/photos"
            />
            {photoValidationResult && photoValidationResult !== 'VALID' && (
              <AlertCircle className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-red-400" />
            )}
          </div>

          {photoValidationResult && photoValidationResult !== 'VALID' && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3" />
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
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              aria-label={`${t('settings.paths.browse')}-${t(
                'settings.paths.photoDirectory',
              )}`}
              className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={handleBrowsePhotoDirectory}
            >
              <FolderOpen className="mr-1.5 inline h-3.5 w-3.5" />
              {t('settings.paths.browse')}
            </button>
            {isPhotoPathManuallyChanged && (
              <button
                type="button"
                aria-label={`${t('common.submit')}-${t(
                  'settings.paths.photoDirectory',
                )}`}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all',
                  saveStatus === 'success'
                    ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                    : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
                )}
                onClick={handlePhotoPathSave}
              >
                {match(saveStatus)
                  .with('saving', () => (
                    <RefreshCw className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
                  ))
                  .with('success', () => (
                    <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" />
                  ))
                  .otherwise(() => (
                    <Save className="mr-1.5 inline h-3.5 w-3.5" />
                  ))}
                {t('common.submit')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Extra Photo Directories Section */}
      <div className="rounded-lg border border-gray-200/50 bg-white/30 p-4 backdrop-blur-sm dark:border-gray-700/30 dark:bg-gray-800/20">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            追加で読み込ませる写真フォルダ
          </h3>
        </div>

        <div className="space-y-2">
          {extraDirs.map((dir: string, index: number) => (
            <div
              key={`extra-dir-${dir}`}
              className="flex items-center gap-2 rounded-md border border-gray-200 bg-white/50 p-2 transition-all hover:border-gray-300 dark:border-gray-700 dark:bg-gray-900/30 dark:hover:border-gray-600"
            >
              <input
                type="text"
                value={dir}
                readOnly
                className="flex-1 bg-transparent text-xs text-gray-700 outline-none dark:text-gray-300"
              />
              <button
                type="button"
                onClick={() => handleRemoveExtraDirectory(index)}
                aria-label={t('settings.paths.removeExtraDirectory')}
                className="rounded p-1 text-gray-400 transition-all hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={handleBrowseExtraDirectory}
            aria-label={t('settings.paths.addExtraDirectory')}
            className="flex w-full items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50/50 px-3 py-2 text-xs font-medium text-gray-600 transition-all hover:border-gray-400 hover:bg-gray-100/50 dark:border-gray-600 dark:bg-gray-800/30 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:bg-gray-700/30"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            フォルダを追加
          </button>
        </div>
      </div>

      {/* Log File Directory Section */}
      <div className="rounded-lg border border-gray-200/50 bg-white/30 p-4 backdrop-blur-sm transition-all hover:border-gray-300/50 dark:border-gray-700/30 dark:bg-gray-800/20 dark:hover:border-gray-600/30">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('settings.paths.logFile')}
          </h3>
          <FolderOpen className="h-4 w-4 text-gray-400 dark:text-gray-500" />
        </div>

        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              aria-label={`input-${t('settings.paths.logFile')}`}
              value={logInputValue}
              onChange={handleLogInputChange}
              className={cn(
                'w-full rounded-md border bg-white/50 px-3 py-1.5 text-sm text-gray-900 shadow-sm transition-all',
                'placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-400',
                'dark:bg-gray-900/50 dark:text-gray-100 dark:placeholder:text-gray-500',
                logFilesDir?.error
                  ? 'border-red-300 dark:border-red-400/50'
                  : 'border-gray-200 dark:border-gray-700',
              )}
              placeholder="/path/to/VRChat logs"
            />
            {logFilesDir?.error && (
              <AlertCircle className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-red-400" />
            )}
          </div>

          {logFilesDir?.error && (
            <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3 w-3" />
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
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              aria-label={`${t('settings.paths.browse')}-${t(
                'settings.paths.logFile',
              )}`}
              className="flex-1 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
              onClick={handleBrowseLogFile}
            >
              <FolderOpen className="mr-1.5 inline h-3.5 w-3.5" />
              {t('settings.paths.browse')}
            </button>
            {isLogPathManuallyChanged && (
              <button
                type="button"
                aria-label={`${t('common.submit')}-${t(
                  'settings.paths.logFile',
                )}`}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all',
                  saveStatus === 'success'
                    ? 'bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700'
                    : 'bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700',
                )}
                onClick={handleLogPathSave}
              >
                {match(saveStatus)
                  .with('saving', () => (
                    <RefreshCw className="mr-1.5 inline h-3.5 w-3.5 animate-spin" />
                  ))
                  .with('success', () => (
                    <CheckCircle2 className="mr-1.5 inline h-3.5 w-3.5" />
                  ))
                  .otherwise(() => (
                    <Save className="mr-1.5 inline h-3.5 w-3.5" />
                  ))}
                {t('common.submit')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Refresh All Data Section */}
      {showRefreshAll && (
        <div className="rounded-lg border border-blue-200/50 bg-blue-50/30 p-4 backdrop-blur-sm dark:border-blue-800/30 dark:bg-blue-900/10">
          <div className="space-y-3">
            <div>
              <h3 className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                データの再構築
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                設定したVRChatのログファイルから、過去のワールド訪問履歴を含む全てのインデックスを再構築します。
              </p>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRefreshAll}
                disabled={isRefreshing}
                aria-label={t('common.refresh')}
                className="rounded-md bg-blue-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                <RefreshCw
                  className={cn(
                    'mr-1.5 inline h-3.5 w-3.5',
                    isRefreshing && 'animate-spin',
                  )}
                />
                {t('common.refresh')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

PathSettingsComponent.displayName = 'PathSettings';

export default PathSettingsComponent;

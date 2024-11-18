import React, { memo, useState } from 'react';
import { FolderOpen, FileText, AlertCircle } from 'lucide-react';
import { usePhotoSource } from '../../hooks/usePhotoSource';
import { useI18n } from '../../i18n/store';

const PathSettingsComponent = memo(() => {
  const { t } = useI18n();
  const { settings, updateSettings, sourceType, setSourceType } = usePhotoSource();
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handlePathChange = (key: 'photoDirectory' | 'logFilePath', value: string) => {
    updateSettings({ ...settings, [key]: value });
  };

  const validatePaths = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      // ダミー実装: 実際にはファイルシステムのアクセス権限やパスの存在確認を行う
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // デモ用のバリデーション
      if (!settings.photoDirectory.startsWith('/')) {
        throw new Error('写真ディレクトリは絶対パスで指定してください');
      }
      if (!settings.logFilePath.endsWith('.json')) {
        throw new Error('ログファイルはJSONファイルを指定してください');
      }
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : '不明なエラーが発生しました');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSourceType('demo')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sourceType === 'demo'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('settings.paths.useDemo')}
          </button>
          <button
            onClick={() => setSourceType('local')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              sourceType === 'local'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {t('settings.paths.useLocal')}
          </button>
        </div>

        {sourceType === 'local' && (
          <div className="space-y-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.paths.photoDirectory')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.photoDirectory}
                  onChange={(e) => handlePathChange('photoDirectory', e.target.value)}
                  placeholder="/path/to/photos"
                  className="flex-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200"
                  onClick={() => alert('この機能はデモ版では利用できません')}
                >
                  {t('settings.paths.browse')}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('settings.paths.logFile')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.logFilePath}
                  onChange={(e) => handlePathChange('logFilePath', e.target.value)}
                  placeholder="/path/to/photo-logs.json"
                  className="flex-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-200"
                  onClick={() => alert('この機能はデモ版では利用できません')}
                >
                  {t('settings.paths.browse')}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={validatePaths}
                disabled={isValidating}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? t('settings.paths.validating') : t('settings.paths.validate')}
              </button>

              {validationError && (
                <div className="flex items-center text-sm text-red-600 dark:text-red-400">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {validationError}
                </div>
              )}
            </div>
          </div>
        )}

        {sourceType === 'local' && (
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
                  <pre className="mt-2 bg-blue-100 dark:bg-blue-900/40 p-2 rounded-md overflow-x-auto">
                    {JSON.stringify({
                      "photo1.jpg": {
                        "location": {
                          "name": "清水寺",
                          "prefecture": "京都府"
                        },
                        "takenAt": "2024-03-15T10:30:00Z",
                        "tags": ["寺院", "桜"]
                      }
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

PathSettingsComponent.displayName = 'PathSettings';

export default PathSettingsComponent;
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { useEffect } from 'react';

function CreateJoinInfo() {
  const [statusToUseVRChatLogFilesDir, setStatusToUseVRChatLogFilesDir] = React.useState<
    'ready' | 'logFilesDirNotSet' | 'logFilesNotFound' | null
  >(null);
  useEffect(() => {
    window.Main.on(
      'status-to-use-vrchat-log-files-dir',
      (status: 'ready' | 'logFilesDirNotSet' | 'logFilesNotFound') => {
        setStatusToUseVRChatLogFilesDir(status);
        console.log(status);
      }
    );
  }, []);

  return (
    <div className="flex-auto">
      <div className=" flex flex-col justify-center items-center h-full space-y-4 bg-blue-50">
        {/* VRChatLogのPahtが正しく設定されているかどうかの表示 */}
        <div className="text-2xl text-gray-900">
          VRChatLogのパスが正しく設定されていますか？
          {`${statusToUseVRChatLogFilesDir}`}
        </div>
        {/* ファイル生成の設定準備が整っているか、の更新 */}
        <button
          className="py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => {
            window.Main.getStatusToUseVRChatLogFilesDir();
          }}
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
        {/* ファイル生成ボタン */}
        <button
          className="create-file-button py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => window.Main.createFiles()}
        >
          ファイルを生成する
        </button>
      </div>
    </div>
  );
}

export default CreateJoinInfo;

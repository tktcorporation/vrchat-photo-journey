import { ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

function CreateJoinInfo() {
  const [statusToUseVRChatLogFilesDir, setStatusToUseVRChatLogFilesDir] = React.useState<
    'ready' | 'logFilesDirNotSet' | 'logFilesNotFound' | null
  >(null);
  const [statusToUseVRChatPhotoDir, setStatusToUseVRChatPhotoDir] = React.useState<
    'ready' | 'logFilesDirNotSet' | 'logFilesNotFound' | null
  >(null);
  useEffect(() => {
    window.Main.on(
      'status-to-use-vrchat-log-files-dir',
      (status: 'ready' | 'logFilesDirNotSet' | 'logFilesNotFound') => {
        setStatusToUseVRChatLogFilesDir(status);
      }
    );
    window.Main.on('vrchat-photo-dir-with-error', ({ storedPath, error }) => {
      let status: 'ready' | 'logFilesDirNotSet' | 'logFilesNotFound' = 'ready';
      if (storedPath === null) {
        status = 'logFilesDirNotSet';
      } else if (error) {
        status = 'logFilesNotFound';
      }
      setStatusToUseVRChatPhotoDir(status);
    });
  }, []);

  return (
    <div className="flex-auto">
      <div className=" flex flex-col justify-center items-center h-full space-y-4 bg-blue-50">
        {/* VRChatLogのPahtが正しく設定されているかどうかの表示 */}
        <div className="text-2xl text-gray-900">
          VRChatLogのパスが正しく設定されていますか？
          {`${statusToUseVRChatLogFilesDir}`}
        </div>
        {/* VRChatPhotoのPathが正しく設定されているかどうかの表示 */}
        <div className="text-2xl text-gray-900">
          VRChatPhotoのパスが正しく設定されていますか？
          {`${statusToUseVRChatPhotoDir}`}
        </div>

        {/* ファイル生成の設定準備が整っているか、の更新 */}
        <button
          className="py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => {
            window.Main.getStatusToUseVRChatLogFilesDir();
            window.Main.getVRChatPhotoDir();
          }}
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
        {/* 設定に戻る */}
        <Link to="/" className="py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200">
          設定に戻る
        </Link>
        {/* ファイル生成ボタン */}
        <button
          // disabled のときの sty
          className="create-file-button py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => window.Main.createFiles()}
          disabled={statusToUseVRChatLogFilesDir !== 'ready' || statusToUseVRChatPhotoDir !== 'ready'}
        >
          ファイルを生成する
        </button>
      </div>
    </div>
  );
}

export default CreateJoinInfo;

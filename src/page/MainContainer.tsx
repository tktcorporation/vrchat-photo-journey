import React, { useEffect } from 'react';
import toast from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { trpcReact } from '../trpc';

function MainContainer() {
  // 初期表示時に log-files-dir を取得する
  const logFilesDir = trpcReact.getVRChatLogFilesDir.useQuery().data?.path;
  const vrchatPhotoDir = trpcReact.getVRChatPhotoDir.useQuery().data?.path;

  useEffect(() => {
    if (window.Main)
      window.Main.on('file-content', (content: string) => {
        console.log(content);
      });
  });

  useEffect(() => {
    if (window.Main)
      window.Main.on('toast', (content: string) => {
        console.log(content);
        toast(content);
      });
  });

  return (
    <div className="flex-auto">
      <div className=" flex flex-col justify-center items-center h-full space-y-4 bg-blue-50">
        <h1 className="text-2xl text-gray-900">VRChatの写真どこで撮ったかわかるようにするアプリ</h1>
        <button
          className="open-dialog-and-set-log-files-dir-button py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => {
            if (window.Main) {
              window.Main.openDialogAndSetLogFilesDir();
            }
          }}
        >
          ログファイルの場所を指定する
        </button>
        <div className="log-files-dir-label">log-files-dir: {logFilesDir}</div>
        {/* VRChat Photo の Dir を指定する */}
        <button
          className="open-dialog-and-set-vrchat-photo-dir-button py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => {
            if (window.Main) {
              window.Main.openDialogAndSetVRChatPhotoDir();
            }
          }}
        >
          VRChat Photo の場所を指定する
        </button>
        <div className="vrchat-photo-dir-label">vrchat-photo-dir: {vrchatPhotoDir}</div>
        {/* 設定の再取得 */}
        <button
          className="get-vrchat-photo-dir-button py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => {
            if (window.Main) {
              window.Main.getVRChatPhotoDir();
              window.Main.getLogFilesDir();
            }
          }}
        >
          <ArrowPathIcon className="h-5 w-5" />
        </button>
        {/* すべての設定をリセットする */}
        <Link to="/clear-settings">
          <button className="reset-button py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200">
            設定をリセットする
          </button>
        </Link>
        {/* ファイル生成画面に移動するボタン */}
        <Link to="/create-join-info">
          <button className="py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200">設定完了</button>
        </Link>
      </div>
    </div>
  );
}

export default MainContainer;

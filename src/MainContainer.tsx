import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

function MainContainer() {
  // 初期表示時に log-files-dir を取得する
  const [logFilesDir, setlogFilesDir] = useState<string | null>(null);
  const [logFileNames, setlogFileNames] = useState<string[] | null>(null);
  useEffect(() => {
    if (window.Main) {
      window.Main.on('log-files-dir', (dir: string) => {
        console.log(dir);
        setlogFilesDir(dir);
      });
      window.Main.on('log-file-names', (names: string[]) => {
        console.log(names);
        setlogFileNames(names);
      });
    }
  }, []);

  useEffect(() => {
    if (window.Main)
      window.Main.on('file-content', (content: string) => {
        console.log(content);
      });
  });

  const [joinWorldLogLines, setJoinWorldLogLines] = useState<string[]>([]);
  useEffect(() => {
    if (window.Main) {
      window.Main.on('join-world-log-lines', (lines: string[]) => {
        console.log(lines);
        setJoinWorldLogLines(lines);
      });
    }
  }, []);

  const [vrchatPhotoDir, setVrchatPhotoDir] = useState<string | null>(null);
  useEffect(() => {
    if (window.Main) {
      window.Main.on('vrchat-photo-dir', (dir: string) => {
        console.log(dir);
        setVrchatPhotoDir(dir);
      });
    }
  }, []);

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
        {/* ファイル生成ボタン */}
        <button
          className="create-file-button py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => {
            if (window.Main) {
              window.Main.createFiles();
            }
          }}
        >
          どこで撮ったか調べる
        </button>
      </div>
      {/* デバッグ用領域 */}
      <div className="log-file-names-label">log-file-names: {logFileNames?.join(',')}</div>
      <div className="join-world-log-lines-label">
        join-world-log-lines:
        {joinWorldLogLines.map((line) => {
          return <div key={line}>{line}</div>;
        })}
      </div>
    </div>
  );
}

export default MainContainer;

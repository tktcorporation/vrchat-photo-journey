import React from 'react';
import { Link } from 'react-router-dom';

function MainContainer() {
  return (
    <div className="flex-auto">
      <div className=" flex flex-col justify-center items-center h-full space-y-4 bg-blue-50">
        {/* すべての設定をリセットする */}
        <button
          className="reset-button py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => {
            if (window.Main) {
              window.Main.clearAllStoredSettings();
            }
          }}
        >
          設定をリセットする
        </button>
        {/* 設定に戻る */}
        <Link to="/" className="py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200">
          戻る
        </Link>
      </div>
    </div>
  );
}

export default MainContainer;

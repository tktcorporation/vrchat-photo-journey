import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTER_PATHS } from '../constants';
import { trpcReact } from '../trpc';
import { Button } from '../component/ui/button';

function ClearSettings() {
  const mutation = trpcReact.clearAllStoredSettings.useMutation();
  return (
    <div className="flex-auto">
      <div className=" flex flex-col justify-center items-center h-full space-y-4 bg-blue-50">
        {/* すべての設定をリセットする */}
        <button
          className="reset-button py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => mutation.mutate()}
        >
          設定をリセットする
        </button>
        {/* 設定に戻る */}
        <Link to={ROUTER_PATHS.SETTING}>
          <Button>戻る</Button>
        </Link>
      </div>
    </div>
  );
}

export default ClearSettings;

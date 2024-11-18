import { Button } from '@/v1/components/ui/button';
import React from 'react';
import { Link } from 'react-router-dom';
import { trpcReact } from '../../trpc';
import { ROUTER_PATHS } from '../constants';

function ClearSettings() {
  const mutation = trpcReact.clearAllStoredSettings.useMutation();
  return (
    <div className="flex-auto">
      <div className=" flex flex-col justify-center items-center h-full space-y-4">
        {/* すべての設定をリセットする */}
        <button
          className="reset-button py-2 px-4 bg-white rounded focus:outline-none shadow hover:bg-yellow-200"
          onClick={() => mutation.mutate()}
          type="button"
        >
          設定をリセットする
        </button>
        {/* 設定にもどる */}
        <Link to={ROUTER_PATHS.SETTING}>
          <Button>もどる</Button>
        </Link>
      </div>
    </div>
  );
}

export default ClearSettings;

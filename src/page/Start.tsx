import { trpcReact } from '@/trpc';

import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import * as card from '@/components/ui/card';
import { ROUTER_PATHS } from '@/constants';
import { Loader } from 'lucide-react';
import { useEffect } from 'react';

export const Start = () => {
  const navigate = useNavigate();
  const syncRdbMutation = trpcReact.settings.syncDatabase.useMutation({
    onSuccess: () => {
      navigate(ROUTER_PATHS.HOME);
    },
  });

  // TODO: 初回のみ実行するようにbackendで制御しておく？
  useEffect(() => {}, []);

  return (
    <div className="flex-auto h-full flex flex-col space-y-9">
      <div className="w-3/5 mx-auto mt-6">
        <card.Card>
          <card.CardHeader>
            <card.CardTitle>sync db</card.CardTitle>
          </card.CardHeader>
          <card.CardContent>
            データ構成に変更が検出されました。
            データを初期化して同期を行います。
          </card.CardContent>
          <card.CardFooter>
            {syncRdbMutation.isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader className="w-8 h-8" />
              </div>
            ) : (
              <Button onClick={() => syncRdbMutation.mutate()}>開始</Button>
            )}
          </card.CardFooter>
        </card.Card>
      </div>
    </div>
  );
};

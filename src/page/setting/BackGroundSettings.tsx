import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { trpcReact } from '@/trpc';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BackGroundSettings = () => {
  const navigate = useNavigate();
  const enabledBackgroundExecutionQuery =
    trpcReact.backgroundSettings.getIsBackgroundFileCreationEnabled.useQuery();
  const [enabledBackgroundExecution, setIsBackgroundFileCreationEnabled] =
    useState(enabledBackgroundExecutionQuery.data);
  const setIsBackgroundFileCreationEnabledMutation =
    trpcReact.backgroundSettings.setIsBackgroundFileCreationEnabled.useMutation();

  const onChangeSwitch = async (checked: boolean) => {
    await setIsBackgroundFileCreationEnabledMutation.mutate(checked);
    setIsBackgroundFileCreationEnabled(checked);
  };

  const switchDisabled =
    enabledBackgroundExecutionQuery.status === 'loading' ||
    setIsBackgroundFileCreationEnabledMutation.status === 'loading';

  return (
    <div className="flex-auto h-full">
      <div className="flex flex-col justify-center items-center h-full">
        <div className="space-y-4 flex flex-col justify-center items-center">
          <h3 className="text-lg font-medium">バックグラウンド動作</h3>
          <div className="text-sm text-muted-foreground">
            アプリを閉じた後の動作を設定
          </div>
        </div>
        <div className="space-y-4 my-8 flex flex-col justify-center items-center">
          <div className="flex flex-row items-center justify-between space-x-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="back-ground-execution">
                閉じたあともJoinの記録を続ける
              </Label>
              <Switch
                id="back-ground-execution"
                checked={enabledBackgroundExecution ?? false}
                onCheckedChange={onChangeSwitch}
                disabled={switchDisabled}
              />
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate(-1)} className="mt-4">
          もどる
        </Button>
      </div>
    </div>
  );
};

export default BackGroundSettings;

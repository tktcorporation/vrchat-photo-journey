import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { trpcReact } from '@/trpc';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingBreadcrumb } from './__setting/SettingsBreadcrumb';

interface BackgroundFileCreateToggleProps {
  defaultChecked: boolean;
}
const BackgroundFileCreateToggle = ({
  defaultChecked,
}: BackgroundFileCreateToggleProps) => {
  const [enabledBackgroundExecution, setIsBackgroundFileCreationEnabled] =
    useState<boolean | null>(null);

  const setIsBackgroundFileCreationEnabledMutation =
    trpcReact.backgroundSettings.setIsBackgroundFileCreationEnabled.useMutation();

  const onChangeSwitch = async (checked: boolean) => {
    await setIsBackgroundFileCreationEnabledMutation.mutate(checked);
    setIsBackgroundFileCreationEnabled(checked);
  };

  const checked = enabledBackgroundExecution ?? defaultChecked;
  console.log('checked', checked);

  return (
    <div className="flex flex-row items-center justify-between space-x-4">
      <Label htmlFor="back-ground-execution">
        ウィンドウを閉じたあともJoinの記録を続ける
      </Label>
      <Switch
        id="back-ground-execution"
        checked={checked}
        onCheckedChange={onChangeSwitch}
      />
    </div>
  );
};

interface AutoStartToggleProps {
  defaultChecked: boolean;
}
const AutoStartToggle = ({ defaultChecked }: AutoStartToggleProps) => {
  const [enabledAutoStart, setIsAutoStartEnabled] = useState<boolean | null>(
    null,
  );

  const setIsAutoStartEnabledMutation =
    trpcReact.backgroundSettings.setIsAppAutoStartEnabled.useMutation();

  const onChangeSwitch = async (checked: boolean) => {
    await setIsAutoStartEnabledMutation.mutate(checked);
    setIsAutoStartEnabled(checked);
  };

  const checked = enabledAutoStart ?? defaultChecked;

  return (
    <div className="flex flex-row items-center justify-between space-x-4">
      <Label htmlFor="auto-start">PCログイン時に自動でAppを開始する</Label>
      <Switch
        id="auto-start"
        checked={checked}
        onCheckedChange={onChangeSwitch}
      />
    </div>
  );
};

const BackGroundSettings = () => {
  const navigate = useNavigate();
  const enabledBackgroundExecution =
    trpcReact.backgroundSettings.getIsBackgroundFileCreationEnabled.useQuery()
      .data;

  const enabledAutoStart =
    trpcReact.backgroundSettings.getIsAppAutoStartEnabled.useQuery().data;

  return (
    <div className="flex-auto h-full">
      <SettingBreadcrumb />
      <div className="flex flex-col justify-center items-center h-full">
        <div className="space-y-4 flex flex-col justify-center items-center">
          <h3 className="text-lg font-medium">バックグラウンド動作</h3>
        </div>
        <div className="space-y-4 my-10 flex flex-col justify-center items-center">
          <div className="flex flex-row items-center justify-between space-x-4">
            <div className="flex items-center gap-4 flex-col">
              {enabledBackgroundExecution !== undefined ? (
                <BackgroundFileCreateToggle
                  defaultChecked={enabledBackgroundExecution}
                />
              ) : (
                <div>loading...</div>
              )}
              {enabledAutoStart !== undefined ? (
                <AutoStartToggle defaultChecked={enabledAutoStart} />
              ) : (
                <div>loading...</div>
              )}
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

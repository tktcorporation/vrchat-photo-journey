import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { trpcReact } from '@/trpc';
import { useState } from 'react';
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

  return {
    Label: (
      <Label htmlFor="back-ground-execution">
        ウィンドウを閉じたあともJoinの記録を続ける
      </Label>
    ),
    Switch: (
      <Switch
        id="back-ground-execution"
        checked={checked}
        onCheckedChange={onChangeSwitch}
      />
    ),
  };
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

  return {
    Label: (
      <Label htmlFor="auto-start">PCログイン時に自動でAppを開始する</Label>
    ),
    Switch: (
      <Switch
        id="auto-start"
        checked={checked}
        onCheckedChange={onChangeSwitch}
      />
    ),
  };
};

const BackGroundSettings = () => {
  const enabledBackgroundExecution =
    trpcReact.backgroundSettings.getIsBackgroundFileCreationEnabled.useQuery()
      .data;

  const enabledAutoStart =
    trpcReact.backgroundSettings.getIsAppAutoStartEnabled.useQuery().data;

  const AutoStart = () => {
    const autoStartToggle =
      enabledAutoStart !== undefined
        ? AutoStartToggle({ defaultChecked: enabledAutoStart })
        : null;
    if (autoStartToggle === null) {
      return <span>loading...</span>;
    }
    return (
      <>
        <div className="">{autoStartToggle.Label}</div>
        <div className="">{autoStartToggle.Switch}</div>
      </>
    );
  };

  const BackgroundFileCreate = () => {
    const backgroundFileCreateToggle =
      enabledBackgroundExecution !== undefined
        ? BackgroundFileCreateToggle({
            defaultChecked: enabledBackgroundExecution,
          })
        : null;
    if (backgroundFileCreateToggle === null) {
      return <span>loading...</span>;
    }
    return (
      <>
        <div className="">{backgroundFileCreateToggle.Label}</div>
        <div className="">{backgroundFileCreateToggle.Switch}</div>
      </>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="w-3/5 flex flex-col h-full mt-6">
        <div>
          <div className="flex flex-col mt-10 divide-y *:py-7 first:*:pt-0 last:*:pb-0">
            <div className="flex justify-between text-center">
              <AutoStart />
            </div>

            <div className="flex justify-between text-center">
              <BackgroundFileCreate />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackGroundSettings;

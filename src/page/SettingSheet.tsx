import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ROUTER_PATHS } from '@/constants';
import { trpcReact } from '@/trpc';
import { AlertTriangle, Bed, Check, ChevronRight, Info } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { match } from 'ts-pattern';
import { AboutApp } from './setting/AboutApp';
import BackGroundSettings from './setting/BackGroundSettings';
import Debug from './setting/Debug';
import { LicenseDisplay } from './setting/LicenseDisplay';
import VRChatLogPathSetting from './setting/VRChatLogPathSetting';

const TAB_KEY_LIST = [
  'none',
  'aboutApp',
  'vrcLogPathSetting',
  'backGround',
  'lisence',
  'debug',
] as const;
const TAB_KEYS = {
  none: 'none',
  backGround: 'backGround',
  lisence: 'lisence',
  aboutApp: 'aboutApp',
  vrcLogPathSetting: 'vrcLogPathSetting',
  debug: 'debug',
} as { [type in (typeof TAB_KEY_LIST)[number]]: type };
const getTabLabel = (key: (typeof TAB_KEY_LIST)[number]) =>
  match(key)
    .with('none', () => null)
    .with('backGround', () => 'backGround')
    .with('lisence', () => 'lisence')
    .with('aboutApp', () => 'About')
    .with('debug', () => 'Debug')
    .with('vrcLogPathSetting', () => 'vrcLogPathSetting')
    .exhaustive();
const getTabContent = (key: (typeof TAB_KEY_LIST)[number]) =>
  match(key)
    .with('none', () => null)
    .with('backGround', () => <BackGroundSettings />)
    .with('lisence', () => <LicenseDisplay />)
    .with('aboutApp', () => <AboutApp />)
    .with('debug', () => <Debug />)
    .with('vrcLogPathSetting', () => <VRChatLogPathSetting />)
    .exhaustive();

const SettingSheet = () => {
  const [activeTab, setActiveTab] =
    React.useState<(typeof TAB_KEY_LIST)[number]>('aboutApp');

  const Content = ({ content }: { content?: React.ReactNode }) => {
    if (content === null) {
      return (
        <TabsList className="flex flex-col space-y-3 content-start justify-start justify-items-start">
          {TAB_KEY_LIST.map((key) => {
            const tabLabel = getTabLabel(key);
            if (tabLabel === null) return null;
            return (
              <div>
                <TabsTrigger
                  value={TAB_KEYS[key]}
                  key={`trigger-${key}`}
                  className="w-full bg-secondary text-start p-4"
                >
                  {getTabLabel(key)}
                </TabsTrigger>
              </div>
            );
          })}
        </TabsList>
      );
    }
    return content;
  };

  const activeTabLabel = getTabLabel(activeTab);

  return (
    <SheetContent side="bottom" className="h-2/3 bg-popover rounded-t-lg">
      <Tabs
        className="h-full"
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as (typeof TAB_KEY_LIST)[number])
        }
      >
        <div className="flex h-full">
          <div className="flex-1 h-full">
            <div className="text-lg">
              <span className="transition-all">
                {activeTabLabel ? (
                  <Button
                    variant="link"
                    className="rounded-lg"
                    onClick={() => setActiveTab('none')}
                  >
                    <span>Settings</span>
                  </Button>
                ) : (
                  <span className="font-bold">Settings</span>
                )}
              </span>
              {activeTabLabel && <span> / {activeTabLabel}</span>}
            </div>
            {TAB_KEY_LIST.map((key) => (
              <TabsContent value={TAB_KEYS[key]} key={key} className="h-full">
                <div className="h-full flex-grow overflow-y">
                  <Content content={getTabContent(key)} />
                </div>
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>

      {/* <Setting /> */}
    </SheetContent>
  );
};

export default SettingSheet;

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
  'aboutApp',
  'vrcLogPathSetting',
  'backGround',
  'lisence',
  'debug',
] as const;
const TAB_KEYS = {
  backGround: 'backGround',
  lisence: 'lisence',
  aboutApp: 'aboutApp',
  vrcLogPathSetting: 'vrcLogPathSetting',
  debug: 'debug',
} as { [type in (typeof TAB_KEY_LIST)[number]]: type };
const getTabLabel = (key: (typeof TAB_KEY_LIST)[number]) =>
  match(key)
    .with('backGround', () => 'backGround')
    .with('lisence', () => 'lisence')
    .with('aboutApp', () => 'About')
    .with('debug', () => 'Debug')
    .with('vrcLogPathSetting', () => 'vrcLogPathSetting')
    .exhaustive();
const getTabContent = (key: (typeof TAB_KEY_LIST)[number]) =>
  match(key)
    .with('backGround', () => <BackGroundSettings />)
    .with('lisence', () => <LicenseDisplay />)
    .with('aboutApp', () => <AboutApp />)
    .with('debug', () => <Debug />)
    .with('vrcLogPathSetting', () => <VRChatLogPathSetting />)
    .exhaustive();

const SettingSheet = () => {
  const [activeTab, setActiveTab] =
    React.useState<(typeof TAB_KEY_LIST)[number]>('aboutApp');
  return (
    <SheetContent side="bottom" className="h-2/3">
      <Tabs
        defaultValue={TAB_KEYS.aboutApp}
        className="h-full"
        onValueChange={(value) =>
          setActiveTab(value as (typeof TAB_KEY_LIST)[number])
        }
      >
        <div className="flex h-full">
          <TabsList>
            {/* <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="about-app">About</TabsTrigger> */}
            {TAB_KEY_LIST.map((key) => (
              <TabsTrigger value={TAB_KEYS[key]} key={key}>
                {getTabLabel(key)}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="flex-1 h-full">
            <div className="text-lg">
              <span className="font-bold">Settings</span>
              <span> / {activeTab}</span>
            </div>
            {TAB_KEY_LIST.map((key) => (
              <TabsContent value={TAB_KEYS[key]} key={key}>
                <div className="flex flex-col h-full flex-grow overflow-y">
                  {getTabContent(key)}
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

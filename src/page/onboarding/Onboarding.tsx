import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTER_PATHS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateJoinInfoComponent from '@/components/CreateJoinInfo';
import { OnBordingSetting } from './setting';

function Onboarding() {
  const [tabValue, setTabValue] = React.useState('0');
  const handleChangeTab = (value: string) => {
    setTabValue(value);
  };
  return (
    <div className="flex-auto h-full flex flex-col">
      <Tabs value={tabValue} onValueChange={handleChangeTab} className="flex-auto h-full flex flex-col">
        <TabsList>
          <TabsTrigger value="0">・</TabsTrigger>
          <TabsTrigger value="1">・</TabsTrigger>
          <TabsTrigger value="2">・</TabsTrigger>
          <TabsTrigger value="3">・</TabsTrigger>
          <TabsTrigger value="4">・</TabsTrigger>
        </TabsList>
        <div className="flex flex-col justify-center items-center space-y-8 h-full grow">
          <TabsContent value="0">
            <p>ようこそ</p>
            <p>イメージ画像</p>
          </TabsContent>
          <TabsContent value="1">
            <p>写真が保存されているフォルダに画像ファイルを生成することで、訪れたワールドがひと目で分かり、</p>
            <p>写真が撮影された場所がわかるようになります</p>
          </TabsContent>
          <TabsContent value="2">
            <OnBordingSetting />
          </TabsContent>
          <TabsContent value="3">
            <CreateJoinInfoComponent />
          </TabsContent>
          <TabsContent value="4">
            <p>バックグラウンドで写真の撮影場所を常に記録する</p>
            <Link to={ROUTER_PATHS.PHOTO_LIST} />
          </TabsContent>
        </div>
        <Button onClick={() => setTabValue(`${Number(tabValue) + 1}`)} className="flex-none shrink-0">
          次へ
        </Button>
      </Tabs>
    </div>
  );
}

export default Onboarding;

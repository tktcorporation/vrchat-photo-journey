import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTER_PATHS } from '@/constants';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CreateJoinInfoComponent from '@/components/CreateJoinInfo';

function Onboarding() {
  const [tabValue, setTabValue] = React.useState('0');
  const handleChangeTab = (value: string) => {
    setTabValue(value);
  };
  return (
    <div className="flex-auto h-full">
      <Tabs value={tabValue} onValueChange={handleChangeTab}>
        <TabsList>
          <TabsTrigger value="0">・</TabsTrigger>
          <TabsTrigger value="1">・</TabsTrigger>
          <TabsTrigger value="2">・</TabsTrigger>
          <TabsTrigger value="3">・</TabsTrigger>
          <TabsTrigger value="4">・</TabsTrigger>
        </TabsList>
        <div className="flex flex-col justify-center items-center space-y-8 h-full">
          <TabsContent value="0">
            <p>ようこそ</p>
            <p>イメージ画像</p>
            <Button onClick={() => setTabValue(`${Number(tabValue) + 1}`)}>次へ</Button>
          </TabsContent>
          <TabsContent value="1">
            <p>写真が保存されているフォルダに画像ファイルを生成することで、訪れたワールドがひと目で分かり、</p>
            <p>写真が撮影された場所がわかるようになります</p>
            <Button onClick={() => setTabValue(`${Number(tabValue) + 1}`)}>次へ</Button>
          </TabsContent>
          <TabsContent value="2">
            <p>アプリケーションを使う準備が整っているかを確認します</p>
          </TabsContent>
          <TabsContent value="3">
            <CreateJoinInfoComponent />
          </TabsContent>
          <TabsContent value="4">
            <p>バックグラウンドで写真の撮影場所を常に記録する</p>
            <Link to={ROUTER_PATHS.PHOTO_LIST}>
              <Button>次へ</Button>
            </Link>
          </TabsContent>
        </div>
        <Button onClick={() => setTabValue(`${Number(tabValue) + 1}`)}>次へ</Button>
      </Tabs>
    </div>
  );
}

export default Onboarding;

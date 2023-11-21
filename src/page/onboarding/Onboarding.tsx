import CreateJoinInfoComponent from "@/components/CreateJoinInfo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ROUTER_PATHS } from "@/constants";
import React from "react";
import { Link } from "react-router-dom";
import { OnBordingSetting } from "./setting";

function Onboarding() {
    const [tabValue, setTabValue] = React.useState("0");
    const handleChangeTab = (value: string) => {
        setTabValue(value);
    };
    return (
        <div className="flex-auto h-full flex flex-col">
            <Tabs
                value={tabValue}
                onValueChange={handleChangeTab}
                className="flex-auto h-full flex flex-col"
            >
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
                        <p>
                            訪れたワールドと写真が撮影された場所をひとめでわかるようにします
                        </p>
                        <p>イメージ画像</p>
                        <p>写真と同じ場所にワールド名のサムネイル画像を生成</p>
                    </TabsContent>
                    <TabsContent value="2">
                        <p>初期設定を行いましょう</p>
                        <p>すべての設定をグリーンにしてください</p>
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
                <Button
                    onClick={() => setTabValue(`${Number(tabValue) + 1}`)}
                    className="flex-none shrink-0"
                >
                    次へ
                </Button>
            </Tabs>
        </div>
    );
}

export default Onboarding;

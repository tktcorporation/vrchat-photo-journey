import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/v1/components/ui/breadcrumb';
import { ROUTER_PATHS } from '@/v1/constants';

export const SettingBreadcrumb = () => {
  const breadcrumbNameMap = {
    [ROUTER_PATHS.HOME]: 'HOME',
    [ROUTER_PATHS.SETTING]: '設定',
    [ROUTER_PATHS.SETTING_ABOUT_APP]: 'アプリケーション情報',
    [ROUTER_PATHS.SETTING_VRCHAT_LOG_PATH]: 'VRChatログパス',
    [ROUTER_PATHS.SETTING_BACKGROUND_EXECUTION]: 'バックグラウンド設定',
    [ROUTER_PATHS.SETTING_ABOUT_APP_LICENSE]: 'ライセンス',
  };
  const location = useLocation();
  const pathSnippets = location.pathname.split('/').filter((i) => i);

  // パンくずリストのアイテムを生成
  const breadcrumbItems = pathSnippets.map((_, index) => {
    const url = `/${pathSnippets
      .slice(0, index + 1)
      .join('/')}` as keyof typeof breadcrumbNameMap;
    const isLast = index === pathSnippets.length - 1;

    return (
      <>
        <BreadcrumbItem key={url}>
          {isLast ? (
            <BreadcrumbPage className="text-lg">
              {breadcrumbNameMap[url]}
            </BreadcrumbPage>
          ) : (
            <BreadcrumbLink>
              <Link to={url} className="text-lg">
                {breadcrumbNameMap[url]}
              </Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {isLast ? null : <BreadcrumbSeparator />}
      </>
    );
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbItems}
        {pathSnippets.length === 0 && (
          <BreadcrumbItem>
            <BreadcrumbPage className="text-lg">設定</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

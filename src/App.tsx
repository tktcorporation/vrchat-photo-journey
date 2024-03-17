import Onboarding from '@/page/onboarding/Onboarding';
import type React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Template from './Template';
import AppBar from './components/AppBar';
import ClearSettings from './page/ClearSettings';
import Setting from './page/Setting';
import PhotoList from './page/photoList/PhotoList';

import { ErrorFallback } from './ErrorBoundary';

import DefaultLayout from './components/DefaultLayout';
import { ROUTER_PATHS } from './constants';
import CreatedResult from './page/CreatedResult';
import { AboutApp } from './page/setting/AboutApp';
import BackGroundSettings from './page/setting/BackGroundSettings';
import { LicenseDisplay } from './page/setting/LicenseDisplay';
import VRChatLogPathSetting from './page/setting/VRChatLogPathSetting';
import VRChatPhotoPathSetting from './page/setting/VRChatPhotoPathSetting';
import TrpcWrapper from './trpcWrapper';

function Router() {
  return (
    <TrpcWrapper>
      <Template>
        <ErrorBoundary
          FallbackComponent={ErrorFallback}
          onError={(error: Error, info: React.ErrorInfo) => {
            window.Main.sendErrorMessage(
              `Error caught by ErrorBoundary: ${error.toString()}. Stack trace: ${
                info.componentStack
              }`,
            );
          }}
        >
          <HashRouter>
            <DefaultLayout>
              <Routes>
                <Route path={ROUTER_PATHS.ONBORDING} element={<Onboarding />} />
                <Route path={ROUTER_PATHS.HOME} element={<PhotoList />} />
                <Route path={ROUTER_PATHS.PHOTO_LIST} element={<PhotoList />} />
                <Route
                  path={ROUTER_PATHS.CREATED_RESULT}
                  element={<CreatedResult />}
                />
                <Route path={ROUTER_PATHS.SETTING} element={<Setting />} />
                <Route
                  path={ROUTER_PATHS.SETTING_ABOUT_APP}
                  element={<AboutApp />}
                />
                <Route
                  path={ROUTER_PATHS.SETTING_ABOUT_APP_LICENSE}
                  element={<LicenseDisplay />}
                />
                <Route
                  path={ROUTER_PATHS.SETTING_VRCHAT_LOG_PATH}
                  element={<VRChatLogPathSetting />}
                />
                <Route
                  path={ROUTER_PATHS.SETTING_VRCHAT_PHOTO_PATH}
                  element={<VRChatPhotoPathSetting />}
                />
                <Route
                  path={ROUTER_PATHS.SETTING_BACKGROUND_EXECUTION}
                  element={<BackGroundSettings />}
                />
                <Route
                  path={ROUTER_PATHS.CLEAR_SETTINGS}
                  element={<ClearSettings />}
                />
              </Routes>
            </DefaultLayout>
          </HashRouter>
        </ErrorBoundary>
      </Template>
    </TrpcWrapper>
  );
}

function App() {
  return (
    <div className="flex flex-col h-screen font-sans">
      <div className="shadow-sm z-10">{window.Main && <AppBar />}</div>
      <div className="overflow-hidden flex-grow">
        {window.Main && <Router />}
      </div>
    </div>
  );
}

export default App;

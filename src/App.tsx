import type React from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { HashRouter, Route, Routes } from 'react-router-dom';
import Template from './Template';
import AppBar from './components/AppBar';
import ClearSettings from './page/ClearSettings';
import Setting from './page/Setting';

import { ErrorFallback } from './ErrorBoundary';

import DefaultLayout from './components/DefaultLayout';
import { ROUTER_PATHS } from './constants';
import PhotoSelector from './page/Photo';
import { Start } from './page/Start';
import { AboutApp } from './page/setting/AboutApp';
import BackGroundSettings from './page/setting/BackGroundSettings';
import Debug from './page/setting/Debug';
import { LicenseDisplay } from './page/setting/LicenseDisplay';
import VRChatLogPathSetting from './page/setting/VRChatLogPathSetting';
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
                <Route path={ROUTER_PATHS.SETTING} element={<Setting />} />
                <Route path={ROUTER_PATHS.START} element={<Start />} />
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
                  path={ROUTER_PATHS.SETTING_BACKGROUND_EXECUTION}
                  element={<BackGroundSettings />}
                />
                <Route
                  path={ROUTER_PATHS.SETTING_DEV_DEBUG}
                  element={<Debug />}
                />
                <Route
                  path={ROUTER_PATHS.CLEAR_SETTINGS}
                  element={<ClearSettings />}
                />
                <Route path={ROUTER_PATHS.HOME} element={<PhotoSelector />} />
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

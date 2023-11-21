import Onboarding from "@/page/onboarding/Onboarding";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ipcLink } from "electron-trpc/renderer";
import React from "react";
import { HashRouter, Route, Routes } from "react-router-dom";
import Template from "./Template";
import AppBar from "./components/AppBar";
import ClearSettings from "./page/ClearSettings";
import CreateJoinInfo from "./page/CreateJoinInfo";
import PhotoList from "./page/PhotoList";
import Setting from "./page/Setting";

import DefaultLayout from "./components/DefaultLayout";
import { ROUTER_PATHS } from "./constants";
import CreatedResult from "./page/CreatedResult";
import VRChatLogPathSetting from "./page/setting/VRChatLogPathSetting";
import VRChatPhotoPathSetting from "./page/setting/VRChatPhotoPathSetting";
import { trpcReact } from "./trpc";

const queryClient = new QueryClient();
const trpcClient = trpcReact.createClient({
  links: [ipcLink()],
});

function Router() {
  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Template>
          <HashRouter>
            <DefaultLayout>
              <Routes>
                <Route path={ROUTER_PATHS.ONBORDING} element={<Onboarding />} />
                <Route
                  path={ROUTER_PATHS.CREATE_JOIN_INFO}
                  element={<CreateJoinInfo />}
                />
                <Route path={ROUTER_PATHS.PHOTO_LIST} element={<PhotoList />} />
                <Route
                  path={ROUTER_PATHS.CREATED_RESULT}
                  element={<CreatedResult />}
                />
                <Route path={ROUTER_PATHS.SETTING} element={<Setting />} />
                <Route
                  path={ROUTER_PATHS.SETTING_VRCHAT_LOG_PATH}
                  element={<VRChatLogPathSetting />}
                />
                <Route
                  path={ROUTER_PATHS.SETTING_VRCHAT_PHOTO_PATH}
                  element={<VRChatPhotoPathSetting />}
                />
                <Route
                  path={ROUTER_PATHS.CLEAR_SETTINGS}
                  element={<ClearSettings />}
                />
              </Routes>
            </DefaultLayout>
          </HashRouter>
        </Template>
      </QueryClientProvider>
    </trpcReact.Provider>
  );
}

function App() {
  return (
    <div className="flex flex-col h-screen">
      {window.Main && <AppBar />}
      {window.Main && <Router />}
    </div>
  );
}

export default App;

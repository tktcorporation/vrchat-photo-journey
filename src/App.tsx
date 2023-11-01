import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ipcLink } from 'electron-trpc/renderer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppBar from './component/AppBar';
import MainContainer from './page/MainContainer';
import CreateJoinInfo from './page/CreateJoinInfo';
import ClearSettings from './page/ClearSettings';

import { trpcReact } from './trpc';

const queryClient = new QueryClient();
const trpcClient = trpcReact.createClient({
  links: [ipcLink()]
});

function Router() {
  return (
    <trpcReact.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <Routes>
            <Route path="/" element={<MainContainer />} />
            <Route path="/create-join-info" element={<CreateJoinInfo />} />
            <Route path="/clear-settings" element={<ClearSettings />} />
          </Routes>
        </HashRouter>
      </QueryClientProvider>
    </trpcReact.Provider>
  );
}

function App() {
  return (
    <div className="flex flex-col h-screen">
      {window.Main && <AppBar />}
      <Toaster />
      {window.Main && <Router />}
    </div>
  );
}

export default App;

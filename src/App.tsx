import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppBar from './component/AppBar';
import MainContainer from './page/MainContainer';
import CreateJoinInfo from './page/CreateJoinInfo';

function Router() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MainContainer />} />
        <Route path="/create-join-info" element={<CreateJoinInfo />} />
      </Routes>
    </HashRouter>
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

import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppBar from './AppBar';
import MainContainer from './MainContainer';

function App() {
  return (
    <div className="flex flex-col h-screen">
      {window.Main && <AppBar />}
      <Toaster />
      {window.Main && <MainContainer />}
    </div>
  );
}

export default App;

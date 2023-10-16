import React from 'react';
import { Toaster } from 'react-hot-toast';
import AppBar from './AppBar';
import MainContainer from './MainContainer';
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <div className="flex flex-col h-screen">
      <ErrorBoundary>
        {window.Main && <AppBar />}
        <Toaster />
        {window.Main && <MainContainer />}
      </ErrorBoundary>
    </div>
  );
}

export default App;
